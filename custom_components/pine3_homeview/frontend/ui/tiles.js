// Pine3 Homeview - Device tiles and whole-device sections (members, options, robot vacuum).
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { STATE_PT, esc, dom } from "../const.js";
import { t, tp } from "../i18n.js";

export class TilesMixin {

  _tile(id) {
    const s = this._s(id), d = dom(id), on = this._isOn(id);
    const sensor = d === "sensor";
    const big = this._cfg().big_devices?.includes(id);
    const power = ["light", "switch", "fan", "input_boolean"].includes(d) || (this._isTv(id) && ((s.attributes.supported_features || 0) & 384) !== 0);
    return `<div class="tile ${on ? "on" : "glass"} ${sensor ? "sensor" : ""} ${big ? "big" : ""} ${s.state === "unavailable" ? "na" : ""}" data-ent="${esc(id)}" data-key="${esc(id)}" style="--acc:${this._accent(id)}">
      ${this._meta?.[id] ? this._editChrome("dev", id) : ""}
      <div class="row1"><div class="ic"><ha-icon icon="${this._icon(id)}"></ha-icon></div>${power ? `<div class="pw" data-pw="${esc(id)}"><ha-icon icon="mdi:power"></ha-icon></div>` : ""}</div>
      <div class="tx"><div class="nm">${esc(this._name(id))}</div>${sensor ? `<div class="val">${esc(this._sensorVal(id))}</div>` : `<div class="st">${esc(this._stateText(id))}</div>`}${this._extras(id)}</div>
    </div>`;
  }

  /** Name of a device's entity without the device/room prefix ("Purifier PM2.5" -> "PM2.5"). */
  _memberName(primary, e) {
    const n = this._s(e)?.attributes.friendly_name || e;
    const fold = (x) => (x || "").toLowerCase();
    for (const pre of [this._s(primary)?.attributes.friendly_name, this._meta?.[primary]?.name]) {
      if (pre && fold(n).startsWith(fold(pre) + " ") && n.length > pre.length + 1) {
        const rest = n.slice(pre.length + 1);
        return rest[0].toUpperCase() + rest.slice(1);
      }
    }
    return n;
  }

