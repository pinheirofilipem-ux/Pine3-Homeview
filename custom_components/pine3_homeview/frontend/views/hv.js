// Pine3 Homeview - the faces drawn as in the project plan (docs/plano.html): full screen, no dock (it
// comes up with the ⋯ button), sizes in a unit tied to the screen (--u, 1/100 of the width on a 5:3
// tablet such as the Galaxy Tab A7), so each face keeps the plan's proportions on any screen.
// Faces: Painel, Mosaico, Mosaico+, Relógio e agenda and Fluxo.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { WEATHER_ICON, esc, dom } from "../const.js";
import { t, tp, num, locale } from "../i18n.js";
import { cap } from "../util.js";
import { analogClock } from "./mosaic.js";
import { FACES } from "./faces.js";

const ic = (icon) => `<ha-icon icon="${icon}"></ha-icon>`;
const deg = (v) => (v == null || !Number.isFinite(Number(v)) ? "–" : `${num(Math.round(v))}°`);

export class HvMixin {

  /** Wraps a face: full screen, its own background, the dots and the ⋯ button. */
  _hvFrame(cls, body, { wake = false } = {}) {
    const list = this._faces(), id = this._faceId();
    const dots = !this._ambient && !this._edit && list.length > 1
      ? `<div class="hv-dots" role="tablist" aria-label="${t("Faces")}">${list.map((f) =>
        `<button role="tab" data-face="${f}" class="${f === id ? "on" : ""}" aria-selected="${f === id}" aria-label="${esc(t(FACES[f]?.label || f))}"><i></i></button>`).join("")}</div>`
      : "";
    const more = this._ambient || this._edit ? "" : `<button class="hv-more ${this._dockOpen ? "on" : ""}" data-hvmore aria-label="${t("Mais")}">${ic(this._dockOpen ? "mdi:close" : "mdi:dots-horizontal")}</button>
      ${this._dockOpen ? `<div class="hv-tools">${this._editBtn()}${this._fsSupported() ? `<div class="iconbtn" data-fs title="${t("Ecrã inteiro")}">${ic(document.fullscreenElement ? "mdi:fullscreen-exit" : "mdi:fullscreen")}</div>` : ""}${this._gear()}</div>` : ""}`;
    return `<div class="hv ${cls} ${this._ambient ? "amb" : ""}" ${wake ? "data-wake" : ""}>${body}${dots}${more}</div>`;
  }

  // ---------- shared pieces ----------
  _hvRoomOf(id, rooms) { const r = rooms.find((x) => x.ents.includes(id)); return r && r.id !== "_none" ? this._roomName(r) : ""; }

  /** A device tile (S): icon, name, room · state; cream when on. Lights and switches get a power button. */
  _hvTile(id, rooms, size = "s") {
    const d = dom(id), s = this._s(id), on = this._isOn(id);
    if (d === "scene") {
      const sOn = this._sceneOn(id);
      return `<div class="hv-t hv-scn ${sOn ? "on" : ""}" data-scene="${esc(id)}">${ic(s.attributes.icon || "mdi:creation-outline")}<div class="nm">${esc(this._name(id))}</div><div class="sv">${sOn ? t("Cena · ativa") : t("Cena")}</div></div>`;
    }
    const power = ["light", "switch", "fan", "input_boolean"].includes(d);
    const sub = [this._hvRoomOf(id, rooms), this._stateText(id)].filter(Boolean).join(" · ");
    let extra = "";
    if (size !== "s" && d === "light" && on && s.attributes.brightness != null) extra = `<div class="hv-bar"><i style="width:${Math.round((s.attributes.brightness / 255) * 100)}%"></i></div>`;
    if (size !== "s" && d === "cover" && s.attributes.current_position != null) extra = `<div class="hv-bar"><i style="width:${s.attributes.current_position}%"></i></div>`;
    return `<div class="hv-t ${on ? "on" : ""} ${s.state === "unavailable" ? "na" : ""}" data-ent="${esc(id)}" style="--acc:${this._accent(id)}">
      <div class="hv-row"><div class="ic">${ic(this._icon(id))}</div>${power ? `<div class="pw" data-pw="${esc(id)}">${ic("mdi:power")}</div>` : ""}</div>
      <div class="nm">${esc(this._name(id))}</div><div class="sv">${esc(sub)}</div>${extra}</div>`;
  }

