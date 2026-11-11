// Pine3 Homeview - the Pine3 Wallpanel app (github.com/pinheirofilipem-ux/wallpanel-android).
// When the panel runs inside it (user agent "Pine3Wallpanel/<n>" and window.Pine3Wallpanel), movement
// in front of the tablet's camera counts as a touch and brings the panel out of the ambient face, the
// screen waking up shows the start face, and the ambient face lowers the screen brightness.
// In any other browser nothing here runs.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { store } from "../const.js";
import { t } from "../i18n.js";

const NIGHT = 0.12, DAY = 0.5; // ambient brightness

export class WallpanelMixin {

  /** The app's bridge, or null when the panel isn't running inside Pine3 Wallpanel. */
  _wallpanel() {
    const b = window.Pine3Wallpanel;
    return /Pine3Wallpanel\/\d+/.test(navigator.userAgent) && b && typeof b.version === "function" ? b : null;
  }
  _wallpanelVersion() { try { return this._wallpanel()?.version() ?? null; } catch { return null; } }

  /** Listen to the app's events (connectedCallback); removed in disconnectedCallback. */
  _bindWallpanel() {
    if (!this._wallpanel() || this._onWp) return;
    this._onWp = (e) => {
      const type = e.detail?.type;
      if (type === "motion") {
        // someone in front of the tablet: like a touch
        this._lastActivity = Date.now();
        if (this._ambient) this._wakeUp();
      } else if (type === "sleep") {
        // the screen went off: be ready on the start face when it comes back
        this._modal = null; this._ambient = false; this._face = null; this._edit = null;
        if (this._view !== "settings") this._view = "home";
        this._render();
      } else if (type === "wake") {
        this._lastActivity = Date.now();
        if (this._ambient) this._wakeUp();
      }
    };
    window.addEventListener("pine3wallpanel", this._onWp);
  }
  _unbindWallpanel() {
    if (this._onWp) window.removeEventListener("pine3wallpanel", this._onWp);
    this._onWp = null;
  }

  /** Screen brightness: lower on the ambient face (by day / by night), the system's otherwise. Called on every render. */
  _applyBrightness() {
    const b = this._wallpanel();
    if (!b) return;
    const mode = store.get("amb_bright", "auto");
    let want = -1;
    if (this._ambient && mode !== "off") {
      const sun = this._s("sun.sun")?.state, h = new Date().getHours();
      const night = sun ? sun === "below_horizon" : h < 7 || h >= 21;
      want = mode === "low" || night ? NIGHT : DAY;
    }
    if (want === this._wpBright) return;
    this._wpBright = want;
    try { b.setBrightness(want); } catch (e) { console.warn("Pine3 Homeview: Pine3 Wallpanel", e); }
  }

  /** Settings → This device: whether the app was found, and the ambient brightness. */
  _wallpanelSettings() {
    const v = this._wallpanelVersion();
    if (v == null) return `<div class="opt"><div><b>Pine3 Wallpanel</b><small>${t("Não detetado. Na app Pine3 Wallpanel, o movimento em frente ao tablet tira o painel do face ambiente e o brilho baixa no ambiente.")}</small></div></div>`;
    const m = store.get("amb_bright", "auto");
    return `<div class="opt"><div><b>Pine3 Wallpanel</b><small>${t("Detetado (ponte {v}). O movimento em frente ao tablet conta como um toque e tira o painel do face ambiente.", { v })}</small></div></div>
      ${this._localChoice("amb_bright", m, [["auto", t("Automático")], ["low", t("Sempre baixo")], ["off", t("Não mexer")]],
        t("Brilho no face ambiente"), t("Automático: 50% de dia e 12% de noite (pelo sol). Sempre baixo: 12%. Fora do face ambiente, o brilho é o do sistema."))}`;
  }
}
