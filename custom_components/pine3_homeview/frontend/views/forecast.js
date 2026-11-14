// Pine3 Homeview - Weather pill and cards, IPMA warnings and the forecast sheet.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { WEATHER_PT, WEATHER_ICON, esc, dom } from "../const.js";
import { t, num, locale } from "../i18n.js";
import { Weather } from "../weather.js";
import { cap, tempColor } from "../util.js";

export class WeatherViewMixin {
  _wx() { return this._weather.current(this._hass, this._cfg().weather_entity); }
  _wxLabel(cond) { return WEATHER_PT[cond] ? t(WEATHER_PT[cond]) : cond; }
  _wxPill() {
    const w = this._wx();
    if (!w) return `<div class="wpill glass" data-wx><ha-icon icon="mdi:weather-cloudy-clock"></ha-icon><span>${t("A carregar o tempo…")}</span></div>`;
    const al = this._ipmaAlert();
    return `<div class="wpill glass" data-wx title="${t("Previsão")}"><ha-icon icon="${WEATHER_ICON[w.cond] || "mdi:weather-partly-cloudy"}"></ha-icon><b>${num(Math.round(w.temp ?? 0))}°</b><span>${esc(this._wxLabel(w.cond))}</span>${al ? `<ha-icon class="wx-al lv-${al.level}" icon="mdi:alert"></ha-icon>` : ""}</div>`;
  }
  async _openForecast() {
    this._modal = "_wx";
    this._fc = null;
    this._render();
    this._fc = await this._weather.forecast(this._hass, this._cfg().weather_entity);
    if (this._modal === "_wx") this._render();
  }
  // ---------- IPMA (Portuguese weather service): warnings, UV index and fire risk ----------
  _ipma() {
    const h = this._hass, st = h.states;
    const ids = Object.keys(st).filter((i) => dom(i) === "sensor" && (h.entities?.[i]?.platform === "ipma" || /ipma/.test(i)));
    const levels = ["green", "yellow", "orange", "red"];
    return {
      alert: ids.find((i) => st[i].attributes.awarenessTypeName != null || (levels.includes(st[i].state) && /alert|aviso|warning/.test(i))),
      uv: ids.find((i) => /uv/.test(i)),
      fire: ids.find((i) => /rcm|fire|incend/.test(i)),
    };
  }
  /**
   * The active IPMA warnings (yellow / orange / red), most severe first. The integration's sensor holds only
   * the first one; when it names its area (idAreaAviso), all of them are asked of the integration's backend
   * (pine3_homeview/ipma_warnings, every 10 minutes) and that list wins.
   */
  /** IPMA warnings, most severe first; never breaks the panel if the IPMA entity changes shape. */
  _ipmaAlerts() {
    try { return this._ipmaList(); } catch (e) { console.warn("Pine3 Homeview: IPMA warnings", e); return []; }
  }
  _ipmaList() {
    const id = this._ipma().alert, s = id && this._s(id);
    if (!s) return [];
    const a = s.attributes, when = (v) => (v ? new Date(String(v).replace(" ", "T")) : null);
    const norm = (w) => ({ level: w.awarenessLevelID, type: w.awarenessTypeName || "", text: w.text || "", start: when(w.startTime), end: when(w.endTime) });
    const area = a.idAreaAviso;
    if (area && this._model) {
      const c = this._ipmaW;
      if ((!c || c.area !== area || Date.now() - c.at > 10 * 60e3) && !this._ipmaLoading) {
        this._ipmaLoading = true;
        this._hass.callWS({ type: "pine3_homeview/ipma_warnings", area })
          .then((r) => { this._ipmaW = { area, at: Date.now(), list: r.warnings || [] }; })
          .catch(() => { this._ipmaW = { area, at: Date.now(), list: null }; })
          .finally(() => { this._ipmaLoading = false; if (this._view === "home" || this._modal === "_wx") this._render(); });
      }
    }
    const rank = { red: 3, orange: 2, yellow: 1 };
    const fromApi = area && this._ipmaW?.area === area && Array.isArray(this._ipmaW.list) ? this._ipmaW.list.map(norm) : null;
    const list = fromApi ?? (["yellow", "orange", "red"].includes(s.state) ? [norm({ ...a, awarenessLevelID: s.state })] : []);
    return list.filter((w) => rank[w.level] && !(w.end && w.end < new Date()))
      .sort((x, y) => rank[y.level] - rank[x.level] || (x.start || 0) - (y.start || 0));
  }
  _ipmaAlert() { return this._ipmaAlerts()[0] || null; }
  _alertFmt(d) {
    const today = d.toDateString() === new Date().toDateString();
    const hm = d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    return today ? hm : `${d.toLocaleDateString(locale(), { weekday: "short" })} ${hm}`;
  }
  _alertWhen(al) {
    if (al.start && al.start > new Date()) return t("a partir de {t}", { t: this._alertFmt(al.start) });
    return al.end && !isNaN(al.end) ? t("até {t}", { t: this._alertFmt(al.end) }) : "";
  }
  /** A warning as a strip ("+N" for the others), or in full with its start, end and text. */
  _alertBanner(al, full = false, more = 0) {
    const lv = { yellow: t("Aviso amarelo"), orange: t("Aviso laranja"), red: t("Aviso vermelho") }[al.level];
    const period = full ? [al.start && !isNaN(al.start) ? `${t("Começa")} ${this._alertFmt(al.start)}` : "", al.end && !isNaN(al.end) ? `${t("Termina")} ${this._alertFmt(al.end)}` : ""].filter(Boolean).join(" · ") : this._alertWhen(al);
    return `<div class="wx-alert lv-${al.level} ${full ? "full" : ""}"><ha-icon icon="mdi:alert"></ha-icon><div class="wx-at"><b>${esc(lv)}${al.type ? ` · ${esc(al.type)}` : ""}</b>${period ? `<small>${esc(period)}</small>` : ""}${full && al.text ? `<p>${esc(al.text)}</p>` : ""}</div>${more ? `<span class="wx-more">+${more}</span>` : ""}</div>`;
  }

