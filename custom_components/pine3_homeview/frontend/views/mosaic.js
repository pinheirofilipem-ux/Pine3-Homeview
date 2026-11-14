// Pine3 Homeview - the Mosaico face: a 4 × 3 grid of large tiles, readable from across the room.
// Tiles come in three sizes: S (1 × 1), M (2 × 1) and L (2 × 2). Without a saved list the grid fills
// itself from the home; in edit mode tiles can be moved, resized, removed and added.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { WEATHER_ICON, esc, dom } from "../const.js";
import { t, num, locale } from "../i18n.js";

export const MOSAIC_CELLS = 12; // 4 columns × 3 rows
const AREA = { s: 1, m: 2, l: 4 };
const NEXT_SIZE = { s: "m", m: "l", l: "s" };
/** Widgets that are not entities. */
export const WIDGETS = {
  "@time": { icon: "mdi:clock-digital", label: "Relógio digital", size: "s" },
  "@clock": { icon: "mdi:clock-outline", label: "Relógio analógico", size: "s" },
  "@weather": { icon: "mdi:weather-partly-cloudy", label: "Meteorologia", size: "m" },
  "@agenda": { icon: "mdi:calendar-today", label: "Agenda", size: "m" },
  "@media": { icon: "mdi:music-note", label: "A tocar", size: "l" },
};
// what a tile can show (sensors and buttons stay in their rooms)
const MOSAIC_DOMAINS = new Set(["light", "switch", "fan", "input_boolean", "cover", "lock", "climate", "media_player", "vacuum", "scene", "script", "humidifier", "valve", "water_heater"]);

/** The hands of an analog clock, drawn in a 100 × 100 box. */
export function analogClock(d = new Date(), numbers = false) {
  let face = "";
  for (let k = 0; k < 12; k++) {
    const a = (k * 30 * Math.PI) / 180, sin = Math.sin(a), cos = Math.cos(a);
    face += numbers
      ? `<text x="${(50 + 37 * sin).toFixed(1)}" y="${(50 - 37 * cos + 3.6).toFixed(1)}" text-anchor="middle">${k || 12}</text>`
      : `<line x1="${(50 + 46 * sin).toFixed(1)}" y1="${(50 - 46 * cos).toFixed(1)}" x2="${(50 + 39 * sin).toFixed(1)}" y2="${(50 - 39 * cos).toFixed(1)}"/>`;
  }
  const m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
  const hand = (deg, len, cls) => { const a = (deg * Math.PI) / 180; return `<line class="${cls}" x1="50" y1="50" x2="${(50 + len * Math.sin(a)).toFixed(1)}" y2="${(50 - len * Math.cos(a)).toFixed(1)}"/>`; };
  return `<svg class="analog" viewBox="0 0 100 100" aria-hidden="true"><circle class="dial" cx="50" cy="50" r="49"/><g class="ticks">${face}</g>${hand(h * 30, 24, "hh")}${hand(m * 6, 36, "mh")}<circle class="pin" cx="50" cy="50" r="2.2"/></svg>`;
}

export class MosaicMixin {

  /** Tiles that fill the grid when nothing was saved: the climate, a clock, the vacuum, then devices. */
  _mosaicAuto(rooms, key = "mosaic") {
    const all = rooms.flatMap((r) => r.ents).filter((i) => this._s(i));
    const out = [], used = new Set();
    let cells = 0;
    const add = (id, size) => {
      if (used.has(id) || cells + AREA[size] > MOSAIC_CELLS) return;
      used.add(id); out.push({ id, size }); cells += AREA[size];
    };
    if (key === "mosaic_plus") {
      // Mosaico+: weather and today's agenda on top, what's playing, then scenes and favourites
      add("@weather", "m"); add("@agenda", "m"); add("@media", "l");
      const scenes = all.filter((i) => dom(i) === "scene").slice(0, 2);
      scenes.forEach((i) => add(i, "s"));
      for (const i of this._favList(rooms)) if (cells < MOSAIC_CELLS && dom(i) !== "climate") add(i, "s");
      return out;
    }
    const climate = all.find((i) => dom(i) === "climate");
    if (climate) add(climate, "l");
    add("@clock", "s");
    add("@time", "s");
    add("@weather", "m");
    const vac = all.find((i) => dom(i) === "vacuum");
    if (vac) add(vac, "m");
    for (const d of ["light", "lock", "cover", "switch", "fan"]) for (const i of all) if (dom(i) === d) add(i, "s");
    let scenes = 0;
    for (const i of all) if (dom(i) === "scene" && scenes < 2) { add(i, "s"); scenes++; }
    return out;
  }

