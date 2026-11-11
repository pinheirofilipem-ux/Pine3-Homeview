// Pine3 Homeview - faces: full-screen views of the home that you swipe between, each with one job.
// The start face is where the panel opens and where it comes back to; after some time without
// touches the panel shows the ambient face (dimmed, no dock) until someone touches the screen.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { WEATHER_ICON, DEFAULTS, dom, esc } from "../const.js";
import { t, tp, num } from "../i18n.js";

/** Every face, in the default order. `soon`: planned, not built yet. `ambient`: can be the idle face. */
export const FACES = {
  painel: { icon: "mdi:view-dashboard-outline", label: "Painel", sub: "Relógio, estado da casa, cenas e divisões." },
  mosaico: { icon: "mdi:view-grid-plus-outline", label: "Mosaico", sub: "Grelha de tiles grandes, para ler de longe.", soon: true },
  mosaico_plus: { icon: "mdi:view-quilt-outline", label: "Mosaico+", sub: "Meteo, agenda, o que está a tocar e cenas.", soon: true },
  relogio: { icon: "mdi:clock-outline", label: "Relógio", sub: "Hora grande, data, tempo e luzes acesas.", ambient: true },
  fluxo: { icon: "mdi:blur", label: "Fluxo", sub: "Formas de vidro em movimento lento, com a hora.", soon: true, ambient: true },
};
export const FACE_IDS = Object.keys(FACES);
const ready = (id) => FACES[id] && !FACES[id].soon;

// where a swipe must not start: things that scroll sideways or take a drag of their own
const NO_SWIPE = ".scenes,.fhs,.chips3,.hslider,.vslider,.stage,input,textarea,select,[data-noswipe]";
const SWIPE_MIN = 70; // px

export class FacesMixin {

  /** The faces to swipe through, in order (the start face is always one of them). */
  _faces(cfg = this._cfg()) {
    const list = (cfg.faces || DEFAULTS.faces).filter(ready);
    const start = this._startFace(cfg);
    return list.includes(start) ? list : [start, ...list];
  }
  _startFace(cfg = this._cfg()) { return ready(cfg.start_face) ? cfg.start_face : "painel"; }
  _ambientFace(cfg = this._cfg()) { const a = cfg.ambient_face; return ready(a) && FACES[a].ambient ? a : "relogio"; }

  /** The face showing now. */
  _faceId(cfg = this._cfg()) {
    if (this._ambient) return this._ambientFace(cfg);
    const list = this._faces(cfg);
    return list.includes(this._face) ? this._face : this._startFace(cfg);
  }

  _setFace(id, dir = 0) {
    if (id === this._faceId()) return;
    this._faceDir = dir || (this._faces().indexOf(id) > this._faces().indexOf(this._faceId()) ? 1 : -1);
    this._face = id;
    this._render();
  }
  _stepFace(delta) {
    const list = this._faces(), k = list.indexOf(this._faceId());
    const next = list[k + delta];
    if (next) this._setFace(next, delta);
  }

  /** Idle: show the ambient face full screen. */
  _goAmbient() {
    this._ambient = true;
    this._modal = null;
    this._view = "home";
    this._render();
  }
  /** A touch on the ambient face: back to the start face. */
  _wakeUp() {
    this._ambient = false;
    this._face = null;
    this._faceDir = 0;
    this._lastActivity = Date.now();
    this._render();
  }

  /** The home screen: the current face, plus the dots that show where you are. */
  _faceView(rooms) {
    const cfg = this._cfg(), id = this._faceId(cfg), list = this._faces(cfg);
    let body;
    if (id === "relogio") body = this._clockFace(rooms, this._ambient);
    else body = this._homeView(rooms);
    const dots = !this._ambient && !this._edit && list.length > 1
      ? `<div class="fdots" role="tablist" aria-label="${t("Faces")}">${list.map((f) =>
        `<button role="tab" data-face="${f}" class="${f === id ? "on" : ""}" aria-selected="${f === id}" aria-label="${esc(t(FACES[f].label))}"></button>`).join("")}</div>`
      : "";
    return body + dots;
  }

  /** The clock face: the time, the date, the weather and how many lights are on. Dimmed when ambient. */
  _clockFace(rooms, ambient) {
    const w = this._wx();
    const lit = rooms.flatMap((r) => r.ents).filter((i) => dom(i) === "light" && this._isOn(i)).length;
    const inner = `<div class="sv-in">
      <div class="clock sv-clock">${this._clockText()}</div>
      <div class="sv-date">${esc(this._dateText())}</div>
      <div class="sv-meta">${w ? `<span><ha-icon icon="${WEATHER_ICON[w.cond] || "mdi:weather-partly-cloudy"}"></ha-icon>${num(Math.round(w.temp))}° ${esc(this._wxLabel(w.cond))}</span>` : ""}
        <span><ha-icon icon="mdi:lightbulb-outline"></ha-icon>${lit ? tp(lit, "{n} luz acesa", "{n} luzes acesas") : t("Luzes apagadas")}</span></div>
    </div>`;
    return ambient
      ? `<div class="saver ${this._ovEnter("_ambient")}" data-wake>${inner}</div>`
      : `<div class="faceclock">${inner}</div>`;
  }

