// Pine3 Homeview - The home screen (its layouts), the top bar, scenes, room cards and the screensaver.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { WEATHER_ICON, esc, dom } from "../const.js";
import { t, tp, num } from "../i18n.js";
import { EDIT_HINT } from "../util.js";

export class HomeViewMixin {

  _gear() {
    const fs = this._fsSupported() ? `<div class="iconbtn" data-fs title="${document.fullscreenElement ? t("Sair do ecrã inteiro") : t("Ecrã inteiro")}"><ha-icon icon="mdi:${document.fullscreenElement ? "fullscreen-exit" : "fullscreen"}"></ha-icon></div>` : "";
    return `${fs}<div class="iconbtn" data-act="settings" title="${t("Definições")}"><ha-icon icon="mdi:cog-outline"></ha-icon></div>`;
  }
  _hint() { return this._edit ? `<div class="edhint">${t(EDIT_HINT)}</div>` : ""; }

  _topBar() {
    const h = this._hass, cfg = this._cfg();
    const persons = (this._model?.persons || Object.keys(h.states).filter((i) => dom(i) === "person")).map((i) => this._s(i)).filter(Boolean).slice(0, 4);
    const tint = ["#f3a96b", "#f6cf6a", "#c9d3dc", "#b9e0c3"];
    const people = persons.length ? `<div class="people">${persons.map((p, k) => {
      const pic = p.attributes.entity_picture;
      const ini = (p.attributes.friendly_name || "?").trim()[0].toUpperCase();
      return `<div class="av ${p.state === "home" ? "home" : ""}" title="${esc(p.attributes.friendly_name)}" style="background-color:${tint[k % 4]};${pic ? `background-image:url('${esc(pic)}')` : ""}">${pic ? "" : esc(ini)}<i></i></div>`;
    }).join("")}</div>` : "";
    this._peopleHtml = cfg.show_people ? people : "";
    return `<div class="top">
      <div><div class="eyebrow">${esc(this._dateText())}</div><div class="clock">${this._clockText()}</div>${this._hint()}</div>
      <div class="right">
        ${cfg.show_weather ? this._wxPill() : ""}
        ${cfg.show_people ? people : ""}${this._editBtn()}${this._gear()}
      </div></div>`;
  }

  /** What else is on besides lights (plugs, switches, fans/purifiers, TVs and speakers, AC, a cleaning vacuum). */
  _activeOthers(all) {
    return all.filter((i) => ["switch", "input_boolean", "fan", "media_player", "climate", "vacuum"].includes(dom(i)) && this._isOn(i));
  }
  /** One line for the status: the names of the first few, then "+N". */
  _othersLine(others) {
    if (!others.length) return "";
    const names = others.slice(0, 3).map((i) => this._name(i));
    return `${tp(others.length, "Também ligado:", "Também ligados:")} ${names.join(", ")}${others.length > 3 ? ` +${others.length - 3}` : ""}`;
  }

