// Pine3 Homeview - Event wiring for the redrawn screen.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { DETAIL, dom } from "../const.js";
import { t } from "../i18n.js";
import { bindHouse } from "../house3d.js";

export class BindMixin {

  _bind() {
    const root = this.shadowRoot;
    const on = (sel, fn) => root.querySelectorAll(sel).forEach((el) => el.addEventListener("click", (ev) => { if (!this._ghost(el)) fn(el, ev); }));
    if (this._view === "home") this._bindFaces(root);
    if (this._ambient) return;
    on('[data-act="back"]', () => { this._edit = null; this._go("home"); });
    on('[data-act="menu"]', () => this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })));
    on('[data-act="settings"]', () => this._openSettings());
    on("[data-editstart]", () => this._startEdit());
    on("[data-fs]", () => this._toggleFullscreen());
    on("[data-wx]", () => this._openForecast());
    if (this._edit) {
      this._bindEdit(root);
    } else {
      on("[data-nav]", (el) => this._go(el.dataset.nav));
      if (this._view !== "house") on("[data-room]", (el) => this._go("room", el.dataset.room));
      on("[data-roomlights]", (el, ev) => {
        ev.stopPropagation();
        const r = this._rooms().find((x) => x.id === el.dataset.roomlights);
        // the room's lights only (plugs and switches stay as they are); a room without lights switches its devices
        const sw = this._switchables(r), lights = sw.filter((i) => dom(i) === "light"), pool = lights.length ? lights : sw;
        const onNow = pool.filter((i) => this._isOn(i));
        if (onNow.length) this._call("homeassistant", "turn_off", { entity_id: onNow });
        else this._call("homeassistant", "turn_on", { entity_id: pool });
      });
      on("[data-all]", (el) => {
        const lights = this._rooms().flatMap((r) => r.ents).filter((i) => dom(i) === "light");
        if (lights.length) this._call("light", el.dataset.all === "on" ? "turn_on" : "turn_off", { entity_id: lights });
      });
      on("[data-pw]", (el, ev) => { ev.stopPropagation(); this._call("homeassistant", "toggle", { entity_id: el.dataset.pw }); });
      on("[data-rcat]", (el) => { const v = el.dataset.rcat; this._roomCat = v === "" || Number(v) === this._roomCat ? null : Number(v); this._render(); });
      on("[data-rlights]", (el) => {
        const r = this._rooms().find((x) => x.id === this._room), ls = (r?.ents || []).filter((i) => dom(i) === "light");
        if (ls.length) this._call("light", el.dataset.rlights === "on" ? "turn_on" : "turn_off", { entity_id: ls });
      });
      on("[data-open]", (el) => this._openModal(el.dataset.open));
      // climate cards: power and ± target, without opening the card
      on("[data-cpw]", (el, ev) => {
        ev.stopPropagation();
        const id = el.dataset.cpw;
        this._call("climate", this._isOn(id) ? "turn_off" : "turn_on", { entity_id: id });
      });
      on("[data-chvac]", (el, ev) => {
        ev.stopPropagation();
        const id = el.dataset.chvac, m = el.dataset.m;
        if (this._s(id)?.state !== m) this._call("climate", "set_hvac_mode", { entity_id: id, hvac_mode: m });
      });
      on("[data-ctemp]", (el, ev) => {
        ev.stopPropagation();
        const id = el.dataset.ctemp, a = this._s(id).attributes;
        const step = a.target_temp_step || (this._hass.config?.unit_system?.temperature === "°F" ? 1 : 0.5);
        const v = Math.min(a.max_temp ?? 35, Math.max(a.min_temp ?? 7, Math.round(((this._climateTarget(id) ?? 20) + step * Number(el.dataset.d)) * 10) / 10));
        (this._ctWant ||= {})[id] = { v, t: Date.now() };
        this._call("climate", "set_temperature", { entity_id: id, temperature: v });
        this._render();
      });
      on("[data-media]", (el, ev) => { ev.stopPropagation(); this._call("media_player", el.dataset.media, { entity_id: el.dataset.entId }); });
      on("[data-scene]", (el) => this._sceneTap(el.dataset.scene));
      // tiles: tap = action, long-press / right-click = details
      root.querySelectorAll("[data-ent]").forEach((el) => {
        const id = el.dataset.ent;
        let timer, long = false;
        // a robot vacuum opens its card on a plain tap: no long press, so the end of a press never lands on Start
        const start = () => { long = false; if (dom(id) === "vacuum") return; timer = setTimeout(() => { long = true; if (DETAIL.has(dom(id)) || this._meta?.[id]) this._openModal(id); }, 450); };
        const cancel = () => clearTimeout(timer);
        el.addEventListener("pointerdown", start);
        el.addEventListener("pointerup", cancel);
        el.addEventListener("pointerleave", cancel);
        el.addEventListener("contextmenu", (ev) => { ev.preventDefault(); cancel(); this._openModal(id); });
        el.addEventListener("click", () => {
          if (long) return;
          if (el.querySelector("[data-pw]") && DETAIL.has(dom(id))) this._openModal(id);
          else this._tap(id);
        });
      });
      if (this._view === "house") bindHouse(this, root);
    }

    // modal
    const ov = root.querySelector(".ov");
    if (!ov) return;
    ov.addEventListener("click", (ev) => { if (ev.target === ov && !this._ghost(ov)) { this._modal = null; this._render(); } });
    on("[data-closex]", () => { this._modal = null; this._render(); });
    const id = this._modal;
    on("[data-toggle]", () => (dom(id) === "media_player" ? this._call("media_player", this._isOn(id) ? "turn_off" : "turn_on", { entity_id: id }) : this._tap(id)));
    on("[data-src]", (el) => this._call("media_player", "select_source", { entity_id: id, source: el.dataset.src }));
    on("[data-mute]", () => this._call("media_player", "volume_mute", { entity_id: id, is_volume_muted: !this._s(id).attributes.is_volume_muted }));
    on("[data-more]", () => { this._modal = null; this._render(); this._moreInfo(id); });
    on("[data-svc]", (el) => { const [d, s] = el.dataset.svc.split("."); this._call(d, s, { entity_id: id }); });
    on("[data-vsec]", (el) => { const k = el.dataset.vsec; this._vacOpen[k] = !this._vacOpen[k]; this._render(); });
    on("[data-vroutine]", (el) => {
      const e = el.dataset.vroutine;
      this._call("button", "press", { entity_id: e });
      this._fired = e; this._render();
      setTimeout(() => { this._fired = null; this._render(); }, 1200);
    });
    on("[data-vfan]", (el) => this._call("vacuum", "set_fan_speed", { entity_id: id, fan_speed: el.dataset.vfan }));
    on("[data-vroom]", (el) => {
      const sid = Number(el.dataset.vroom), pick = (this._vacPick[id] ||= []);
      this._vacPick[id] = pick.includes(sid) ? pick.filter((x) => x !== sid) : [...pick, sid];
      this._render();
    });
    on("[data-vclean]", () => {
      const segs = this._vacPick?.[id] || [];
      if (!segs.length) return;
      // what the Roborock integration itself sends to clean rooms (segments of the current map)
      this._call("vacuum", "send_command", { entity_id: id, command: "app_segment_clean", params: [{ segments: segs }] });
      this._vacPick[id] = [];
      this._render();
    });
    on("[data-color]", (el) => { const h = el.dataset.color; this._call("light", "turn_on", { entity_id: id, rgb_color: [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) }); });
    on("[data-preset]", (el) => this._call(dom(id), "set_preset_mode", { entity_id: id, preset_mode: el.dataset.preset }));
    on("[data-dvtg]", (el) => this._call("homeassistant", "toggle", { entity_id: el.dataset.dvtg }));
    on("[data-dvopensel]", (el) => { this._selOpen = this._selOpen === el.dataset.dvopensel ? null : el.dataset.dvopensel; this._render(); });
    on("[data-dvsel]", (el) => {
      const e = el.dataset.dvsel;
      (this._selWant ||= {})[e] = { o: el.dataset.opt, t: Date.now() };
      this._selOpen = null;
      this._call(dom(e) === "input_select" ? "input_select" : "select", "select_option", { entity_id: e, option: el.dataset.opt });
      this._render();
    });
    on("[data-dvbtn]", (el) => this._call("button", "press", { entity_id: el.dataset.dvbtn }));
    on("[data-dvopen]", (el) => this._openModal(el.dataset.dvopen));
    on("[data-dvnum]", (el) => {
      const e = el.dataset.dvnum, a = this._s(e).attributes, step = Number(a.step) || 1;
      const v = Math.min(a.max ?? Infinity, Math.max(a.min ?? -Infinity, Number(this._s(e).state) + step * Number(el.dataset.step)));
      this._call("number", "set_value", { entity_id: e, value: Math.round(v * 1000) / 1000 });
    });
    on("[data-hvac]", (el) => this._call("climate", "set_hvac_mode", { entity_id: id, hvac_mode: el.dataset.hvac }));
    on("[data-cmode]", (el) => {
      const attr = el.dataset.cmode;
      this._call("climate", `set_${attr}`, { entity_id: id, [attr]: el.dataset.v });
    });
    on("[data-temp]", (el) => {
      const a = this._s(id).attributes;
      const clamp = (v) => Math.min(a.max_temp ?? 35, Math.max(a.min_temp ?? 7, Math.round(v * 10) / 10));
      const dt = Number(el.dataset.temp), end = el.dataset.end;
      if (!end) return this._call("climate", "set_temperature", { entity_id: id, temperature: clamp((a.temperature ?? 20) + dt) });
      // range: move one end, never past the other
      let lo = a.target_temp_low, hi = a.target_temp_high;
      if (end === "low") lo = Math.min(clamp(lo + dt), hi); else hi = Math.max(clamp(hi + dt), lo);
      this._call("climate", "set_temperature", { entity_id: id, target_temp_low: lo, target_temp_high: hi });
    });
    root.querySelectorAll("[data-slider]").forEach((el) => this._bindSlider(el, id));
  }
}
