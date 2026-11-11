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
  _mosaicAuto(rooms) {
    const all = rooms.flatMap((r) => r.ents).filter((i) => this._s(i));
    const out = [], used = new Set();
    let cells = 0;
    const add = (id, size) => {
      if (used.has(id) || cells + AREA[size] > MOSAIC_CELLS) return;
      used.add(id); out.push({ id, size }); cells += AREA[size];
    };
    const climate = all.find((i) => dom(i) === "climate");
    if (climate) add(climate, "l");
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
  _mosaicList(rooms, cfg = this._cfg()) {
    const list = Array.isArray(cfg.mosaic) ? cfg.mosaic : this._mosaicAuto(rooms);
    return list.filter((it) => it && (WIDGETS[it.id] || this._s(it.id)) && AREA[it.size]);
  }

  _mosaicFace(rooms) {
    const e = this._edit, list = this._mosaicList(rooms);
    const top = `<div class="mos-bar"><div class="eyebrow tdate">${esc(this._dateText())}</div><span class="sp"></span>
      ${e ? `<button class="pill" data-pick="mosaic"><ha-icon icon="mdi:plus"></ha-icon>${t("Adicionar")}</button>` : `${this._editBtn()}${this._gear()}`}</div>`;
    const cells = list.reduce((n, it) => n + AREA[it.size], 0);
    const hint = e ? `<div class="edhint">${t("Arrasta para mover. Toca em − para tirar e no tamanho para mudar entre S, M e L.")}
      ${cells > MOSAIC_CELLS ? ` <b>${t("Há mais tiles do que cabem num ecrã: as últimas ficam por baixo.")}</b>` : ""}</div>` : "";
    return `${top}${hint}<div class="mos" data-sortable="mosaic">${list.map((it) => this._mosCell(it, rooms)).join("")}</div>`;
  }

  _mosCell(it, rooms) {
    const chrome = this._edit ? `<button class="ed-x" data-edmos="del|${esc(it.id)}" title="${t("Tirar")}">−</button>
      <button class="ed-sz" data-edmos="size|${esc(it.id)}" title="${t("Tamanho")}">${it.size.toUpperCase()}</button>` : "";
    return `<div class="mc ${it.size}" data-key="${esc(it.id)}">${chrome}${this._mosTile(it, rooms)}</div>`;
  }

  _mosTile({ id, size }, rooms) {
    if (id === "@clock") return `<div class="mt glass mt-clock" data-analog="${size === "s" ? "" : "n"}">${analogClock(new Date(), size !== "s")}</div>`;
    if (id === "@weather") return this._mosWeather(size);
    if (id === "@time") return `<div class="mt glass mt-time ${size}"><div class="clock">${this._clockText()}</div><div class="st">${esc(this._dateText(size === "s" ? { weekday: "short", day: "numeric", month: "short" } : undefined))}</div></div>`;
    const d = dom(id), s = this._s(id), on = this._isOn(id), room = rooms.find((r) => r.ents.includes(id));
    if (d === "climate" && size !== "s") return this._mosClimate(id, size, room);
    const where = room && room.id !== "_none" ? this._roomName(room) : "";
    const sub = [where, this._stateText(id)].filter(Boolean).join(" · ");
    const power = ["light", "switch", "fan", "input_boolean"].includes(d);
    let extra = "";
    if (size !== "s" && d === "light" && on && s.attributes.brightness != null) extra = `<div class="mt-bar"><i style="width:${Math.round((s.attributes.brightness / 255) * 100)}%"></i></div>`;
    if (size !== "s" && d === "cover" && s.attributes.current_position != null) extra = `<div class="mt-bar"><i style="width:${s.attributes.current_position}%"></i></div>`;
    if (size !== "s" && d === "vacuum") {
      const level = this._vacBattery(id);
      const pct = this._vacMember(id, "sensor", "clean_percent", "cleaning_progress");
      const p = pct ? Number(this._s(pct).state) : null;
      extra = `${level != null ? `<div class="mt-meta"><ha-icon icon="mdi:battery"></ha-icon>${level}%</div>` : ""}${on && Number.isFinite(p) ? `<div class="mt-bar ok"><i style="width:${p}%"></i></div>` : ""}`;
    }
    if (size !== "s" && d === "media_player") {
      const a = s.attributes;
      if (a.media_title) extra = `<div class="mt-meta">${esc([a.media_title, a.media_artist].filter(Boolean).join(" · "))}</div>
        <div class="mt-ctl"><span data-media="media_play_pause" data-ent-id="${esc(id)}"><ha-icon icon="mdi:${s.state === "playing" ? "pause" : "play"}"></ha-icon></span></div>`;
    }
    const icon = d === "scene" ? (s.attributes.icon || "mdi:creation-outline") : this._icon(id);
    const sceneOn = d === "scene" && this._sceneOn(id);
    return `<div class="mt ${on || sceneOn ? "on" : "glass"} ${d === "scene" ? "mt-scene" : ""} ${s.state === "unavailable" ? "na" : ""}" ${d === "scene" ? `data-scene="${esc(id)}"` : `data-ent="${esc(id)}"`} style="--acc:${this._accent(id)}">
      <div class="mt-top"><div class="ic"><ha-icon icon="${icon}"></ha-icon></div>${power && size !== "s" ? `<div class="pw" data-pw="${esc(id)}"><ha-icon icon="mdi:power"></ha-icon></div>` : ""}</div>
      <div class="mt-tx"><div class="nm">${esc(this._name(id))}</div><div class="st">${esc(d === "scene" ? t("Cena") : sub)}</div>${extra}</div>
    </div>`;
  }

  /** Climate, M or L: the target in large type with up / down arrows beside it, and quick modes (L). */
  _mosClimate(id, size, room) {
    const s = this._s(id), a = s.attributes, on = this._isOn(id), na = s.state === "unavailable";
    const tgt = this._climateTarget(id);
    const range = tgt == null && a.target_temp_low != null && a.target_temp_high != null;
    const act = on && a.hvac_action && !["off", "idle"].includes(a.hvac_action) ? a.hvac_action : null;
    const big = on && tgt != null ? num(tgt) : on && range ? `${num(a.target_temp_low)}–${num(a.target_temp_high)}` : a.current_temperature != null ? num(Math.round(a.current_temperature)) : "–";
    const where = room && room.id !== "_none" ? this._roomName(room) : "";
    const sub = [where, on && a.current_temperature != null ? `${t("Atual")} ${num(a.current_temperature)}°` : "", this._st(act || s.state)].filter(Boolean).join(" · ");
    const short = { cool: t("Frio"), heat: t("Calor"), heat_cool: t("Auto"), auto: t("Auto"), dry: t("Seco"), fan_only: t("Ventilar"), off: "Off" };
    const arrows = on && tgt != null && !na ? `<div class="mt-arrows">
        <button data-ctemp="${esc(id)}" data-d="1" title="${t("Subir")}" aria-label="${t("Subir")}"><ha-icon icon="mdi:chevron-up"></ha-icon></button>
        <button data-ctemp="${esc(id)}" data-d="-1" title="${t("Baixar")}" aria-label="${t("Baixar")}"><ha-icon icon="mdi:chevron-down"></ha-icon></button></div>` : "";
    const modes = this._climateQuickModes(id);
    const seg = size === "l" && !na && modes.length > 1 ? `<div class="clx-seg">${modes.map((m) => `<button class="${m === s.state ? "act" : ""}" data-chvac="${esc(id)}" data-m="${m}">${short[m] || this._st(m)}</button>`).join("")}</div>` : "";
    return `<div class="mt mt-ac ${size} ${on ? "on" : "glass"} ${na ? "na" : ""}" data-open="${esc(id)}" style="--acc:${this._accent(id)}">
      <div class="mt-acrow"><div class="mt-acnum ${String(big).length > 3 ? "long" : ""}"><b>${big}</b><sup>°</sup></div>${arrows}</div>
      <div class="mt-tx"><div class="nm">${esc(this._name(id))}</div><div class="st">${esc(sub)}</div></div>
      ${seg}
    </div>`;
  }

  _mosWeather(size) {
    const w = this._wx(), fc = this._homeForecast();
    const today = (fc?.daily || []).find((x) => new Date(x.time).toDateString() === new Date().toDateString());
    const hrs = (fc?.hourly || []).filter((f) => f.time >= Date.now() - 30 * 60e3).slice(0, size === "l" ? 6 : 4);
    const hh = (d) => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    const deg = (v) => (v == null ? "–" : `${num(Math.round(v))}°`);
    return `<div class="mt glass mt-wx" data-wx>
      <div class="mt-wxnow"><ha-icon icon="${WEATHER_ICON[w?.cond] || "mdi:weather-partly-cloudy"}"></ha-icon><b>${w ? deg(w.temp) : "–"}</b>
        <div><div class="nm">${esc(w ? this._wxLabel(w.cond) : t("A carregar o tempo…"))}</div>${today ? `<div class="st">${t("Máx.")} ${deg(today.temp)} · ${t("Mín.")} ${deg(today.low)}</div>` : ""}</div></div>
      ${hrs.length ? `<div class="mt-hrs">${hrs.map((f) => `<div><small>${hh(f.time)}</small><b>${deg(f.temp)}</b></div>`).join("")}</div>` : ""}
    </div>`;
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
      const list = this._edit.mosaic;
      if (op === "del") this._edit.mosaic = list.filter((x) => x.id !== id);
      else this._edit.mosaic = list.map((x) => (x.id === id ? { ...x, size: NEXT_SIZE[x.size] } : x));
      this._render();
    }));
  }

  // ---------- picker: add tiles to the Mosaico or to the Favourites ----------
  _pickerSheet(kind) {
    const rooms = this._rooms();
    const chosen = new Set((kind === "mosaic" ? this._edit?.mosaic || [] : this._edit?.favorites || []).map((x) => (typeof x === "string" ? x : x.id)));
    const row = (id, icon, label, sub) => `<button class="pk ${chosen.has(id) ? "on" : ""}" data-pickent="${esc(id)}">
      <ha-icon icon="${icon}"></ha-icon><span>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><ha-icon class="pk-st" icon="mdi:${chosen.has(id) ? "check-circle" : "plus-circle-outline"}"></ha-icon></button>`;
    const groups = [];
    if (kind === "mosaic") groups.push([t("Widgets"), Object.entries(WIDGETS).map(([id, w]) => row(id, w.icon, t(w.label), ""))]);
    for (const r of rooms) {
      const ids = r.ents.filter((i) => MOSAIC_DOMAINS.has(dom(i)) && (kind === "mosaic" || dom(i) !== "scene"));
      if (ids.length) groups.push([this._roomName(r), ids.map((i) => row(i, dom(i) === "scene" ? this._s(i).attributes.icon || "mdi:creation-outline" : this._icon(i), this._name(i), this._stateText(i)))]);
    }
    return `<div class="ov ${this._ovEnter("_pick")}" data-close><div class="sheet wide pick">
      <div class="hd"><div class="ic"><ha-icon icon="mdi:plus"></ha-icon></div><div style="flex:1;min-width:0"><div class="nm">${kind === "mosaic" ? t("Adicionar ao Mosaico") : t("Adicionar aos Favoritos")}</div>
        <div class="st">${t("Toca para pôr ou tirar.")}</div></div><button class="sh-x" data-closex title="${t("Fechar")}" aria-label="${t("Fechar")}"><ha-icon icon="mdi:close"></ha-icon></button></div>
      ${groups.map(([g, rows]) => `<div class="sub">${esc(g)}</div><div class="pk-list">${rows.join("")}</div>`).join("")}
    </div></div>`;
  }
  _bindPicker(root, kind) {
    root.querySelectorAll("[data-pickent]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.pickent, e = this._edit;
      if (!e) return;
      if (kind === "mosaic") {
        e.mosaic = e.mosaic.some((x) => x.id === id) ? e.mosaic.filter((x) => x.id !== id)
          : [...e.mosaic, { id, size: WIDGETS[id]?.size || (["climate"].includes(dom(id)) ? "l" : ["vacuum", "media_player"].includes(dom(id)) ? "m" : "s") }];
      } else {
        e.favorites = e.favorites.includes(id) ? e.favorites.filter((x) => x !== id) : [...e.favorites, id];
      }
      this._render();
    }));
  }
}