  /** The climate, large: room and what it is doing, the target in big type, and arrows to change it. */
  _hvThermo(id, rooms, size) {
    const s = this._s(id), a = s.attributes, on = this._isOn(id), na = s.state === "unavailable";
    const tgt = this._climateTarget(id);
    const range = tgt == null && a.target_temp_low != null && a.target_temp_high != null;
    const act = on && a.hvac_action && !["off", "idle"].includes(a.hvac_action) ? a.hvac_action : null;
    const dot = { heating: "#e8712b", preheating: "#e8712b", cooling: "#4aa8ff", drying: "#64d2ff", fan: "#a8b0bd" }[act] || (on ? "#8a8a8a" : "#bbb");
    const big = on && tgt != null ? num(tgt) : on && range ? `${num(a.target_temp_low)}–${num(a.target_temp_high)}` : a.current_temperature != null ? num(Math.round(a.current_temperature)) : "–";
    const cur = a.current_temperature != null ? `${num(a.current_temperature)}°` : "";
    const arrows = on && tgt != null && !na;
    const short = { cool: t("Frio"), heat: t("Calor"), heat_cool: t("Auto"), auto: t("Auto"), dry: t("Seco"), fan_only: t("Ventilar"), off: "Off" };
    const modes = this._climateQuickModes(id);
    const room = this._hvRoomOf(id, rooms);
    return `<div class="hv-t hv-thermo ${size} ${on ? "on" : ""} ${na ? "na" : ""}" data-open="${esc(id)}">
      <div class="hv-row"><span class="hv-lbl">${esc(room || this._name(id))}</span><span class="hv-mode"><i style="background:${dot}"></i>${esc([this._st(act || s.state), on && tgt != null ? cur : ""].filter(Boolean).join(" · "))}</span></div>
      <div class="hv-big ${String(big).length > 3 ? "long" : ""}">${big}<sup>°</sup></div>
      <div class="hv-row">
        ${arrows ? `<button class="hv-arr" data-ctemp="${esc(id)}" data-d="-1" aria-label="${t("Baixar")}">${ic("mdi:chevron-down")}</button>` : "<span></span>"}
        <div class="hv-mid"><div class="nm">${esc(this._name(id))}</div><div class="sv">${esc([room, cur ? `${cur} ${t("agora")}` : ""].filter(Boolean).join(" · "))}</div>
          ${size === "l" && modes.length > 1 && !na ? `<div class="hv-seg">${modes.map((m) => `<button class="${m === s.state ? "act" : ""}" data-chvac="${esc(id)}" data-m="${m}">${short[m] || this._st(m)}</button>`).join("")}</div>` : ""}</div>
        ${arrows ? `<button class="hv-arr" data-ctemp="${esc(id)}" data-d="1" aria-label="${t("Subir")}">${ic("mdi:chevron-up")}</button>` : "<span></span>"}
      </div>
    </div>`;
  }

  /** Robot vacuum (M): status, battery and, while cleaning, progress. */
  _hvVacuum(id) {
    const on = this._isOn(id), level = this._vacBattery(id);
    const status = this._vacMember(id, "sensor", "status");
    const pctE = this._vacMember(id, "sensor", "clean_percent", "cleaning_progress");
    const pct = pctE ? Number(this._s(pctE).state) : NaN;
    const err = this._vacMember(id, "sensor", "vacuum_error");
    const errOn = err && !["none", "ok", "unknown", "no_error"].includes(this._s(err).state);
    return `<div class="hv-t hv-vac ${on ? "" : ""}" data-open="${esc(id)}">
      <div class="hv-row"><div class="ic" style="background:${errOn ? "#ff9f0a" : "#34c759"};color:#08200f">${ic("mdi:robot-vacuum")}</div><span class="hv-lbl">${t("Aspirador")}</span></div>
      <div class="nm">${esc(errOn ? this._fmtState(err) : this._fmtState(status || id))}</div>
      <div class="sv">${esc([this._name(id), level != null ? `${level}%` : ""].filter(Boolean).join(" · "))}</div>
      ${on && Number.isFinite(pct) ? `<div class="hv-bar ok"><i style="width:${pct}%"></i></div>` : ""}
    </div>`;
  }