  /** The forecast for the home weather card, refreshed every 15 minutes (loads in the background, then redraws). */
  _homeForecast() {
    const c = this._hfc;
    if ((!c || Date.now() - c.at > 15 * 60e3) && !this._hfcLoading) {
      this._hfcLoading = true;
      this._weather.forecast(this._hass, this._cfg().weather_entity)
        .then((fc) => { this._hfc = { fc, at: Date.now() }; })
        .catch(() => { this._hfc = { fc: { hourly: [], daily: [] }, at: Date.now() }; })
        .finally(() => { this._hfcLoading = false; if (this._view === "home" && !this._drag) this._render(); });
    }
    return c?.fc || null;
  }
  /**
   * Weather card for the home screen: now (big temperature, condition, today's high/low and rain),
   * the next hours and tomorrow. "wide" lays them side by side, "tall" stacks them. A tap opens the full forecast.
   */
  _wxCard(kind) {
    const w = this._wx(), fc = this._homeForecast();
    const icon = (c) => WEATHER_ICON[c] || "mdi:weather-cloudy";
    const deg = (v) => (v == null ? "–" : `${num(Math.round(v))}°`);
    const rain = (p) => (p != null && p >= 10 ? `<small class="pp"><ha-icon icon="mdi:water-outline"></ha-icon>${Math.round(p)}%</small>` : "");
    const daily = fc?.daily || [];
    const isToday = (d) => d && new Date(d.time).toDateString() === new Date().toDateString();
    const today = isToday(daily[0]) ? daily[0] : null, tom = today ? daily[1] : daily[0];
    const hrs = (fc?.hourly || []).filter((f) => f.time >= Date.now() - 30 * 60e3).slice(0, kind === "wide" ? 4 : 5);
    const hh = (d) => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    const now = w ? `<div class="wx-now"><ha-icon icon="${icon(w.cond)}"></ha-icon><div class="wx-t"><b>${deg(w.temp)}</b><span>${esc(this._wxLabel(w.cond))}</span>
        ${today ? `<small>${t("Máx.")} ${deg(today.temp)} · ${t("Mín.")} ${deg(today.low)}</small>` : ""}</div></div>`
      : `<div class="wx-now"><ha-icon icon="mdi:weather-cloudy-clock"></ha-icon><div class="wx-t"><span>${t("A carregar o tempo…")}</span></div></div>`;
    const hours = hrs.length ? `<div class="wx-hrs">${hrs.map((f) => `<div><small>${hh(f.time)}</small><ha-icon icon="${icon(f.cond)}"></ha-icon><b>${deg(f.temp)}</b>${rain(f.precip)}</div>`).join("")}</div>`
      : fc ? "" : `<div class="wx-hrs wx-wait">${t("A carregar a previsão…")}</div>`;
    const next = tom ? `<div class="wx-tom"><small>${t("Amanhã")}</small><div class="wx-tl"><ha-icon icon="${icon(tom.cond)}"></ha-icon><b>${deg(tom.temp)}</b><span>${deg(tom.low)}</span></div>${rain(tom.precip)}</div>` : "";
    const als = this._ipmaAlerts(), al = als[0];
    return `<div class="wxc ${kind} glass ${al ? "has-alert" : ""}" data-wx title="${t("Previsão")}">${now}${hours}${next}${al ? this._alertBanner(al, false, als.length - 1) : ""}</div>`;
  }

