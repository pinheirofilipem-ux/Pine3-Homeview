// Pine3 Homeview - personal Home Assistant dashboard. Original code, no build step.
// Organises the home as Areas -> Devices -> Entities, built server-side by discovery.py.
// This file holds the element's life cycle, data and rendering; the screens and parts live in
// views/ and ui/ and are mixed into the element below.

import { TOGGLE, THEMES, DEFAULTS, dom, store, loadFonts } from "./const.js";
import { css } from "./styles.js";
import { t, setLang, lang } from "./i18n.js";
import { Weather } from "./weather.js";
import { toLight, currentTheme, isLight } from "./theme.js";
import { houseView, css3d } from "./house3d.js";
import { cssPlan } from "./plan2d.js";
import { clone, mixin } from "./util.js";
import { ModelMixin } from "./model.js";
import { DockMixin } from "./ui/dock.js";
import { DeviceMixin } from "./ui/device.js";
import { WeatherViewMixin } from "./views/forecast.js";
import { SettingsViewMixin } from "./views/settings.js";
import { EditMixin } from "./ui/edit.js";
import { HomeViewMixin } from "./views/home.js";
import { RoomsViewMixin } from "./views/rooms.js";
import { TilesMixin } from "./ui/tiles.js";
import { ModalMixin } from "./ui/modal.js";
import { BindMixin } from "./ui/bind.js";

loadFonts();