  /** Weather (M/L): now, today's high and low, the IPMA warning and the next hours with the chance of rain. */
  _hvWeather(size = "m") {
    const w = this._wx(), fc = this._homeForecast();
    const today = (fc?.daily || []).find((x) => new Date(x.time).toDateString() === new Date().toDateString());
    const hrs = (fc?.hourly || []).filter((f) => f.time >= Date.now() - 30 * 60e3).slice(0, size === "l" ? 7 : 5);
    const al = this._ipmaAlerts();
    const lv = { yellow: t("Aviso amarelo"), orange: t("Aviso laranja"), red: t("Aviso vermelho") };
    const hh = (d, k) => (k === 0 ? t("Agora") : d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }));
    return `<div class="hv-t hv-we" data-wx>
      <div class="hv-row"><div class="hv-now">${ic(WEATHER_ICON[w?.cond] || "mdi:weather-partly-cloudy")}<div><div class="hv-tmp">${w ? deg(w.temp) : "–"}</div>
        <div class="sv">${esc([w ? this._wxLabel(w.cond) : t("A carregar o tempo…"), today ? `${t("Máx.")} ${deg(today.temp)} ${t("Mín.")} ${deg(today.low)}` : ""].filter(Boolean).join(" · "))}</div></div></div>
        <span class="hv-lbl">${t("Casa")}</span></div>
      ${al.length ? `<div class="hv-ipma lv-${al[0].level}"><i></i>${esc([lv[al[0].level], al[0].type].filter(Boolean).join(" · "))}${al[0].start && !isNaN(al[0].start) && al[0].start > new Date() ? `, ${t("a partir das")} ${al[0].start.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" })}` : ""}${al.length > 1 ? ` <b>+${al.length - 1}</b>` : ""}</div>` : ""}
      ${hrs.length ? `<div class="hv-hrs">${hrs.map((f, k) => `<div><span>${hh(f.time, k)}</span><b>${deg(f.temp)}</b><em>${f.precip != null ? `${Math.round(f.precip)}%` : ""}</em></div>`).join("")}</div>` : ""}
    </div>`;
  }

  /** Today's agenda (M/L): the weekday and day, then events and reminders with a coloured edge. */
  _hvAgendaTile(size = "m") {
    const now = new Date(), d = this._todayItems(size === "l" ? 6 : 3);
    let list;
    if (!d) list = `<li class="hv-empty">${t("A carregar a agenda…")}</li>`;
    else if (!this._calendars().length && !this._todoList()) list = `<li class="hv-empty">${t("Sem calendários no Home Assistant.")}</li>`;
    else if (!d.events.length && !d.todos.length) list = `<li class="hv-empty">${t("Nada marcado para hoje.")}</li>`;
    else list = [...d.events.map((e) => `<li>${esc(e.title)}<span>${esc(this._timeRange(e))}</span></li>`),
      ...d.todos.map((x) => `<li class="hv-td ${x.due && x.due < new Date(new Date().setHours(0, 0, 0, 0)) ? "hv-late" : ""}">${esc(x.title)}<span>${x.due ? t("Lembrete · hoje") : t("Lembrete")}</span></li>`)].join("");
    return `<div class="hv-t hv-ag"><div class="hv-day"><small>${esc(cap(now.toLocaleDateString(locale(), { weekday: "long" })))}</small><b>${now.getDate()}</b></div><ul>${list}</ul></div>`;
  }

  /** What's playing (L/M): artwork, title, a progress bar and play / pause. */
  _hvPlay(size = "l") {
    const id = this._activeMedia();
    if (!id) return `<div class="hv-t hv-play hv-empty"><div class="hv-art">${ic("mdi:music-note-off")}</div><div class="hv-meta"><span class="hv-lbl">${t("A tocar")}</span><b>${t("Nada a tocar")}</b><span class="sv">${t("Música e TV aparecem aqui")}</span></div></div>`;
    const s = this._s(id), a = s.attributes;
    const pct = a.media_duration ? Math.min(100, ((a.media_position || 0) / a.media_duration) * 100) : 0;
    return `<div class="hv-t hv-play ${size}" data-open="${esc(id)}">
      <div class="hv-art" style="${a.entity_picture ? `background-image:url('${esc(a.entity_picture)}')` : ""}"></div>
      <div class="hv-meta"><span class="hv-lbl">${esc([t("A tocar"), this._name(id)].join(" · "))}</span>
        <b>${esc(a.media_title || this._name(id))}</b><span class="sv">${esc(a.media_artist || a.app_name || "")}</span>
        <div class="hv-prog"><i style="width:${pct}%"></i></div>
        <div class="hv-ctl"><button data-media="media_play_pause" data-ent-id="${esc(id)}" aria-label="${s.state === "playing" ? t("Pausa") : t("Tocar")}">${ic(`mdi:${s.state === "playing" ? "pause" : "play"}`)}</button>
          ${a.volume_level != null ? `<em>${t("Volume")} ${Math.round(a.volume_level * 100)}%</em>` : ""}</div></div>
    </div>`;
  }

  /** A Mosaico cell: the tile for an item, with the edit buttons in edit mode. */
  _hvCell(it, rooms) {
    const { id, size } = it;
    let tile;
    if (id === "@clock") tile = `<div class="hv-ck" data-analog="${size === "s" ? "" : "n"}">${analogClock(new Date(), size !== "s")}</div>`;
    else if (id === "@time") tile = `<div class="hv-time ${size}"><div class="clock">${this._clockText()}</div><div class="sv">${esc(this._dateText(size === "s" ? { weekday: "short", day: "numeric", month: "short" } : undefined))}</div></div>`;
    else if (id === "@weather") tile = this._hvWeather(size);
    else if (id === "@agenda") tile = this._hvAgendaTile(size);
    else if (id === "@media") tile = this._hvPlay(size);
    else if (dom(id) === "climate" && size !== "s") tile = this._hvThermo(id, rooms, size);
    else if (dom(id) === "vacuum" && size !== "s") tile = this._hvVacuum(id);
    else tile = this._hvTile(id, rooms, size);
    const chrome = this._edit ? `<button class="ed-x" data-edmos="del|${esc(id)}" title="${t("Tirar")}">−</button><button class="ed-sz" data-edmos="size|${esc(id)}" title="${t("Tamanho")}">${size.toUpperCase()}</button>` : "";
    return `<div class="mc ${size}" data-key="${esc(id)}">${chrome}${tile}</div>`;
  }

  // ---------- faces ----------
  /** Mosaico and Mosaico+: a 4 × 3 grid of tiles that fills the screen. */
  _hvMosaic(rooms, key) {
    this._mosKey = key;
    const e = this._edit, list = e ? e[key] : this._mosaicList(rooms, this._cfg(), key);
    const bar = e ? `<div class="hv-edbar"><span>${t("Arrasta para mover. Toca em − para tirar e no tamanho para mudar entre S, M e L.")}</span><button class="pill" data-pick="${key}">${ic("mdi:plus")}${t("Adicionar")}</button></div>` : "";
    return this._hvFrame(`hv-mosaic ${key === "mosaic_plus" ? "plus" : ""} ${e ? "editing" : ""}`,
      `${bar}<div class="hv-grid" data-sortable="${key}">${list.map((it) => this._hvCell(it, rooms)).join("")}</div>`);
  }

  /** Painel: date, clock and home status on the left; status chips, Favourites and rooms on the right. */
  _hvPainel(rooms) {
    const cfg = this._cfg(), all = rooms.flatMap((r) => r.ents);
    const lights = all.filter((i) => dom(i) === "light"), lit = lights.filter((i) => this._isOn(i));
    const others = this._activeOthers(all);
    const status = lit.length ? tp(lit.length, "{n} luz acesa", "{n} luzes acesas") : lights.length ? t("Luzes apagadas") : t("Tudo tranquilo");
    const w = this._wx(), today = (this._homeForecast()?.daily || []).find((x) => new Date(x.time).toDateString() === new Date().toDateString());
    const e = this._edit;
    const favs = e ? e.favorites.filter((i) => this._s(i)) : this._favList(rooms).slice(0, 6);
    const fav = (id) => {
      const on = this._isOn(id), sub = [this._hvRoomOf(id, rooms), this._stateText(id)].filter(Boolean).join(" · ");
      return `<div class="hv-t hv-ft ${on ? "on" : ""}" data-ent="${esc(id)}" data-key="${esc(id)}" style="--acc:${this._accent(id)}">
        ${e ? `<button class="ed-x" data-edfav="${esc(id)}" title="${t("Tirar")}">−</button>` : ""}<div class="ic">${ic(this._icon(id))}</div><div class="hv-fx"><div class="nm">${esc(this._name(id))}</div><div class="sv">${esc(sub)}</div></div></div>`;
    };
    const room = (r) => {
      const sw = this._switchables(r), on = sw.filter((i) => this._isOn(i)).length, c = this._roomClimate(r);
      return `<div class="hv-t hv-rm ${on ? "on" : ""}" data-room="${esc(r.id)}" data-key="${esc(r.id)}">${e ? this._editChrome("room", r.id) : ""}
        <div class="ic">${ic(r.icon || "mdi:home-outline")}</div><div class="nm">${esc(this._roomName(r))}</div>
        <div class="hv-ft2"><span class="sv">${on ? t("{a} de {b} ligados", { a: on, b: sw.length }) : sw.length ? t("Desligado") : tp(r.count, "{n} dispositivo", "{n} dispositivos")}</span><span>${c.temp ? esc(c.temp.replace(/[,.]\d/, "").replace("°C", "°")) : ""}</span></div></div>`;
    };
    const left = `<div class="hv-left">
      <div class="hv-lbl">${esc(this._dateText())}</div>
      <div class="clock">${this._clockText()}</div>
      ${cfg.show_status ? `<div class="hv-status">${esc(status)}</div>${others.length ? `<div class="hv-sub">${esc(this._othersLine(others))}</div>` : ""}
      ${lights.length ? `<div class="hv-pills"><button class="pill" data-all="on">${ic("mdi:lightbulb-outline")}${t("Acender")}</button><button class="pill solid" data-all="off">${ic("mdi:power")}${t("Apagar")}</button></div>` : ""}` : ""}
      ${cfg.show_weather ? `<div class="hv-wmini" data-wx>${ic(WEATHER_ICON[w?.cond] || "mdi:weather-partly-cloudy")}<div><b>${w ? deg(w.temp) : "–"}</b><span>${esc([w ? this._wxLabel(w.cond) : "", today ? `${deg(today.temp).replace("°", "")}° / ${deg(today.low)}` : ""].filter(Boolean).join(" · "))}</span></div></div>` : ""}
    </div>`;
    const right = `<div class="hv-right">
      ${cfg.show_summary && !e ? this._hvChips(rooms) : ""}
      ${favs.length || e ? `<div class="hv-lbl">${t("Favoritos")}${e ? ` <button class="pill sm" data-pick="fav">${ic("mdi:plus")}${t("Adicionar")}</button>` : ""}</div><div class="hv-favs" data-sortable="favorites">${favs.map(fav).join("")}</div>` : ""}
      <div class="hv-lbl">${t("Divisões")}</div>
      <div class="hv-rooms" data-sortable="rooms">${rooms.map(room).join("")}</div>
    </div>`;
    return this._hvFrame(`hv-painel ${e ? "editing" : ""}`, `${e ? `<div class="hv-edbar"><span>${t("Arrasta para mover. Toca em − para tirar.")}</span></div>` : ""}<div class="hv-pan">${left}${right}</div>`);
  }

  /** Status chips of the Painel: climate, lights, security, air, vacuum, what's playing. */
  _hvChips(rooms) {
    const all = rooms.flatMap((r) => r.ents).filter((i) => this._s(i));
    const out = [];
    const chip = (icon, bg, title, sub, attrs) => `<button class="hv-chip" ${attrs}><span class="hv-ci" style="background:${bg}">${ic(icon)}</span><span><b>${esc(title)}</b><span>${esc(sub)}</span></span></button>`;
    const temps = all.filter((i) => dom(i) === "sensor" && this._s(i).attributes.device_class === "temperature").map((i) => Number(this._s(i).state)).filter(Number.isFinite);
    const climates = all.filter((i) => dom(i) === "climate");
    if (temps.length || climates.length) {
      const vals = temps.length ? temps : climates.map((i) => this._s(i).attributes.current_temperature).filter((v) => v != null);
      const lo = Math.round(Math.min(...vals)), hi = Math.round(Math.max(...vals));
      out.push(chip("mdi:thermometer", "#34c759", t("Clima"), vals.length ? (lo === hi ? `${num(lo)}°` : `${num(lo)}–${num(hi)}°`) : "–", climates.length === 1 ? `data-open="${esc(climates[0])}"` : `data-nav="climate"`));
    }
    const lights = all.filter((i) => dom(i) === "light"), lit = lights.filter((i) => this._isOn(i)).length;
    if (lights.length) out.push(chip("mdi:lightbulb-outline", "var(--amber)", t("Luzes"), lit ? tp(lit, "{n} acesa", "{n} acesas") : t("Apagadas"), `data-nav="rooms"`));
    const sec = all.filter((i) => dom(i) === "lock" || (dom(i) === "binary_sensor" && ["door", "window", "garage_door", "opening"].includes(this._s(i).attributes.device_class)));
    if (sec.length) {
      const bad = sec.filter((i) => (dom(i) === "lock" ? this._s(i).state === "unlocked" : this._s(i).state === "on")).length;
      out.push(chip(`mdi:shield-${bad ? "alert-outline" : "check-outline"}`, bad ? "#ff9f0a" : "#5a8dee", t("Segurança"), bad ? tp(bad, "{n} aberto", "{n} abertos") : t("Tudo seguro"), `data-nav="security"`));
    }
    const pm = all.find((i) => dom(i) === "sensor" && ["pm25", "aqi"].includes(this._s(i).attributes.device_class));
    if (pm) out.push(chip("mdi:leaf", "#2fb9a8", t("Ar"), `${this._s(pm).attributes.device_class === "pm25" ? "PM2.5 " : "AQI "}${num(Math.round(Number(this._s(pm).state)))}`, `data-open="${esc(pm)}"`));
    for (const v of all.filter((i) => dom(i) === "vacuum").slice(0, 1)) {
      const level = this._vacBattery(v);
      out.push(chip("mdi:robot-vacuum", "#30d158", t("Aspirador"), [this._fmtState(this._vacMember(v, "sensor", "status") || v), level != null ? `${level}%` : ""].filter(Boolean).join(" · "), `data-open="${esc(v)}"`));
    }
    const media = all.find((i) => dom(i) === "media_player" && this._s(i).state === "playing");
    if (media) out.push(chip("mdi:music-note", "#bf5af2", t("A tocar"), this._s(media).attributes.media_title || this._name(media), `data-open="${esc(media)}"`));
    return out.length ? `<div class="hv-chips">${out.join("")}</div>` : "";
  }

  /** Relógio e agenda: date, month, music (or today's agenda), sunrise, an analog clock and the weather. */
  _hvAgenda() {
    const now = new Date(), w = this._wx(), sun = this._sunTimes();
    const today = (this._homeForecast()?.daily || []).find((x) => new Date(x.time).toDateString() === now.toDateString());
    const marked = new Set((this._agenda()?.events || []).map((e) => `${e.start.getFullYear()}-${e.start.getMonth()}-${e.start.getDate()}`));
    const y = now.getFullYear(), m = now.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    let g = [...Array(7)].map((_, k) => `<span class="hv-h">${esc(new Date(2024, 0, 1 + k).toLocaleDateString(locale(), { weekday: "narrow" }))}</span>`).join("") + "<span></span>".repeat(first);
    for (let d = 1; d <= days; d++) g += d === now.getDate() ? `<span><b class="hv-t0">${d}</b></span>` : `<span class="${d < now.getDate() ? "hv-p" : ""} ${marked.has(`${y}-${m}-${d}`) ? "hv-ev" : ""}">${d}</span>`;
    const media = this._activeMedia();
    let mid;
    if (media) {
      const s = this._s(media), a = s.attributes;
      mid = `<div class="hv-np" data-open="${esc(media)}"><div class="hv-art" style="${a.entity_picture ? `background-image:url('${esc(a.entity_picture)}')` : ""}"></div>
        <b>${esc(a.media_title || this._name(media))}</b><span>${esc([a.media_artist, this._name(media)].filter(Boolean).join(" · "))}</span>
        <button class="hv-pause" data-media="media_play_pause" data-ent-id="${esc(media)}">${ic(`mdi:${s.state === "playing" ? "pause" : "play"}`)}${s.state === "playing" ? t("Pausa") : t("Tocar")}</button></div>`;
    } else {
      const d = this._todayItems(4);
      mid = `<div class="hv-today"><div class="hv-h">${t("Hoje")}</div><ul>${!d ? `<li class="hv-empty">${t("A carregar a agenda…")}</li>` : !d.events.length && !d.todos.length ? `<li class="hv-empty">${t("Nada marcado para hoje.")}</li>`
        : [...d.events.map((e) => `<li>${esc(e.title)}<span>${esc(this._timeRange(e))}</span></li>`), ...d.todos.map((x) => `<li class="hv-td">${esc(x.title)}<span>${t("Lembrete")}</span></li>`)].join("")}</ul></div>`;
    }
    const body = `<div class="hv-cal">
      <div class="hv-date"><div class="hv-dw"><span>${esc(cap(now.toLocaleDateString(locale(), { weekday: "short" }).replace(".", "")))}</span> <span class="hv-mo">${esc(cap(now.toLocaleDateString(locale(), { month: "short" }).replace(".", "")))}</span></div><div class="hv-dn">${now.getDate()}</div></div>
      ${mid}
      <div class="hv-an" data-analog="n">${analogClock(now, true)}</div>
      <div class="hv-month"><div class="hv-mh">${esc(cap(now.toLocaleDateString(locale(), { month: "long" })))}</div><div class="hv-g">${g}</div></div>
      <div class="hv-sun">${sun ? `<div class="hv-h">${ic("mdi:weather-sunset-up")}${t("Nascer do sol")}</div><div class="hv-v">${sun.rise}</div><div class="hv-s">${t("Pôr do sol")} ${sun.set}</div>` : ""}</div>
      <div class="hv-wx" data-wx><div class="hv-h">${t("Casa")}</div><div class="hv-v">${w ? deg(w.temp) : "–"}</div><div class="hv-s">${esc(w ? this._wxLabel(w.cond) : "")}${today ? `<br>${t("Máx.")} ${deg(today.temp)} ${t("Mín.")} ${deg(today.low)}` : ""}</div></div>
    </div>`;
    return this._hvFrame("hv-agenda", body, { wake: this._ambient });
  }

  /** Fluxo: glass shapes on a canvas, the time and date in a corner. */
  _hvFlow() {
    const w = this._wx();
    return this._hvFrame("hv-flow", `<canvas data-flow aria-label="${t("Formas de vidro em movimento lento")}"></canvas>
      <div class="hv-tm"><div class="clock">${this._clockText()}</div><span>${esc([this._dateText({ weekday: "long", day: "numeric", month: "short" }), w ? deg(w.temp) : ""].filter(Boolean).join(" · "))}</span></div>`, { wake: this._ambient });
  }

  /** The ⋯ button: shows the dock and the edit, full screen and settings buttons for a while. */
  _bindHv(root) {
    root.querySelector("[data-hvmore]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this._dockOpen = !this._dockOpen;
      this._dockOpenAt = Date.now();
      this._render();
    });
  }
}