  /**
   * The home grid: rooms and the summary cards (Climate, Security, Vacuum, Now playing) in one order,
   * which the edit mode sorts by dragging. Summary cards are keyed "@climate", "@security", "@vacuum:<id>", "@media".
   */
  _homeItems(rooms, cards) {
    const order = (this._edit || this._cfg()).room_order || [];
    const keyOf = (html) => html.match(/data-key="([^"]+)"/)?.[1];
    const items = [...rooms.map((r) => [r.id, this._roomCard(r)]), ...cards.map((c) => [keyOf(c), c])];
    const pos = (k, i) => { const n = order.indexOf(k); return n < 0 ? 1e4 + i : n; };
    return items.map(([k, html], i) => [pos(k, i), html]).sort((a, b) => a[0] - b[0]).map(([, html]) => html);
  }

  // ---------- scenes ----------
  /** Devices a scene sets (HA scenes list them in attributes.entity_id), limited to those that can be turned off. */
  _sceneEnts(id) {
    const list = this._s(id)?.attributes.entity_id;
    return (Array.isArray(list) ? list : []).filter((e) => this._s(e) && ["light", "switch", "fan", "input_boolean", "media_player", "climate"].includes(dom(e)));
  }
  /**
   * A scene is "on" while some of its devices are on and no scene activated after it set any of the
   * same devices: several scenes for different rooms can be on at once, a later scene on the same
   * lights takes over.
   */
  _sceneOn(id) {
    const at = (x) => { const v = Date.parse(this._s(x)?.state); return Number.isFinite(v) ? v : 0; };
    const mine = at(id), ents = this._sceneEnts(id);
    if (!mine || !ents.some((e) => this._isOn(e))) return false;
    const own = new Set(ents);
    return !Object.keys(this._hass.states).some((x) => x !== id && dom(x) === "scene" && at(x) > mine && this._sceneEnts(x).some((e) => own.has(e)));
  }
  /** Tap on a scene: activate it, or turn its devices off if it is the one on. */
  _sceneTap(id) {
    if (this._sceneOn(id)) {
      const ents = this._sceneEnts(id).filter((e) => this._isOn(e));
      if (ents.length) this._call("homeassistant", "turn_off", { entity_id: ents });
      return;
    }
    this._call("scene", "turn_on", { entity_id: id });
    this._fired = id; this._render();
    setTimeout(() => { this._fired = null; this._render(); }, 1200);
  }

  _roomCard(r) {
    const sw = this._switchables(r), on = sw.filter((i) => this._isOn(i));
    const c = this._roomClimate(r);
    const active = on.length > 0;
    const big = this._cfg().big_rooms?.includes(r.id);
    const meta = sw.length ? (active ? t("{a} de {b} ligados", { a: on.length, b: sw.length }) : t("Tudo desligado")) : tp(r.count, "{n} dispositivo", "{n} dispositivos");
    const quick = big ? `<div class="quick">${sw.slice(0, 6).map((i) => `<button class="qk ${this._isOn(i) ? "on" : ""}" data-pw="${esc(i)}"><ha-icon icon="${this._icon(i)}"></ha-icon><span>${esc(this._name(i))}</span></button>`).join("")}</div>` : "";
    return `<div class="rc ${active ? "on" : "glass"} ${big ? "big" : ""}" data-room="${esc(r.id)}" data-key="${esc(r.id)}">
      ${this._editChrome("room", r.id)}
      <div class="row1"><div class="ri"><ha-icon icon="${r.icon || "mdi:home-outline"}"></ha-icon></div>
        ${sw.length ? `<div class="pw" data-roomlights="${esc(r.id)}" title="${active ? t("Apagar luzes") : t("Ligar luzes")}"><ha-icon icon="mdi:power"></ha-icon></div>` : ""}</div>
      ${quick}
      <div class="foot"><div class="nm">${esc(this._roomName(r))}</div><div class="meta">${meta}</div>
        <div class="dots">${sw.slice(0, 8).map((i) => `<i class="${this._isOn(i) ? "on" : ""}"></i>`).join("")}${c.temp ? `<span class="tmp">${c.temp.replace(/[,.]\d/, "").replace("°C", "°")}</span>` : ""}</div></div>
    </div>`;
  }

  _restoreCard(n) {
    if (!this._edit || !n) return "";
    return `<div class="rc add" data-edrestore="rooms"><ha-icon icon="mdi:plus"></ha-icon><span>${tp(n, "Mostrar {n} escondida", "Mostrar {n} escondidas")}</span></div>`;
  }

  _homeView(rooms) {
    const h = this._hass, cfg = this._cfg();
    const all = rooms.flatMap((r) => r.ents);
    const lights = all.filter((i) => dom(i) === "light");
    const lightsOn = lights.filter((i) => this._isOn(i));
    const status = lightsOn.length ? tp(lightsOn.length, "{n} luz acesa em casa", "{n} luzes acesas em casa") : lights.length ? t("Todas as luzes apagadas") : t("Tudo tranquilo em casa");

    const scenes = (this._model ? this._model.scenes.filter((i) => this._s(i)) : Object.keys(h.states).filter((i) => dom(i) === "scene" && !h.entities?.[i]?.hidden)).slice(0, 12);
    const scenesHtml = scenes.length && cfg.show_scenes ? `<div class="sect hsc"><div class="eyebrow">${t("Cenas")} <span class="badge">${scenes.length}</span></div>
      <div class="scenes">${scenes.map((i) => `<div class="scene glass ${this._fired === i ? "fired" : ""} ${this._sceneOn(i) ? "on" : ""}" data-scene="${i}" title="${this._sceneOn(i) ? t("Toca para desligar") : ""}"><ha-icon icon="${this._s(i).attributes.icon || "mdi:creation-outline"}"></ha-icon>${esc(this._name(i))}</div>`).join("")}</div></div>` : "";

    // Summary cards
    const cards = [];
    const temps = all.filter((i) => dom(i) === "sensor" && this._s(i).attributes.device_class === "temperature").map((i) => Number(this._s(i).state)).filter(Number.isFinite);
    const hums = rooms.flatMap((r) => r.humidity || []).map((i) => Number(this._s(i)?.state)).filter(Number.isFinite);
    const climates = all.filter((i) => dom(i) === "climate" && this._s(i));
    const climate = climates.find((i) => this._isOn(i)) || climates[0];
    if (temps.length || climate) {
      const tt = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : this._s(climate).attributes.current_temperature;
      const heating = climate && this._isOn(climate);
      // one device opens it directly; several open the Climate screen
      const go = climates.length > 1 ? `data-nav="climate"` : climate ? `data-open="${climate}"` : "";
      cards.push(`<div data-key="@climate" class="rc ${heating ? "on" : "glass"}" ${go}>
        <div class="row1"><div class="ri" style="background:#34c759;color:#0d2a14"><ha-icon icon="mdi:thermometer"></ha-icon></div><div class="eyebrow" style="margin:14px 0 0 0;flex:1;padding-left:14px">${t("Clima")}</div></div>
        <div class="foot"><div class="big-num">${tt != null ? Math.round(tt) : "–"}°</div><div class="meta">${climates.length > 1 ? `${t("{a} de {b} ligados", { a: climates.filter((i) => this._isOn(i)).length, b: climates.length })} · ` : ""}${hums.length ? t("Humidade {n}%", { n: Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) }) : climate ? esc(this._stateText(climate)) : t("Interior")}</div></div></div>`);
    }
    const secIds = all.filter((i) => dom(i) === "lock" || (dom(i) === "binary_sensor" && ["door", "window", "garage_door", "opening"].includes(this._s(i).attributes.device_class)));
    if (secIds.length) {
      const bad = secIds.filter((i) => (dom(i) === "lock" ? this._s(i).state === "unlocked" : this._s(i).state === "on"));
      cards.push(`<div data-key="@security" class="rc glass" data-nav="security">
        <div class="row1"><div class="ri" style="${bad.length ? "background:#ff9f0a;color:#2a1500" : "background:#30d158;color:#06210f"}"><ha-icon icon="mdi:shield-${bad.length ? "alert-outline" : "check-outline"}"></ha-icon></div><div class="eyebrow" style="margin:14px 0 0 0;flex:1;padding-left:14px">${t("Segurança")}</div></div>
        <div class="foot"><div class="big-txt">${bad.length ? tp(bad.length, "{n} item aberto", "{n} itens abertos") : t("Tudo seguro")}</div><div class="meta">${tp(secIds.length, "{n} item monitorizado", "{n} itens monitorizados")}</div></div></div>`);
    }
    // robot vacuums: status, battery and (while cleaning) progress; a tap opens its card, never starts it
    for (const v of all.filter((i) => dom(i) === "vacuum" && this._s(i))) {
      const on = this._isOn(v), level = this._vacBattery(v);
      const status = this._vacMember(v, "sensor", "status");
      const progress = on ? [this._vacMember(v, "sensor", "cleaning_area"), this._vacMember(v, "sensor", "clean_percent", "cleaning_progress")].filter(Boolean).map((e) => this._sensorVal(e)) : [];
      const err = this._vacMember(v, "sensor", "vacuum_error");
      const errOn = err && !["none", "ok", "unknown", "no_error"].includes(this._s(err).state);
      cards.push(`<div data-key="@vacuum:${esc(v)}" class="rc ${on ? "on" : "glass"}" data-open="${esc(v)}">
        <div class="row1"><div class="ri" style="background:${errOn ? "#ff9f0a;color:#2a1500" : "#30d158;color:#06210f"}"><ha-icon icon="mdi:robot-vacuum"></ha-icon></div><div class="eyebrow" style="margin:14px 0 0 0;flex:1;padding-left:14px">${t("Aspirador")}</div></div>
        <div class="foot"><div class="big-txt">${esc(errOn ? this._fmtState(err) : this._fmtState(status || v))}</div>
          <div class="meta">${esc([level != null ? `🔋 ${level}%` : "", ...progress, this._name(v)].filter(Boolean).join(" · "))}</div></div></div>`);
    }
    const media = all.find((i) => dom(i) === "media_player" && this._s(i).state === "playing") || all.find((i) => dom(i) === "media_player" && this._s(i).state === "paused");
    if (media) {
      const a = this._s(media).attributes, roomName = rooms.find((r) => r.ents.includes(media))?.name;
      const pct = a.media_duration ? Math.min(100, ((a.media_position || 0) / a.media_duration) * 100) : 0;
      cards.push(`<div data-key="@media" class="rc glass media ${a.entity_picture ? "pic" : ""}" data-open="${media}" style="${a.entity_picture ? `background-image:linear-gradient(rgba(30,16,32,.55),rgba(30,16,32,.85)),url('${esc(a.entity_picture)}');background-size:cover;background-position:center` : ""}">
        <div class="eyebrow" style="color:#5ee08a;letter-spacing:.14em"><ha-icon icon="mdi:music-note" style="--mdc-icon-size:16px"></ha-icon>${esc([t("A tocar"), roomName, a.app_name].filter(Boolean).join(" · "))}</div>
        <div class="foot"><div class="ttl">${esc(a.media_title || this._name(media))}</div><div class="art">${esc(a.media_artist || "")}</div>
          ${pct ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ""}
          <div class="ctl"><span data-media="media_previous_track" data-ent-id="${media}"><ha-icon icon="mdi:skip-previous"></ha-icon></span><span class="pp" data-media="media_play_pause" data-ent-id="${media}"><ha-icon icon="mdi:${this._s(media).state === "playing" ? "pause" : "play"}"></ha-icon></span><span data-media="media_next_track" data-ent-id="${media}"><ha-icon icon="mdi:skip-next"></ha-icon></span></div></div></div>`);
    }

    const others = this._activeOthers(all);
    const lightBtns = lights.length ? `<div class="actions"><button class="pill" data-all="on"><ha-icon icon="mdi:lightbulb-outline"></ha-icon>${t("Acender luzes")}</button><button class="pill solid" data-all="off"><ha-icon icon="mdi:power"></ha-icon>${t("Apagar luzes")}</button></div>` : "";
    const grid = rooms.length || this._edit ? `<div class="grid hgrid" data-sortable="rooms">${this._homeItems(rooms, cfg.show_summary ? cards : []).join("")}${this._restoreCard(this._hiddenRooms.length)}</div>`
      : `<div class="empty">${t("Ainda não há divisões com dispositivos. Atribui áreas aos teus dispositivos no Home Assistant.")}</div>`;
    const showStatus = cfg.show_status && !this._edit;
    const layout = cfg.home_layout || "top";
    const topBar = this._topBar(); // also prepares the people avatars
    const right = `${cfg.show_weather ? this._wxPill() : ""}${this._peopleHtml}${this._editBtn()}${this._gear()}`;

    if (layout === "columns") {
      // 1/3: date, a big clock, weather, people and what is on · 2/3: actions, scenes and the cards (3 rows of 4)
      const list = [...lightsOn.length ? [[`mdi:lightbulb-on`, tp(lightsOn.length, "{n} luz acesa", "{n} luzes acesas")]] : [], ...others.map((i) => [this._icon(i), this._name(i)])];
      return `<div class="hcols ${this._edit ? "editing" : ""}">
        <aside class="hleft">
          <div class="eyebrow tdate">${esc(this._dateText())}</div><div class="clock">${this._clockText()}</div>${this._hint()}
          ${showStatus ? `<div class="hstat"><div class="eyebrow">${t("Estado da casa")}</div><div class="status">${list.length ? (lightsOn.length ? tp(lightsOn.length, "{n} luz acesa", "{n} luzes acesas") : tp(others.length, "{n} dispositivo ligado", "{n} dispositivos ligados")) : status}</div>
            ${(() => { const max = this._ipmaAlert() && cfg.show_weather ? 4 : 6; return list.length ? `<ul class="hon">${list.slice(lightsOn.length ? 1 : 0, max).map(([icon, n]) => `<li><ha-icon icon="${icon}"></ha-icon>${esc(n)}</li>`).join("")}${list.length > max ? `<li class="hmore">+${list.length - max}</li>` : ""}</ul>` : ""; })()}</div>` : ""}
          ${cfg.show_weather ? this._wxCard("tall") : ""}
        </aside>
        <div class="hmain">
          <div class="hbar">${showStatus ? lightBtns : ""}<span class="sp"></span>${this._peopleHtml}${this._editBtn()}${this._gear()}</div>
          ${this._edit ? "" : scenesHtml}
          ${grid}
        </div>
      </div>`;
    }
    if (layout === "sidebar") {
      // a full-height glass sidebar (clock, weather, home status, scenes, people) and the cards beside it
      const sc = this._edit ? "" : scenesHtml;
      const offBtn = lights.length ? `<div class="actions">${lightsOn.length ? `<button class="pill solid" data-all="off"><ha-icon icon="mdi:power"></ha-icon>${t("Apagar luzes")}</button>` : `<button class="pill" data-all="on"><ha-icon icon="mdi:lightbulb-outline"></ha-icon>${t("Acender luzes")}</button>`}</div>` : "";
      return `<div class="hside ${this._edit ? "editing" : ""} ${sc ? "has-sc" : ""}">
        <aside class="sb glass">
          <div class="eyebrow tdate">${esc(this._dateText())}</div><div class="clock">${this._clockText()}</div>${this._hint()}
          ${cfg.show_weather ? this._wxCard("tall side") : ""}
          ${showStatus ? `<div class="sbst"><div class="status">${lightsOn.length ? tp(lightsOn.length, "{n} luz acesa", "{n} luzes acesas") : status}</div>${others.length ? `<div class="sdet">${esc(this._othersLine(others))}</div>` : ""}${offBtn}</div>` : ""}
          <span class="sp"></span>
          <div class="sbft">${this._peopleHtml}<span class="sp"></span>${this._editBtn()}${this._gear()}</div>
        </aside>
        <div class="hmain">${sc}${grid}</div>
      </div>`;
    }
    if (layout === "top") {
      // a big clock with the home status beside it, then scenes and cards
      return `<div class="top t1">
          <div class="tclock"><div class="eyebrow tdate">${esc(this._dateText())}</div><div class="clock">${this._clockText()}</div>${this._hint()}</div>
          ${showStatus ? `<div class="tstat"><div class="eyebrow">${t("Estado da casa")}</div><div class="status">${lightsOn.length ? tp(lightsOn.length, "{n} luz acesa", "{n} luzes acesas") : status}</div>${others.length ? `<div class="sdet">${esc(this._othersLine(others))}</div>` : ""}${lightBtns}</div>` : `<div class="tstat"></div>`}
          <div class="tside"><div class="right">${this._peopleHtml}${this._editBtn()}${this._gear()}</div>${cfg.show_weather ? this._wxCard("wide") : ""}</div>
          <div class="tsc">${this._edit ? "" : scenesHtml}</div>
        </div>
        ${grid}`;
    }
    return `${topBar}
      ${showStatus ? `<div class="statusrow"><div><div class="eyebrow">${t("Estado da casa")}</div><div class="status">${status}</div>${others.length ? `<div class="sdet">${esc(this._othersLine(others))}</div>` : ""}</div>
        ${lightBtns}</div>` : ""}
      ${this._edit ? "" : scenesHtml}
      ${grid}`;
  }
}