  /** The saved tiles (or the automatic ones), without entities that no longer exist. */
  _mosaicList(rooms, cfg = this._cfg(), key = "mosaic") {
    const list = Array.isArray(cfg[key]) ? cfg[key] : this._mosaicAuto(rooms, key);
    return list.filter((it) => it && (WIDGETS[it.id] || this._s(it.id)) && AREA[it.size]);
  }

  /** Redraw the analog clocks (called with the digital clocks, every 15 s). */
  _updateAnalog() {
    this.shadowRoot.querySelectorAll("[data-analog]").forEach((el) => { el.innerHTML = analogClock(new Date(), el.dataset.analog === "n"); });
  }

  /** Edit mode: remove a tile or change its size. */
  _bindMosaicEdit(root) {
    root.querySelectorAll("[data-edmos]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const [op, id] = [b.dataset.edmos.slice(0, b.dataset.edmos.indexOf("|")), b.dataset.edmos.slice(b.dataset.edmos.indexOf("|") + 1)];
      const key = this._mosKey || "mosaic", list = this._edit[key];
      if (op === "del") this._edit[key] = list.filter((x) => x.id !== id);
      else this._edit[key] = list.map((x) => (x.id === id ? { ...x, size: NEXT_SIZE[x.size] } : x));
      this._render();
    }));
  }

  // ---------- picker: add tiles to the Mosaico or to the Favourites ----------
  _pickerSheet(kind) {
    const rooms = this._rooms();
    const mos = kind.startsWith("mosaic");
    const chosen = new Set((mos ? this._edit?.[kind] || [] : this._edit?.favorites || []).map((x) => (typeof x === "string" ? x : x.id)));
    const row = (id, icon, label, sub) => `<button class="pk ${chosen.has(id) ? "on" : ""}" data-pickent="${esc(id)}">
      <ha-icon icon="${icon}"></ha-icon><span>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><ha-icon class="pk-st" icon="mdi:${chosen.has(id) ? "check-circle" : "plus-circle-outline"}"></ha-icon></button>`;
    const groups = [];
    if (mos) groups.push([t("Widgets"), Object.entries(WIDGETS).map(([id, w]) => row(id, w.icon, t(w.label), ""))]);
    for (const r of rooms) {
      const ids = r.ents.filter((i) => MOSAIC_DOMAINS.has(dom(i)) && (mos || dom(i) !== "scene"));
      if (ids.length) groups.push([this._roomName(r), ids.map((i) => row(i, dom(i) === "scene" ? this._s(i).attributes.icon || "mdi:creation-outline" : this._icon(i), this._name(i), this._stateText(i)))]);
    }
    return `<div class="ov ${this._ovEnter("_pick")}" data-close><div class="sheet wide pick">
      <div class="hd"><div class="ic"><ha-icon icon="mdi:plus"></ha-icon></div><div style="flex:1;min-width:0"><div class="nm">${kind === "mosaic" ? t("Adicionar ao Mosaico") : kind === "mosaic_plus" ? t("Adicionar ao Mosaico+") : t("Adicionar aos Favoritos")}</div>
        <div class="st">${t("Toca para pôr ou tirar.")}</div></div><button class="sh-x" data-closex title="${t("Fechar")}" aria-label="${t("Fechar")}"><ha-icon icon="mdi:close"></ha-icon></button></div>
      ${groups.map(([g, rows]) => `<div class="sub">${esc(g)}</div><div class="pk-list">${rows.join("")}</div>`).join("")}
    </div></div>`;
  }
  _bindPicker(root, kind) {
    root.querySelectorAll("[data-pickent]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.pickent, e = this._edit;
      if (!e) return;
      if (kind.startsWith("mosaic")) {
        e[kind] = e[kind].some((x) => x.id === id) ? e[kind].filter((x) => x.id !== id)
          : [...e[kind], { id, size: WIDGETS[id]?.size || (["climate"].includes(dom(id)) ? "l" : ["vacuum", "media_player"].includes(dom(id)) ? "m" : "s") }];
      } else {
        e.favorites = e.favorites.includes(id) ? e.favorites.filter((x) => x !== id) : [...e.favorites, id];
      }
      this._render();
    }));
  }
}
