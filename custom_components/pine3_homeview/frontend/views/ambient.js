// Pine3 Homeview - ambient faces: Fotografias (a photo frame from a Home Assistant media folder),
// Fluxo (slow glass shapes on a canvas that move aside under a finger) and the Casa 3D face.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { WEATHER_ICON, esc } from "../const.js";
import { t, num } from "../i18n.js";
import { houseView } from "../house3d.js";

const LOCAL = "media-source://media_source/local";
const LIST_REFRESH = 30 * 60e3;

export class AmbientMixin {

  // ---------- Fotografias ----------
  /** Photos of the chosen folder (media_source), listed again every 30 minutes. */
  _photoList() {
    const folder = this._cfg().photos_folder;
    if (!folder) return [];
    const c = this._photos;
    if ((!c || c.folder !== folder || Date.now() - c.at > LIST_REFRESH) && !this._photosLoading) {
      this._photosLoading = true;
      this._hass.callWS({ type: "media_source/browse_media", media_content_id: folder })
        .then((r) => {
          const items = (r.children || []).filter((x) => x.media_class === "image" || /^image\//.test(x.media_content_type || "")).map((x) => x.media_content_id);
          // shuffle once per listing, so a big folder doesn't always start with the same photos
          for (let k = items.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [items[k], items[j]] = [items[j], items[k]]; }
          this._photos = { folder, at: Date.now(), items, error: null };
        })
        .catch((e) => { console.warn("Pine3 Homeview: photos", e); this._photos = { folder, at: Date.now(), items: [], error: String(e?.message || e) }; })
        .finally(() => { this._photosLoading = false; if (this._isFace("fotos")) this._nextPhoto(true); });
    }
    return c && c.folder === folder ? c.items : [];
  }
  _isFace(id) { return this._view === "home" && this._faceId() === id; }

  /** Show the next photo: resolve its URL, load it, then fade it in (without redrawing the panel). */
  async _nextPhoto(first = false) {
    const list = this._photoList();
    if (!list.length) { if (first) this._render(); return; }
    this._photoIdx = ((this._photoIdx ?? -1) + 1) % list.length;
    try {
      const r = await this._hass.callWS({ type: "media_source/resolve_media", media_content_id: list[this._photoIdx] });
      const url = this._hass.hassUrl ? this._hass.hassUrl(r.url) : r.url;
      await new Promise((ok, bad) => { const im = new Image(); im.onload = ok; im.onerror = bad; im.src = url; });
      this._photoUrl = url;
      this._photoAt = Date.now();
      const img = this.shadowRoot.querySelector("[data-photo] img");
      if (img) { img.classList.remove("in"); void img.offsetWidth; img.src = url; img.classList.add("in"); }
      else if (this._isFace("fotos")) this._render();
    } catch (e) { console.warn("Pine3 Homeview: photo", e); }
  }
  /** Called every 15 s: time for the next photo? */
  _photoTick() {
    if (!this._isFace("fotos")) return;
    const every = (this._cfg().photo_interval || 30) * 1000;
    if (!this._photoUrl || Date.now() - (this._photoAt || 0) >= every - 500) this._nextPhoto(!this._photoUrl);
  }

  _photosFace(ambient) {
    const cfg = this._cfg(), list = this._photoList(), w = this._wx();
    const cap = `<div class="ph-cap"><div class="clock">${this._clockText()}</div>
      <div class="ph-sub">${esc(this._dateText())}${w ? ` · <ha-icon icon="${WEATHER_ICON[w.cond] || "mdi:weather-partly-cloudy"}"></ha-icon> ${num(Math.round(w.temp))}°` : ""}</div></div>`;
    let inner;
    if (!cfg.photos_folder) inner = `<div class="ph-empty"><ha-icon icon="mdi:image-multiple-outline"></ha-icon><b>${t("Escolhe uma pasta de fotografias")}</b><span>${t("Em Definições → Início → Fotografias. As fotografias vêm da pasta de media do Home Assistant (/media).")}</span></div>`;
    else if (this._photos?.error) inner = `<div class="ph-empty"><ha-icon icon="mdi:image-off-outline"></ha-icon><b>${t("Não foi possível abrir a pasta")}</b><span>${esc(this._photos.error)}</span></div>`;
    else if (!list.length) inner = `<div class="ph-empty"><ha-icon icon="mdi:image-multiple-outline"></ha-icon><b>${this._photos ? t("Não há fotografias nesta pasta") : t("A carregar as fotografias…")}</b></div>`;
    else inner = `<img class="in" alt="" src="${esc(this._photoUrl || "")}" ${this._photoUrl ? "" : "hidden"}>`;
    if (list.length && !this._photoUrl) queueMicrotask(() => this._photoTick());
    return `<div class="phf ${ambient ? "saver" : ""}" data-photo ${ambient ? "data-wake" : ""}>${inner}${cap}</div>`;
  }

  /** Settings → Home: the photo folder and how long each photo shows. */
  _photosSettings(d) {
    if (!this._photoFolders && !this._photoFoldersLoading) {
      this._photoFoldersLoading = true;
      this._hass.callWS({ type: "media_source/browse_media", media_content_id: LOCAL })
        .then((r) => { this._photoFolders = [[LOCAL, t("Media (pasta principal)")], ...(r.children || []).filter((x) => x.can_expand).map((x) => [x.media_content_id, x.title])]; })
        .catch(() => { this._photoFolders = []; })
        .finally(() => { this._photoFoldersLoading = false; if (this._view === "settings") this._render(); });
    }
    const folders = this._photoFolders || [];
    if (d.photos_folder && !folders.some(([v]) => v === d.photos_folder)) folders.push([d.photos_folder, d.photos_folder.replace(LOCAL, "media")]);
    return `<div class="panel glass"><h3 style="margin-top:0">${t("Fotografias")}</h3><p>${t("O face Fotografias mostra as fotografias de uma pasta de media do Home Assistant, com a hora por cima.")}</p><div class="opts">
      ${this._choice("photos_folder", d.photos_folder || "", [["", t("Nenhuma")], ...folders.map(([v, l]) => [v, esc(l)])], t("Pasta"),
        this._photoFolders ? (folders.length ? t("Põe as fotografias em /media (ou numa pasta dentro dela) no Home Assistant.") : t("Não foi possível ler as pastas de media.")) : t("A ler as pastas…"))}
      ${this._choice("photo_interval", d.photo_interval || 30, [[15, "15 s"], [30, "30 s"], [60, "1 min"], [300, "5 min"]], t("Cada fotografia"), t("Quanto tempo cada fotografia fica no ecrã."))}
    </div></div>`;
  }

  /** Animate the Fluxo canvas while it is on screen: about 30 frames a second (20 with light effects). */
  _startFlow(root) {
    const cv = root.querySelector("[data-flow]");
    if (!cv) return;
    const cx = cv.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !this._animOn(this._cfg());
    const frameMs = this._liteFx() ? 50 : 33;
    const shapes = this._flowShapes ||= [
      [0.33, 0.27, 0.19, 0.37, 0.4, "#b7f0d8"], [0.52, 0.12, 0.085, 0.36, 0.5, "#bdeedc"], [0.62, 0.25, 0.08, 0.23, 0.5, "#c8f0e4"],
      [0.25, 0.52, 0.18, 0.13, 0.5, "#cfd6f2"], [0.53, 0.55, 0.065, 0.13, 0.5, "#c5d9ef"], [0.6, 0.52, 0.11, 0.23, 0.5, "#c2e6e6"],
      [0.34, 0.66, 0.11, 0.23, 0.5, "#cdd1f3"], [0.52, 0.77, 0.18, 0.13, 0.5, "#cfe4ee"],
    ].map(([x, y, w, h, r, c], k) => ({ x, y, w, h, r, c, k, ox: 0, oy: 0 }));
    let finger = null, last = 0;
    const local = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height }; };
    cv.addEventListener("pointermove", (e) => { finger = local(e); });
    cv.addEventListener("pointerdown", (e) => { finger = local(e); });
    cv.addEventListener("pointerleave", () => { finger = null; });
    const rr = (x, y, w, h, r) => { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); };
    const frame = (time) => {
      if (!cv.isConnected) return; // the face was left: stop
      if (!reduce) requestAnimationFrame(frame);
      if (time - last < frameMs) return;
      last = time;
      const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H);
      const g = cx.createRadialGradient(W * 0.45, H * 0.42, 0, W * 0.45, H * 0.42, Math.max(W, H) * 0.4);
      g.addColorStop(0, "rgba(120,230,170,.45)"); g.addColorStop(1, "rgba(120,230,170,0)");
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      const p = reduce ? 0 : time / 1000, unit = Math.min(W, H * 1.6);
      for (const s of shapes) {
        // drift slowly; a finger nearby pushes the shape away, and it eases back
        let tx = 0, ty = 0;
        if (finger) {
          const dx = s.x + s.w / 2 - finger.x, dy = s.y + s.h / 2 - finger.y, d = Math.hypot(dx, dy * 0.6);
          if (d < 0.25) { const f = (0.25 - d) / 0.25; tx = (dx / (d || 1)) * f * 0.08; ty = (dy / (d || 1)) * f * 0.08; }
        }
        s.ox += (tx - s.ox) * 0.08; s.oy += (ty - s.oy) * 0.08;
        const x = (s.x + s.ox) * W + Math.sin(p * 0.25 + s.k) * W * 0.012, y = (s.y + s.oy) * H + Math.cos(p * 0.2 + s.k * 1.7) * H * 0.015;
        const w = s.w * unit, h = s.h * H, r = Math.min(s.r * Math.min(w, h), w / 2, h / 2);
        const lg = cx.createLinearGradient(x, y, x, y + h);
        lg.addColorStop(0, s.c + "f0"); lg.addColorStop(1, s.c + "a0");
        cx.fillStyle = lg; rr(x, y, w, h, r); cx.fill();
        cx.strokeStyle = "rgba(255,255,255,.75)"; cx.lineWidth = 1.2; cx.stroke();
        cx.fillStyle = "rgba(255,255,255,.22)"; rr(x + w * 0.06, y + h * 0.04, w * 0.88, h * 0.18, Math.min(r * 0.8, h * 0.09)); cx.fill();
      }
    };
    requestAnimationFrame(frame);
  }

  // ---------- Casa 3D ----------
  _house3dFace(rooms) { return houseView(this, rooms); }
}