  /** Dots, the ambient face and (once) swiping and the arrow keys. */
  _bindFaces(root) {
    root.querySelectorAll("[data-face]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); this._setFace(b.dataset.face); }));
    root.querySelector("[data-wake]")?.addEventListener("click", () => this._wakeUp());
    if (this._facesBound) return;
    this._facesBound = true;
    const app = this._app;
    let st = null;
    const can = () => this._view === "home" && !this._edit && !this._modal && !this._ambient && this._faces().length > 1;
    app.addEventListener("pointerdown", (e) => {
      st = null;
      if (!can() || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (e.composedPath().some((n) => n.matches?.(NO_SWIPE))) return;
      st = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    app.addEventListener("pointerup", (e) => {
      if (!st) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y, dt = Date.now() - st.t;
      st = null;
      if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.6 && dt < 800) {
        this._swipedAt = Date.now();
        this._stepFace(dx < 0 ? 1 : -1);
      }
    });
    app.addEventListener("pointercancel", () => { st = null; });
    // the finger that swiped lifts over a card: that is not a tap
    app.addEventListener("click", (e) => { if (Date.now() - (this._swipedAt || 0) < 400) { e.stopPropagation(); e.preventDefault(); } }, true);
    window.addEventListener("keydown", (e) => {
      if (!this.isConnected || !can() || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.composedPath().some((n) => n.matches?.("input,textarea,select"))) return;
      if (e.key === "ArrowRight") this._stepFace(1);
      else if (e.key === "ArrowLeft") this._stepFace(-1);
    });
  }

  /** Settings: which faces, their order, the start face and the ambient face. */
  _facesSettings(d) {
    const on = d.faces || DEFAULTS.faces;
    const order = [...on.filter((f) => FACES[f]), ...FACE_IDS.filter((f) => !on.includes(f))];
    this._faceOrder = order;
    const start = ready(d.start_face) ? d.start_face : "painel";
    const enabled = order.filter((f) => on.includes(f) && ready(f));
    const ambients = FACE_IDS.filter((f) => ready(f) && FACES[f].ambient);
    return `<div class="panel glass"><h3 style="margin-top:0">${t("Faces")}</h3><p>${t("Ecrãs inteiros entre os quais deslizas no início. Cada um tem uma função.")}</p>
      <div class="list big">${order.map((f, k) => {
        const F = FACES[f], vis = on.includes(f) && ready(f), lock = f === start;
        return `<div class="it ${F.soon ? "soon" : ""}">
          <div class="ri sm"><ha-icon icon="${F.icon}"></ha-icon></div>
          <span>${esc(t(F.label))}${F.soon ? ` <em class="soonb">${t("Em breve")}</em>` : ""} <small>${esc(t(F.sub))}</small></span>
          <button class="mini" data-facemv="${f}:-1" ${k === 0 ? "disabled" : ""}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
          <button class="mini" data-facemv="${f}:1" ${k === order.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
          <div class="tg ${vis ? "on" : ""} ${F.soon || lock ? "dis" : ""}" ${F.soon || lock ? "" : `data-facetg="${f}"`} title="${lock ? esc(t("É o face inicial")) : ""}"><i></i></div></div>`;
      }).join("")}</div>
      <div class="opts">
        ${this._choice("start_face", start, enabled.map((f) => [f, esc(t(FACES[f].label))]), t("Face inicial"), t("Onde o painel abre e para onde volta quando acordas o ecrã."))}
        ${this._choice("ambient_face", ambients.includes(d.ambient_face) ? d.ambient_face : "relogio", ambients.map((f) => [f, esc(t(FACES[f].label))]), t("Face ambiente"), t("Aparece escurecido, sem a dock, depois de algum tempo sem toques."))}
      </div></div>`;
  }
  _bindFacesSettings(root, d, upd) {
    root.querySelectorAll("[data-facetg]").forEach((el) => el.addEventListener("click", () => {
      const f = el.dataset.facetg, on = d.faces || [...DEFAULTS.faces];
      const next = on.includes(f) ? on.filter((x) => x !== f) : [...on, f];
      d.faces = this._faceOrder.filter((x) => next.includes(x));
      upd();
    }));
    root.querySelectorAll("[data-facemv]").forEach((el) => el.addEventListener("click", () => {
      const [f, dir] = el.dataset.facemv.split(":"), order = [...this._faceOrder], k = order.indexOf(f), j = k + Number(dir);
      if (j < 0 || j >= order.length) return;
      [order[k], order[j]] = [order[j], order[k]];
      const on = d.faces || DEFAULTS.faces;
      d.faces = order.filter((x) => on.includes(x));
      upd();
    }));
  }
}
