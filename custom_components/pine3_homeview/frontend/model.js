// Pine3 Homeview - The home model: rooms from discovery.py (or local discovery), and per-entity helpers (state, name, icon, text).
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { SHOWN, DOMAIN_ICON, DEVICE_CLASS_ICON, ACCENT, STATE_PT, BIN_PT, NAME_ICON, dom } from "./const.js";
import { t, num, locale } from "./i18n.js";

export class ModelMixin {

  _rooms() {
    const cfg = this._cfg();
    const order = cfg.room_order || [], hid = cfg.hidden_rooms || [], hiddenDev = cfg.hidden || [];
    const pos = (list, id) => { const k = list.indexOf(id); return k < 0 ? 1e4 : k; };
    const sortBy = (list, items, key = (x) => x) => items.map((x, k) => [x, k]).sort((a, b) => pos(list, key(a[0])) - pos(list, key(b[0])) || a[1] - b[1]).map(([x]) => x);
    let out = [];
    this._meta = {};
    if (this._model) {
      for (const r of this._model.rooms) {
        for (const d of r.devices) this._meta[d.id] = d;
        const shown = cfg.shown || [];
        const extra = (r.entities || []).filter((e) => !e.primary && shown.includes(e.id) && !hiddenDev.includes(e.id) && this._s(e.id));
        for (const e of extra) this._meta[e.id] = { ...e, extras: [], extra: true };
        let ents = [...r.devices.filter((d) => !hiddenDev.includes(d.id) && this._s(d.id)).map((d) => d.id), ...extra.map((e) => e.id)];
        ents = sortBy(cfg.device_order?.[r.id] || [], ents);
        const scenes = r.scenes.filter((i) => this._s(i));
        if (!ents.length && !scenes.length) continue;
        out.push({ ...r, ents: [...ents, ...scenes], count: ents.length });
      }
    } else out = this._localRooms();
    this._hiddenRooms = out.filter((r) => hid.includes(r.id));
    return sortBy(order, out.filter((r) => !hid.includes(r.id)), (r) => r.id);
  }

  _localRooms() {
    const h = this._hass, rooms = new Map();
    for (const a of Object.values(h.areas || {})) rooms.set(a.area_id, { id: a.area_id, name: a.name, icon: a.icon, floor_level: h.floors?.[a.floor_id]?.level ?? 0, ents: [] });
    const none = { id: "_none", name: "Outros", icon: "mdi:home-outline", ents: [] };
    for (const e of Object.values(h.entities || {})) {
      if (!SHOWN.has(dom(e.entity_id)) || e.hidden || e.entity_category || !h.states[e.entity_id]) continue;
      const area = e.area_id || h.devices?.[e.device_id]?.area_id;
      const r = rooms.get(area);
      if (r) r.ents.push(e.entity_id);
      else if (!["scene", "script"].includes(dom(e.entity_id))) none.ents.push(e.entity_id);
    }
    const list = [...rooms.values()].filter((r) => r.ents.length).sort((a, b) => a.name.localeCompare(b.name, locale()));
    if (none.ents.length) list.push(none);
    for (const r of list) r.count = r.ents.filter((i) => dom(i) !== "scene").length;
    return list;
  }