class Pine3HomeviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._view = "home";
    this._room = null;
    this._modal = null;
    this._drag = null;
    this._theme = store.get("theme", "ameixa");
    this._fired = null;
    this._edit = null; // working copy of layout settings while editing
    this._weather = new Weather(() => { if (!this._drag) this._render(); });
    this._lastActivity = Date.now();
    const wake = () => { this._lastActivity = Date.now(); };
    this.addEventListener("pointerdown", wake, true);
    this.addEventListener("keydown", wake, true);
    this.addEventListener("wheel", wake, { capture: true, passive: true });
  }

  connectedCallback() {
    this._tick = setInterval(() => this._onTick(), 15000);
    this._onFs = () => this._render();
    document.addEventListener("fullscreenchange", this._onFs);
    this._onVis = () => { if (document.visibilityState === "visible") this._applyWakeLock(); };
    document.addEventListener("visibilitychange", this._onVis);
    // per-device kiosk options (and ?kiosk in the URL) hide the Home Assistant sidebar
    const kiosk = /[?&#]kiosk\b/.test(location.search + location.hash);
    if (kiosk || store.get("hide_sidebar", false)) this._dockSidebar(true);
    this._applyWakeLock();
    this._onResize = () => { this._fit3d?.(); this._fitDock(); this._dockSpace(); this._placeBlob(false); this._packSections(); };
    window.addEventListener("resize", this._onResize);
    if (this._hass) this._connect();
  }
  disconnectedCallback() {
    clearInterval(this._tick);
    document.removeEventListener("fullscreenchange", this._onFs);
    document.removeEventListener("visibilitychange", this._onVis);
    this._wake?.release?.().catch(() => {});
    this._wake = null;
    window.removeEventListener("resize", this._onResize);
    this._unsub?.then?.((u) => u()).catch(() => {});
    this._unsub = null;
    this._connecting = false;
  }
  set narrow(n) { this._narrow = n; }
  set hass(h) {
    const prev = this._hass;
    this._hass = h;
    if (!this._connecting) this._connect();
    if (this._drag) return; // don't redraw under a finger
    // Home Assistant pushes a new hass object whenever *any* entity changes; only redraw
    // when something this screen shows has changed (redraws restart animations and flicker).
    if (prev && !this._affects(prev, h)) return;
    this._render();
  }

  /** Did anything the current screen depends on change between two hass objects? */
  _affects(prev, h) {
    if (!this._watch || prev.language !== h.language || prev.entities !== h.entities || prev.areas !== h.areas) return true;
    for (const id of this._watch) if (prev.states[id] !== h.states[id]) return true;
    return false;
  }

  /** Every entity the last render read, so state changes elsewhere don't trigger a redraw. */
  _collectWatch(rooms) {
    if (!this._model) { this._watch = null; return; } // local discovery reads registries too: always redraw
    const w = new Set();
    const add = (ids) => (ids || []).forEach((i) => w.add(i));
    for (const r of rooms) { add(r.ents); add(r.temperature); add(r.humidity); }
    for (const m of Object.values(this._meta || {})) { add(m.extras); add(m.members); }
    add(this._model.persons); add(this._model.scenes); add(this._model.scripts);
    if (this._cfg().appearance === "auto") w.add("sun.sun"); // day / night theme
    for (const sc of this._model.scenes || []) { const l = this._s(sc)?.attributes.entity_id; if (Array.isArray(l)) add(l); } // a scene lights up while its devices are on
    add(Object.keys(this._hass.states).filter((i) => i.startsWith("weather.")));
    { const ip = this._ipma(); add([ip.alert, ip.uv, ip.fire].filter(Boolean)); } // IPMA warnings
    if (this._modal && !this._modal.startsWith("_")) w.add(this._modal);
    this._watch = w;
  }

  /** Overlay class: the opening animation runs once, not on every redraw. */
  _ovEnter(key) {
    const enter = this._ovShown !== key;
    this._ovShown = key;
    return enter ? "enter" : "";
  }

  _onTick() {
    const mins = this._cfg().screensaver;
    if (mins && !this._saver && this._view !== "settings" && !this._edit && Date.now() - this._lastActivity > mins * 60000) {
      this._saver = true;
      this._modal = null;
      this._render();
      return;
    }
    this._updateClock();
  }

  // ---------- data ----------
  // The home model is built server-side (discovery.py) and pushed on registry changes.
  async _connect() {
    this._connecting = true;
    try {
      this._model = await this._hass.callWS({ type: "pine3_homeview/home" });
      if (this._model.settings?.theme) this._theme = this._model.settings.theme;
      this._unsub = this._hass.connection.subscribeMessage((m) => { this._model = m; if (!this._drag) this._render(); }, { type: "pine3_homeview/subscribe" });
    } catch (err) {
      console.warn("Pine3 Homeview: API unavailable, using local discovery", err);
      this._model = null;
    }
    this._render();
  }

  _saved() { return { ...clone(DEFAULTS), ...(this._model?.settings || store.get("settings", {})) }; }

  _cfg() {
    if (this._view === "settings" && this._draft) return this._draft;
    const c = this._saved();
    return this._edit ? { ...c, ...this._edit } : c;
  }

  async _persist(patch) {
    if (this._model) {
      const res = await this._hass.callWS({ type: "pine3_homeview/settings", ...patch });
      this._model.settings = res;
    } else store.set("settings", { ...this._saved(), ...patch });
  }

  _saveSettings(patch) {
    if (this._model) Object.assign(this._model.settings, patch);
    this._persist(patch).catch((e) => console.error("Pine3 Homeview", e));
  }

  _go(view, room = null) {
    this._view = view;
    if (room) this._room = room;
    this._render();
    window.scrollTo(0, 0);
  }
  _tap(id) {
    const d = dom(id), s = this._s(id);
    if (!s || s.state === "unavailable") return;
    if (d === "scene") return this._sceneTap(id);
    if (d === "script") return this._call(d, "turn_on", { entity_id: id });
    if (d === "button") return this._call("button", "press", { entity_id: id });
    if (d === "cover") return this._call("cover", s.state === "closed" || s.state === "closing" ? "open_cover" : "close_cover", { entity_id: id });
    if (d === "lock") return this._call("lock", s.state === "locked" ? "unlock" : "lock", { entity_id: id });
    if (d === "media_player") return this._isTv(id) ? this._openModal(id) : this._call("media_player", "media_play_pause", { entity_id: id });
    if (d === "climate" || d === "vacuum" || d === "camera" || d === "sensor" || d === "binary_sensor") return this._openModal(id);
    if (TOGGLE.has(d)) return this._call("homeassistant", "toggle", { entity_id: id });
  }
  _openModal(id) { this._modal = id; this._modalAt = Date.now(); this._render(); }
  /** A click that lands on a card just opened: the end of the press that opened it (a long press on a tablet), not a choice. */
  _ghost(el) { return !!el.closest?.(".ov") && Date.now() - (this._modalAt || 0) < 600; }

  // ---------- render ----------
  _render() {
    if (!this._hass) return;
    const cfg = this._cfg();
    setLang(cfg.language);
    const rooms = this._rooms();
    const room = this._view === "room" ? rooms.find((r) => r.id === this._room) : null;
    if (this._view === "room" && !room) this._view = "home";
    this.style.setProperty("--cream", cfg.card_color);
    this.style.setProperty("--amber", cfg.accent_color);
    this.setAttribute("lang", lang());
    let body;
    if (this._view === "settings" && this._draft) body = this._settingsView();
    else if (this._view === "room") body = this._roomView(room);
    else if (this._view === "scenes") body = this._scenesView(rooms);
    else if (this._view === "rooms") body = this._roomsView(rooms);
    else if (this._view === "security") body = this._securityView(rooms);
    else if (this._view === "climate") body = this._climateView(rooms);
    else if (this._view === "house") body = houseView(this, rooms);
    else body = this._homeView(rooms);

    const header = (this._narrow || this._view === "room") && this._view !== "settings" ? `<header>
      ${this._narrow ? `<div class="iconbtn" data-act="menu"><ha-icon icon="mdi:menu"></ha-icon></div>` : ""}
      ${this._view === "room" ? `<div class="iconbtn" data-act="back"><ha-icon icon="mdi:chevron-left"></ha-icon></div>` : ""}
      <div class="sp"></div>
    </header>` : "";
    const editBar = this._edit ? `<div class="edbar"><button class="pill" data-edcancel>${t("Cancelar")}</button><button class="pill solid" data-eddone><ha-icon icon="mdi:check"></ha-icon>${t("Concluído")}</button></div>` : "";

    const refocus = this._entFocus;
    // keep scroll positions of inner scrollers across the redraw
    const root = this.shadowRoot;
    const scrolls = [".sheet", ".sh-main", ".sh-side", ".scenes", ".fhs", ".set-nav"].map((sel) => [sel, [...root.querySelectorAll(sel)].map((e) => [e.scrollTop, e.scrollLeft])]);
    if (!this._modal && !this._saver) this._ovShown = null;
    this._collectWatch(rooms);
    // entering another screen: the content flows in (no blur on the 3D Home, a filter would flatten it)
    const viewKey = `${this._view}:${this._view === "room" ? this._room : ""}`;
    const anim = this._animOn(cfg);
    const vin = this._viewKey && this._viewKey !== viewKey && anim ? (this._view === "house" ? "vin flat" : "vin") : "";
    this.classList.toggle("noanim", !anim);
    this.classList.toggle("lite", this._liteFx());
    if (!this._app) {
      // the dock lives outside the redrawn part, so it doesn't flicker or replay its animation on every update
      root.innerHTML = `<style></style><div id="app"></div><nav class="dock" hidden><i class="blob"></i></nav>`;
      this._styleEl = root.querySelector("style");
      this._app = root.getElementById("app");
      this._dockEl = root.querySelector(".dock");
      new ResizeObserver(() => this._placeBlob(false)).observe(this._dockEl); // fonts loading, window size…
      document.fonts?.ready?.then(() => { if (this._dockEl) { this._dockEl._fit = null; this._fitDock(); this._placeBlob(false); } });
    }
    // appearance: a fixed theme, or the day / night one by the sun; light themes get the light stylesheet
    const themeKey = currentTheme(cfg, this._hass, this._theme);
    const light = isLight(themeKey);
    this.classList.toggle("light", light);
    if (this._styleLight !== light) {
      const all = `${css}${css3d}${cssPlan}`;
      this._styleEl.textContent = light ? (this._lightCss ||= toLight(all)) : all;
      this._styleLight = light;
    }
    this._viewKey = viewKey;
    this._app.innerHTML = `<div class="bg" style="background:${THEMES[themeKey] || THEMES.ameixa}"></div>
      <div class="wrap ${vin} ${this._view === "room" ? "roomv" : ""} ${cfg.layout === "list" ? "as-list" : ""} ${this._edit ? "editing" : ""}">${header}${body}</div>${editBar}${this._saver ? this._saverView(rooms) : this._modalView()}`;
    for (const [sel, pos] of scrolls) root.querySelectorAll(sel).forEach((e, k) => { if (pos[k]) { e.scrollTop = pos[k][0]; e.scrollLeft = pos[k][1]; } });
    this._updateDock(cfg);
    this._packSections();
    if (this._view === "settings") this._bindSettings();
    else this._bind(rooms);
    if (refocus) {
      const q = this.shadowRoot.querySelector("[data-entq]");
      if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); this._entFocus = true; }
    }
  }
}

mixin(Pine3HomeviewPanel, ModelMixin, DockMixin, DeviceMixin, WeatherViewMixin, SettingsViewMixin, EditMixin, HomeViewMixin, RoomsViewMixin, TilesMixin, ModalMixin, BindMixin);

if (!customElements.get("pine3-homeview-panel")) customElements.define("pine3-homeview-panel", Pine3HomeviewPanel);
