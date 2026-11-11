// Pine3 Homeview - Per-device options (kiosk, full screen, wake lock, lighter effects) and the clock.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { store } from "../const.js";
import { locale } from "../i18n.js";
import { cap } from "../util.js";

export class DeviceMixin {
  _moreInfo(id) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  // ---------- full screen & kiosk (per device) ----------
  _fsSupported() { return !!(document.fullscreenEnabled && document.documentElement.requestFullscreen); }
  _toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.({ navigationUI: "hide" }).catch((e) => console.warn("Pine3 Homeview: fullscreen", e));
  }
  /** Ask the Home Assistant frontend to hide (or dock again) its sidebar. */
  _dockSidebar(hide) {
    this.dispatchEvent(new CustomEvent("hass-dock-sidebar", { detail: { dock: hide ? "always_hidden" : "docked" }, bubbles: true, composed: true }));
  }
  async _applyWakeLock() {
    if (!store.get("wake_lock", false) || !navigator.wakeLock || this._wake) return;
    try {
      this._wake = await navigator.wakeLock.request("screen");
      this._wake.addEventListener("release", () => { this._wake = null; });
    } catch (e) { console.warn("Pine3 Homeview: wake lock", e); }
  }
  // ---------- per-device performance (stored in this browser only) ----------
  /** A weak device: little memory (Chrome reports ≤2 GB) or an old engine without color-mix(). */
  _weakDevice() {
    const mem = navigator.deviceMemory;
    return (mem != null && mem <= 2) || !window.CSS?.supports?.("color", "color-mix(in srgb, red, blue)");
  }
  /** How this device shows the house: full | lite | image | plan. */
  _houseMode() {
    const v = store.get("house_mode", "auto");
    if (v !== "auto") return v;
    const mem = navigator.deviceMemory;
    return this._weakDevice() ? "image" : mem != null && mem <= 4 ? "lite" : "full";
  }
  /** Light effects: no frosted-glass blur (backdrop-filter), the costliest thing for a weak GPU. */
  _liteFx() { const v = store.get("lite_fx", "auto"); return v === "auto" ? this._weakDevice() || this._wallTablet() : v === "on"; }
  /** A touch tablet with up to 4 GB (e.g. Galaxy Tab A7): blur costs it more than it gives, so "light glass" by default. */
  _wallTablet() {
    const mem = navigator.deviceMemory;
    return mem != null && mem <= 4 && navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) >= 600;
  }
  /** Animations: this device's choice, or the panel-wide setting. */
  _animOn(cfg) { const v = store.get("anim", "auto"); return v === "auto" ? cfg.animations !== false : v === "on"; }
  _localChoice(key, value, options, label, sub) {
    return `<div class="opt col"><div><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</div><div class="seg">${options.map(([v, l]) =>
      `<button class="pill ${v === value ? "solid" : ""}" data-lchoice="${key}" data-val="${v}">${l}</button>`).join("")}</div></div>`;
  }

  _localToggle(key, label, sub, disabled) {
    const on = store.get(key, false);
    return `<div class="opt ${disabled ? "dis" : ""}"><div><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</div><div class="tg ${on ? "on" : ""}" data-local="${key}"><i></i></div></div>`;
  }

  // ---------- clock & weather ----------
  _clockText() {
    const h12 = !this._cfg().clock_24h;
    return new Date().toLocaleTimeString(h12 ? "en-US" : locale(), { hour: "2-digit", minute: "2-digit", hour12: h12 });
  }
  _dateText(opts = { weekday: "long", day: "numeric", month: "long" }) { return cap(new Date().toLocaleDateString(locale(), opts)); }
  _updateClock() {
    this.shadowRoot.querySelectorAll(".clock").forEach((el) => { el.textContent = this._clockText(); });
  }
}