  _s(id) { return this._hass.states[id]; }
  _name(id) { return this._meta?.[id]?.name || this._s(id)?.attributes.friendly_name || id; }
  _roomName(r) { return r.id === "_none" ? t("Outros") : r.name; }
  _isOn(id) {
    const s = this._s(id); if (!s) return false;
    const d = dom(id);
    if (d === "lock") return s.state === "unlocked";
    if (d === "climate") return s.state !== "off" && s.state !== "unavailable";
    if (d === "media_player") return this._isTv(id) ? !["off", "standby", "unavailable", "unknown"].includes(s.state) : ["playing", "on", "paused", "buffering"].includes(s.state);
    if (d === "vacuum") return ["cleaning", "returning"].includes(s.state);
    return ["on", "open", "opening", "closing", "home"].includes(s.state);
  }
  /** A TV (device class "tv", e.g. HomeKit / Samsung / LG, or "TV" in its name), as opposed to a speaker. */
  _isTv(id) {
    const s = this._s(id);
    if (dom(id) !== "media_player" || !s) return false;
    return s.attributes.device_class === "tv" || /\btv\b|televis/i.test(`${this._meta?.[id]?.name || ""} ${s.attributes.friendly_name || ""}`);
  }
  _icon(id) {
    const s = this._s(id), d = dom(id), dc = s?.attributes.device_class;
    // integration icon sets (e.g. the Philips purifier's "pap:") may not be loaded here: use mdi/hass only
    if (/^(mdi|hass):/.test(s?.attributes.icon || "")) return s.attributes.icon;
    const m = this._meta?.[id];
    if (d === "media_player" && /apple/i.test(m?.manufacturer || "")) {
      if (/homepod/i.test(m.model || "")) return "mdi:speaker";
      if (/tv/i.test(m.model || "")) return "mdi:television-box";
    }
    if (d === "media_player") {
      if (this._isTv(id)) return "mdi:television";
      if (dc === "receiver") return "mdi:audio-video";
    }
    if (d === "light") return this._isOn(id) ? "mdi:lightbulb-on" : "mdi:lightbulb-outline";
    if (d === "lock") return s?.state === "locked" ? "mdi:lock" : "mdi:lock-open-variant";
    if (d === "cover") return s?.state === "closed" ? "mdi:window-shutter" : "mdi:window-shutter-open";
    if (d === "climate") return (s?.attributes.hvac_modes || []).includes("cool") ? "mdi:air-conditioner" : "mdi:thermostat";
    if (DEVICE_CLASS_ICON[dc]) return DEVICE_CLASS_ICON[dc];
    if (["fan", "switch", "select", "number", "sensor", "button"].includes(d)) {
      const n = `${m?.name || ""} ${s?.attributes.friendly_name || ""}`;
      // the purifier hint is for the fan itself; its other entities ("Purifier filter") use the rest
      const hit = NAME_ICON.find(([re, icon]) => (icon === "mdi:air-purifier") === (d === "fan") && re.test(n));
      if (hit) return hit[1];
    }
    return DOMAIN_ICON[d] || "mdi:circle-outline";
  }
  _accent(id) {
    const s = this._s(id);
    if (dom(id) === "light" && s?.attributes.rgb_color) return `rgb(${s.attributes.rgb_color.join(",")})`;
    if (dom(id) === "lock" && s && !["locked", "unavailable", "unknown"].includes(s.state)) return "#ff9f0a"; // unlocked / open / jammed
    return ACCENT[dom(id)] || "#5ac8fa";
  }
  _st(state) { return STATE_PT[state] ? t(STATE_PT[state]) : state; }
  _stateText(id) {
    const s = this._s(id); if (!s) return "";
    const d = dom(id), a = s.attributes;
    if (s.state === "unavailable") return t("Indisponível");
    if (d === "light" && s.state === "on" && a.brightness != null) return `${Math.round((a.brightness / 255) * 100)}%`;
    if (d === "cover" && a.current_position != null && s.state !== "closed") return t("{n}% aberto", { n: a.current_position });
    if (d === "climate") {
      const act = s.state !== "off" && a.hvac_action && !["off", "idle"].includes(a.hvac_action) ? a.hvac_action : null;
      const tgt = a.temperature ?? (a.target_temp_low != null && a.target_temp_high != null ? `${num(a.target_temp_low)}–${num(a.target_temp_high)}` : null);
      return `${this._st(act || s.state)}${a.current_temperature != null ? ` · ${num(a.current_temperature)}°` : ""}${s.state !== "off" && tgt != null ? ` → ${typeof tgt === "number" ? num(tgt) : tgt}°` : ""}`;
    }
    if (d === "media_player") {
      const title = a.media_title ? (a.media_artist ? `${a.media_title} · ${a.media_artist}` : a.media_title) : null;
      if (["playing", "paused"].includes(s.state) && (title || a.app_name)) return title || a.app_name;
      if (a.app_name && !["off", "standby"].includes(s.state)) return `${this._st(s.state)} · ${a.app_name}`;
      if (a.source && this._isTv(id) && !["off", "standby"].includes(s.state)) return `${this._st(s.state)} · ${a.source}`;
    }
    if (d === "binary_sensor") { const m = BIN_PT[a.device_class]; if (m) return t(m[s.state === "on" ? 1 : 0]); }
    if (d === "sensor") return this._sensorVal(id);
    if (d === "scene" || d === "script" || d === "button") return t("Tocar para executar");
    return this._st(s.state);
  }
  _sensorVal(id) {
    const s = this._s(id), u = s.attributes.unit_of_measurement || "";
    const n = Number(s.state);
    const v = Number.isFinite(n) && s.state !== "" ? (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString(locale()) : this._st(s.state);
    return `${v}${u ? (u === "°C" || u === "%" ? u : " " + u) : ""}`;
  }
  _roomClimate(r) {
    const by = (dc) => [...(r[dc] || []), ...r.ents].find((i) => dom(i) === "sensor" && this._s(i)?.attributes.device_class === dc && Number.isFinite(Number(this._s(i).state)));
    const tt = by("temperature"), hm = by("humidity");
    const c = r.ents.find((i) => dom(i) === "climate" && this._s(i)?.attributes.current_temperature != null);
    return {
      temp: tt ? this._sensorVal(tt) : c ? `${num(this._s(c).attributes.current_temperature)}°` : null,
      hum: hm ? this._sensorVal(hm) : null,
    };
  }
  _switchables(r) { return r.ents.filter((i) => ["light", "switch", "fan", "input_boolean"].includes(dom(i))); }

  // ---------- actions ----------
  _call(d, svc, data) { return this._hass.callService(d, svc, data); }
}
