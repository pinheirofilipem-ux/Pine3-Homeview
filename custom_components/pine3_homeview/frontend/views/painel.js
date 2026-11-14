// Pine3 Homeview - the "Painel" home layout: the clock and the home status on the left; status chips,
// Favourites, scenes and rooms on the right. It is the Painel face's default layout.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { esc, dom } from "../const.js";
import { t, tp, num } from "../i18n.js";

const FAV_MAX = 6;
const FAV_DOMAINS = ["climate", "lock", "cover", "light", "switch", "fan", "media_player", "input_boolean", "humidifier"];

export class PainelMixin {

  /** Favourites: the saved list, or (until one is saved) a few devices picked from the home. */
  _favList(rooms, cfg = this._cfg()) {
    if (Array.isArray(cfg.favorites)) return cfg.favorites.filter((i) => this._s(i));
    const all = rooms.flatMap((r) => r.ents).filter((i) => this._s(i));
    const out = [];
    for (const d of FAV_DOMAINS) for (const i of all) if (dom(i) === d && out.length < FAV_MAX && !out.includes(i)) out.push(i);
    return out;
  }
  _isFav(id) { return this._favList(this._rooms()).includes(id); }
  /** The star in a device's detail sheet. */
  _toggleFav(id) {
    const list = this._favList(this._rooms());
    this._saveSettings({ favorites: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
    this._render();
  }

}