  _forecastSheet() {
    const w = this._wx(), fc = this._fc;
    const src = w?.source.kind === "entity" ? this._s(w.source.id)?.attributes.friendly_name || w.source.id : "Open-Meteo";
    const icon = (c) => WEATHER_ICON[c] || "mdi:weather-cloudy";
    const deg = (v) => (v == null ? "–" : `${num(Math.round(v))}°`);
    const hm = (d) => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    const daily = fc?.daily || [], hourly = fc?.hourly || [];
    const today = daily[0] && new Date(daily[0].time).toDateString() === new Date().toDateString() ? daily[0] : null;
    // now: big temperature, condition, today's high / low, then chips (rain, sunrise, sunset, humidity, wind)
    const sun = this._s("sun.sun")?.attributes || {}, at = (v) => (v ? new Date(v) : null);
    const rise = at(sun.next_rising), set = at(sun.next_setting);
    const chip = (ic, txt) => `<span><ha-icon icon="${ic}"></ha-icon>${txt}</span>`;
    const chips = [today?.precip != null ? chip("mdi:water-outline", `${t("Chuva")} <b>${Math.round(today.precip)}%</b>`) : "",
      rise ? chip("mdi:weather-sunset-up", `${t("Nascer")} <b>${hm(rise)}</b>`) : "", set ? chip("mdi:weather-sunset-down", `${t("Pôr")} <b>${hm(set)}</b>`) : "",
      w?.humidity != null ? chip("mdi:water-percent", `${t("Humidade")} <b>${Math.round(w.humidity)}%</b>`) : "",
      w?.wind != null ? chip("mdi:weather-windy", `${t("Vento")} <b>${Math.round(w.wind)} ${esc(w.windUnit)}</b>`) : ""].join("");
    const now = w ? `<div class="fnow"><ha-icon icon="${icon(w.cond)}"></ha-icon><b>${num(Math.round(w.temp))}°</b><div><span>${esc(this._wxLabel(w.cond))}</span>
        ${today ? `<small>${t("Máx.")} ${deg(today.temp)} · ${t("Mín.")} ${deg(today.low)}</small>` : ""}</div></div>` : "";
    // warnings (most severe first), "no warnings", UV and fire risk
    const als = this._ipmaAlerts(), ip = this._ipma();
    const uv = ip.uv && this._s(ip.uv), fire = ip.fire && this._s(ip.fire);
    const extra = [uv && uv.state !== "unknown" ? chip("mdi:sun-wireless-outline", `${t("Índice UV")} <b>${esc(uv.state)}</b>`) : "",
      fire && fire.state !== "unknown" ? chip("mdi:fire", `${t("Risco de incêndio")} <b>${esc(this._fmtState(ip.fire))}</b>`) : ""].join("");
    const warn = als.length ? `<div class="sub">${t("Avisos")} <span class="badge">${als.length}</span></div>${als.map((x) => this._alertBanner(x, true)).join("")}`
      : ip.alert ? `<div class="wx-ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${t("Sem avisos do IPMA")}</div>` : "";
    const left = `${now}${chips ? `<div class="wx-chips">${chips}</div>` : ""}${warn}${extra ? `<div class="wx-chips">${extra}</div>` : ""}
      <div class="fsrc">${t("Fonte")}: ${esc(src)}</div>`;
    // next hours as small cards, next days with a temperature range bar on the week's scale
    const hour = (f, k) => `<div class="fh"><small>${k === 0 && f.time - Date.now() < 3600e3 ? t("Agora") : hm(f.time)}</small><ha-icon icon="${icon(f.cond)}"></ha-icon><b>${deg(f.temp)}</b><small class="pp">${f.precip != null ? `${Math.round(f.precip)}%` : ""}</small></div>`;
    const lows = daily.map((d) => d.low ?? d.temp).filter((v) => v != null), highs = daily.map((d) => d.temp).filter((v) => v != null);
    const L = Math.min(...lows), H = Math.max(...highs), span = H - L || 1;
    const pos = (v) => Math.max(0, Math.min(100, ((v - L) / span) * 100));
    const day = (f, k) => {
      const lo = f.low ?? f.temp, hi = f.temp;
      const dot = k === 0 && today && w?.temp != null ? `<i class="fdot" style="left:${pos(w.temp)}%"></i>` : "";
      return `<div class="fd"><span>${k === 0 && today ? t("Hoje") : cap(f.time.toLocaleDateString(locale(), { weekday: "short" }).replace(".", "").slice(0, 3))}</span><ha-icon icon="${icon(f.cond)}"></ha-icon>
        <small class="pp">${f.precip != null ? Math.round(f.precip) + "%" : ""}</small><small>${deg(lo)}</small>
        <div class="frng"><i style="left:${pos(lo)}%;width:${Math.max(4, pos(hi) - pos(lo))}%;background:linear-gradient(90deg,${tempColor(lo)},${tempColor(hi)})"></i>${dot}</div><b>${deg(hi)}</b></div>`;
    };
    const main = !fc ? `<div class="empty" style="text-align:center">${t("A carregar a previsão…")}</div>` : `
        ${hourly.length ? `<div class="sub">${t("Próximas horas")}</div><div class="fhs">${hourly.map(hour).join("")}</div>` : ""}
        ${daily.length ? `<div class="sub">${t("Próximos dias")}</div><div class="fds">${daily.map(day).join("")}</div>` : ""}
        ${!hourly.length && !daily.length ? `<div class="empty">${t("Sem previsão disponível.")}</div>` : ""}`;
    // wide screens: now, warnings, UV and fire risk on the left, the forecast on the right
    return `<div class="ov ${this._ovEnter("_wx")}" data-close><div class="sheet wide cols fcst">
      <div class="hd"><div style="flex:1;min-width:0"><div class="nm">${t("Previsão do tempo")}</div></div><button class="sh-x" data-closex title="${t("Fechar")}" aria-label="${t("Fechar")}"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="sh-main">${left}</div><div class="sh-side">${main}</div>
    </div></div>`;
  }
}
