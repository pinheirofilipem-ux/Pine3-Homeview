// Pine3 Homeview - The dock: its buttons, the glass lens that slides to the active tab, and fitting it to the screen.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { DOCK_ITEMS } from "../const.js";
import { t, lang } from "../i18n.js";

export class DockMixin {
  /** Dock buttons: rebuilt only when the items or the language change; otherwise just the active one moves. */
  _updateDock(cfg) {
    const nav = this._dockEl, show = this._view !== "settings" && !this._edit;
    const items = DOCK_ITEMS.filter(([k]) => k === "home" || cfg.dock.includes(k));
    const key = items.map(([k]) => k).join() + lang();
    if (nav._key !== key) {
      nav.querySelectorAll("button").forEach((b) => b.remove());
      nav.insertAdjacentHTML("beforeend", items.map(([k, icon, label]) => `<button data-dock="${k}"><ha-icon icon="${icon}"></ha-icon><span>${t(label)}</span></button>`).join(""));
      nav.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
        this._edit = null;
        if (b.dataset.dock === "home") { this._face = null; this._faceDir = 0; } // Casa: back to the start face
        this._go(b.dataset.dock);
      }));
      nav._key = key;
      this._blobAt = null;
    }
    nav.hidden = !show;
    const active = this._view === "room" ? "rooms" : this._view;
    nav.querySelectorAll("button").forEach((b) => b.classList.toggle("act", b.dataset.dock === active));
    if (!show) { this._blobAt = null; return; }
    this._fitDock(active);
    this._dockSpace();
    this._placeBlob(this._blobAt != null && this._blobAt !== active);
    this._blobAt = active;
  }

  /** Smaller dock when it doesn't fit: first only the active tab keeps its name, then icons only. */
  _fitDock(active = this._blobAt) {
    const nav = this._dockEl;
    if (!nav || nav.hidden) return;
    const avail = Math.min(window.innerWidth, this.clientWidth || window.innerWidth) - 24;
    const sig = `${nav._key}|${active}|${avail}`;
    if (nav._fit === sig) return;
    nav._fit = sig;
    nav.classList.remove("compact", "icons");
    if (nav.scrollWidth > avail) nav.classList.add("compact");
    if (nav.scrollWidth > avail) nav.classList.add("icons");
  }

  /** The glass lens under the active tab; with `animate` it slides there and stretches like a drop on the way. */
  /** The space the floating dock takes at the bottom, so the content stops right above it (no needless scroll). */
  _dockSpace() {
    const nav = this._dockEl;
    if (!nav || nav.hidden) { this.style.removeProperty("--dock-space"); return; }
    const top = nav.getBoundingClientRect().top;
    if (top > 0) this.style.setProperty("--dock-space", `${Math.ceil(window.innerHeight - top)}px`);
  }
  _placeBlob(animate) {
    const nav = this._dockEl, blob = nav?.querySelector(".blob"), act = nav?.querySelector("button.act");
    if (!blob) return;
    if (!act || nav.hidden) { blob.style.opacity = "0"; return; }
    const nr = nav.getBoundingClientRect(), ar = act.getBoundingClientRect();
    if (!nr.width) return;
    blob.style.opacity = "";
    const anim = animate && !this.classList.contains("noanim");
    if (anim) { blob.classList.remove("go"); void blob.offsetWidth; blob.classList.add("go"); }
    else blob.style.transition = "none";
    blob.style.transform = `translateX(${ar.left - nr.left - nav.clientLeft}px)`;
    blob.style.width = `${ar.width}px`;
    if (!anim) { void blob.offsetWidth; blob.style.transition = ""; }
  }
}