  /** Every other entity of the device behind a tile: readings in a grid, then its controls. */
  /** Readable label for a select option: our translations, then Home Assistant's, then "snake_case" -> "Snake case". */
  _optLabel(e, o) {
    const k = String(o).toLowerCase();
    if (STATE_PT[k]) return t(STATE_PT[k]);
    const ha = this._hass?.formatEntityState?.(this._s(e), o);
    if (ha && ha !== o) return ha;
    const txt = String(o).replace(/_/g, " ");
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  /** A select's value, showing the option just chosen until Home Assistant reports it (devices can lag a few seconds). */
  _selValue(e) {
    const st = this._s(e).state, want = this._selWant?.[e];
    if (!want) return st;
    if (st === want.o || Date.now() - want.t > 15000) { delete this._selWant[e]; return st; }
    return want.o;
  }

  _deviceSection(id, only = null) {
    const mem = (only || this._meta?.[id]?.members || []).filter((e) => this._s(e) && this._s(e).state !== "unavailable" && dom(e) !== "image"
      && !(dom(e) === "button" && this._s(e).attributes.device_class === "identify") // "Identify" only makes the device blink
      && !/power[_ ]?on[_ ]?(behaviou?r|state)|startup[_ ]?on[_ ]?off/i.test(`${e} ${this._s(e).attributes.friendly_name || ""}`.replace(/-/g, "_"))); // set once, not day to day
    if (!mem.length) return "";
    const readings = mem.filter((e) => ["sensor", "binary_sensor"].includes(dom(e)));
    const isToggle = (e) => ["switch", "input_boolean", "light", "fan"].includes(dom(e));
    const toggles = mem.filter(isToggle);
    const selects = mem.filter((e) => dom(e) === "select" || dom(e) === "input_select");
    const controls = mem.filter((e) => !["sensor", "binary_sensor"].includes(dom(e)) && !isToggle(e) && !selects.includes(e));
    // an option list is a tile with its current value; tapping it opens a row of chips right below
    const sel = (e) => {
      const opts = this._s(e).attributes.options || [], cur = this._selValue(e), open = this._selOpen === e;
      return `<button class="dv-t dv-sel ${open ? "open" : ""}" data-dvopensel="${esc(e)}"><ha-icon icon="${this._icon(e)}"></ha-icon><span class="dv-sv"><small>${esc(this._memberName(id, e))}</small><b>${opts.includes(cur) ? esc(this._optLabel(e, cur)) : "–"}</b></span><ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></button>
        ${open ? `<div class="dv-opts ${this._selShown !== e ? "enter" : ""}"><div class="row presets">${opts.map((o) => `<button class="pill ${o === cur ? "act" : ""}" data-dvsel="${esc(e)}" data-opt="${esc(o)}">${esc(this._optLabel(e, o))}</button>`).join("")}</div></div>` : ""}`;
    };
    const value = (e) => (dom(e) === "sensor" ? this._sensorVal(e) : this._stateText(e));
    const ctl = (e) => {
      const s = this._s(e), a = s.attributes, d = dom(e), name = esc(this._memberName(id, e));
      if (["switch", "input_boolean", "light", "fan"].includes(d)) {
        return `<div class="dv-c"><ha-icon icon="${this._icon(e)}"></ha-icon><span>${name}</span><div class="tg ${this._isOn(e) ? "on" : ""}" data-dvtg="${esc(e)}"><i></i></div></div>`;
      }
      if (d === "select") {
        return `<div class="dv-c col"><div class="dv-h"><ha-icon icon="${this._icon(e)}"></ha-icon><span>${name}</span></div>
          <div class="seg">${(a.options || []).map((o) => `<button class="pill ${o === s.state ? "solid" : ""}" data-dvsel="${esc(e)}" data-opt="${esc(o)}">${esc(this._st(o))}</button>`).join("")}</div></div>`;
      }
      if (d === "number") {
        return `<div class="dv-c"><ha-icon icon="${this._icon(e)}"></ha-icon><span>${name}</span>
          <button class="mini" data-dvnum="${esc(e)}" data-step="-1">−</button><b class="dv-v">${esc(this._sensorVal(e))}</b><button class="mini" data-dvnum="${esc(e)}" data-step="1">+</button></div>`;
      }
      if (d === "button") return `<div class="dv-c"><ha-icon icon="${this._icon(e)}"></ha-icon><span>${name}</span><button class="pill" data-dvbtn="${esc(e)}">${t("Executar")}</button></div>`;
      return `<div class="dv-c"><ha-icon icon="${this._icon(e)}"></ha-icon><span>${name}</span><small>${esc(this._stateText(e))}</small><button class="mini" data-dvopen="${esc(e)}"><ha-icon icon="mdi:chevron-right"></ha-icon></button></div>`;
    };
    const html = `${readings.length ? `<div class="sub">${t("Leituras")}</div><div class="dv-grid">${readings.map((e) =>
        `<div class="dv-r"><div class="dv-rv"><ha-icon icon="${this._icon(e)}"></ha-icon><b>${esc(value(e))}</b></div><small>${esc(this._memberName(id, e))}</small></div>`).join("")}</div>` : ""}
      <!--side-->${toggles.length || selects.length || controls.length ? `<div class="sub">${t("Controlos")}</div>` : ""}
      ${toggles.length || selects.length ? `<div class="dv-tgrid" style="grid-auto-flow:row dense">${toggles.map((e) => `<button class="dv-t ${this._isOn(e) ? "on" : ""}" data-dvtg="${esc(e)}"><ha-icon icon="${this._icon(e)}"></ha-icon><span>${esc(this._memberName(id, e))}</span></button>`).join("")}${selects.map(sel).join("")}</div>` : ""}
      ${controls.length ? `<div class="dv-list">${controls.map(ctl).join("")}</div>` : ""}`;
    this._selShown = this._selOpen; // the open option row animates once, not on every redraw
    return html;
  }

  // ---------- robot vacuum (Roborock and others) ----------
  /** A member of the vacuum's device by its entity id suffix (Roborock: sensor.<robot>_battery, _status…). */
  _vacMember(id, d, ...suffixes) {
    const mem = this._meta?.[id]?.members || [];
    return mem.find((e) => dom(e) === d && this._s(e) && suffixes.some((x) => e.endsWith("_" + x)));
  }
  /** Rooms of the robot's maps (Roborock: roborock.get_maps), loaded once per card. */
  _vacLoadRooms(id) {
    this._vacRooms ||= {};
    if (this._vacRooms[id] !== undefined) return;
    const plat = this._hass.entities?.[id]?.platform;
    const roborock = plat === "roborock" || (!plat && /roborock/i.test(this._meta?.[id]?.manufacturer || ""));
    if (!roborock) { this._vacRooms[id] = null; return; }
    this._vacRooms[id] = "loading";
    this._hass.callWS({ type: "call_service", domain: "roborock", service: "get_maps", target: { entity_id: id }, return_response: true })
      .then((r) => { const res = r?.response?.[id] ?? r?.response; this._vacRooms[id] = res?.maps || []; })
      .catch((e) => { console.warn("Pine3 Homeview: roborock.get_maps", e); this._vacRooms[id] = []; })
      .finally(() => { if (this._modal === id) this._render(); });
  }
  /** The map the robot is using: the one named by its "selected map" select, else the first. */
  _vacMap(id, maps) {
    if (!maps?.length) return null;
    const names = maps.map((m) => m.name);
    const sel = (this._meta?.[id]?.members || []).find((e) => dom(e) === "select" && (this._s(e)?.attributes.options || []).some((o) => names.includes(o)));
    return maps.find((m) => m.name === this._s(sel)?.state) || maps[0];
  }
  /**
   * The robot's routines (Roborock creates one button per routine of its app: no category and no
   * translated name, unlike its own buttons such as empty dustbin or the consumable resets).
   */
  _vacRoutines(id) {
    const reg = this._hass.entities || {};
    return (this._meta?.[id]?.members || []).filter((e) => dom(e) === "button" && this._s(e) && this._s(e).state !== "unavailable"
      && !reg[e]?.entity_category && !reg[e]?.translation_key && !/reset|consumable|empty_dustbin|dock_error/.test(e));
  }

  /** The robot's other entities, sorted: what you use when cleaning up front; maintenance, settings and diagnostics folded away. */
  _vacuumSections(id) {
    const cat = (e) => this._hass.entities?.[e]?.entity_category || null;
    const shown = new Set(["battery", "status", "cleaning_area", "cleaning_time", "clean_percent", "cleaning_progress", "vacuum_error", "dock_error"]
      .map((x) => this._vacMember(id, "sensor", x)).filter(Boolean));
    const routines = new Set(this._vacRoutines(id));
    const mem = (this._meta?.[id]?.members || []).filter((e) => this._s(e) && this._s(e).state !== "unavailable" && dom(e) !== "image" && !shown.has(e) && !routines.has(e));
    const isReading = (e) => ["sensor", "binary_sensor"].includes(dom(e));
    const maint = mem.filter((e) => (isReading(e) && /_(time_)?left$|_remaining$|consumable/.test(e)) || (dom(e) === "button" && /reset/.test(e)));
    const main = mem.filter((e) => !maint.includes(e) && !isReading(e) && (dom(e) === "select" || !cat(e)));
    const settings = mem.filter((e) => !maint.includes(e) && !main.includes(e) && !isReading(e));
    const diag = mem.filter((e) => !maint.includes(e) && isReading(e));
    this._vacOpen ||= {};
    const fold = (key, title, icon, list) => {
      if (!list.length) return "";
      const open = this._vacOpen[key];
      return `<button class="vac-sec ${open ? "open" : ""}" data-vsec="${key}"><ha-icon icon="mdi:${icon}"></ha-icon><span>${title}</span><small>${list.length}</small><ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></button>
        ${open ? `<div class="vac-secb">${this._deviceSection(id, list)}</div>` : ""}`;
    };
    return `${main.length ? this._deviceSection(id, main) : ""}
      <div class="vac-folds">${fold("maint", t("Manutenção"), "wrench-outline", maint)}${fold("set", t("Definições do robô"), "tune-variant", settings)}${fold("diag", t("Diagnóstico"), "chart-box-outline", diag)}</div>`;
  }

  /** A state in the integration's own words (HA's translations, e.g. Roborock's "Charging"), else ours. */
  _fmtState(e) {
    try { return this._hass.formatEntityState?.(this._s(e)) || this._stateText(e); } catch { return this._stateText(e); }
  }
  /** Battery level of a vacuum: its attribute or its device's battery sensor. */
  _vacBattery(id) {
    const a = this._s(id)?.attributes || {}, bat = this._vacMember(id, "sensor", "battery");
    const v = a.battery_level ?? (bat ? Number(this._s(bat).state) : null);
    return v != null && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null;
  }

  _vacuumContent(id) {
    const s = this._s(id), a = s.attributes, on = this._isOn(id);
    const bat = this._vacMember(id, "sensor", "battery");
    const level = a.battery_level ?? (bat ? Number(this._s(bat).state) : null);
    const status = this._vacMember(id, "sensor", "status");
    const area = this._vacMember(id, "sensor", "cleaning_area"), time = this._vacMember(id, "sensor", "cleaning_time"), pct = this._vacMember(id, "sensor", "clean_percent", "cleaning_progress");
    const err = this._vacMember(id, "sensor", "vacuum_error", "dock_error");
    const errOn = err && !["none", "ok", "unknown", "no_error"].includes(this._s(err).state);
    const now = on ? [area, time, pct].filter(Boolean).map((e) => this._sensorVal(e)).join(" · ") : "";
    // the integration's own translations (HA language) for its states and fan speeds, else ours
    const h = this._hass;
    const fmt = (e) => this._fmtState(e);
    const fanLabel = (f) => { try { const v = h.formatEntityAttributeValue?.(s, "fan_speed", f); return v && v !== f ? v : this._st(f); } catch { return this._st(f); } };
    const btn = (svc, icon, label, act) => `<button class="vac-b ${act ? "act" : ""}" data-svc="vacuum.${svc}"><ha-icon icon="mdi:${icon}"></ha-icon><span>${label}</span></button>`;
    const fans = a.fan_speed_list || [];
    // rooms (Roborock): pick some and clean only those
    this._vacLoadRooms(id);
    const maps = this._vacRooms?.[id], map = Array.isArray(maps) ? this._vacMap(id, maps) : null;
    const rooms = map ? Object.entries(map.rooms || {}) : [];
    const pick = (this._vacPick ||= {})[id] ||= [];
    // the map picture of the map in use (Roborock: one image entity per map)
    const imgs = (this._meta?.[id]?.members || []).filter((e) => dom(e) === "image" && this._s(e)?.attributes.entity_picture);
    const img = imgs.find((e) => map && (this._s(e).attributes.friendly_name || "").toLowerCase().includes(String(map.name).toLowerCase())) || imgs[0];
    return `<div class="vac-hd">
        ${level != null && Number.isFinite(level) ? `<div class="vac-bat"><ha-icon icon="mdi:battery${level >= 95 ? "" : "-" + Math.max(10, Math.round(level / 10) * 10)}"></ha-icon><b>${Math.round(level)}%</b></div>` : ""}
        <div class="vac-st"><b>${esc(fmt(status || id))}</b>${now ? `<small>${esc(now)}</small>` : ""}${errOn ? `<small class="vac-err">${esc(fmt(err))}</small>` : ""}</div>
      </div>
      ${(() => {
        const rs = this._vacRoutines(id);
        return rs.length ? `<div class="sub">${t("Rotinas")}</div><div class="row presets vac-rt">${rs.map((e) => `<button class="pill ${this._fired === e ? "act" : ""}" data-vroutine="${esc(e)}"><ha-icon icon="${this._s(e).attributes.icon || "mdi:play-circle-outline"}"></ha-icon>${esc(this._memberName(id, e))}</button>`).join("")}</div>` : "";
      })()}
      <div class="vac-btns">
        ${s.state === "cleaning" ? btn("pause", "pause", t("Pausar"), true) : btn("start", "play", s.state === "paused" ? t("Retomar") : t("Iniciar"))}
        ${btn("return_to_base", "home-import-outline", t("Voltar à base"), s.state === "returning")}
        ${btn("locate", "map-marker-radius-outline", t("Localizar"))}
      </div>
      ${fans.length > 1 ? `<div class="sub">${t("Potência")}</div><div class="row presets">${fans.map((f) => `<button class="pill ${f === a.fan_speed ? "act" : ""}" data-vfan="${esc(f)}">${esc(fanLabel(f))}</button>`).join("")}</div>` : ""}
      ${maps === "loading" ? `<div class="sub">${t("Divisões")}</div><div class="vac-note">${t("A carregar as divisões…")}</div>` : rooms.length ? `<div class="sub">${t("Limpar divisões")}</div>
        <div class="row presets">${rooms.map(([sid, name]) => `<button class="pill ${pick.includes(Number(sid)) ? "act" : ""}" data-vroom="${esc(sid)}">${esc(name)}</button>`).join("")}</div>
        <div class="row"><button class="pill solid" data-vclean ${pick.length ? "" : "disabled"}><ha-icon icon="mdi:broom"></ha-icon>${pick.length ? tp(pick.length, "Limpar {n} divisão", "Limpar {n} divisões") : t("Escolhe as divisões")}</button></div>` : ""}
      <!--side-->${img ? `<img class="vac-map" src="${esc(this._s(img).attributes.entity_picture)}" alt="">` : ""}`;
  }

  _extras(id) {
    const m = this._meta?.[id] || {};
    const big = this._cfg().big_devices?.includes(id);
    const pool = big ? (m.members || []).filter((e) => ["sensor", "binary_sensor"].includes(dom(e))).slice(0, 6) : m.extras;
    const ex = (pool || []).filter((e) => this._s(e) && this._s(e).state !== "unavailable");
    if (!ex.length) return "";
    const txt = ex.map((e) => {
      const dc = this._s(e).attributes.device_class;
      if (dom(e) === "binary_sensor") return dc === "battery" ? (this._s(e).state === "on" ? t("Bateria fraca") : "") : this._stateText(e);
      return this._sensorVal(e) + (dc === "battery" ? " 🔋" : "");
    }).filter(Boolean);
    return txt.length ? `<div class="ex">${esc(txt.join(" · "))}</div>` : "";
  }
}
