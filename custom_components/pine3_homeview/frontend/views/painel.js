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

  /** Chips with the state of the home: climate, lights, security, vacuum, what is playing. */
  _statusChips(rooms) {
    const all = rooms.flatMap((r) => r.ents).filter((i) => this._s(i));
    const chips = [];
    const chip = (cls, icon, color, title, sub, attrs) => `<button class="chip ${cls}" ${attrs}><span class="ci" style="${color}"><ha-icon icon="${icon}"></ha-icon></span><span class="cx"><b>${esc(title)}</b><span>${esc(sub)}</span></span></button>`;
    const temps = all.filter((i) => dom(i) === "sensor" && this._s(i).attributes.device_class === "temperature").map((i) => Number(this._s(i).state)).filter(Number.isFinite);
    const climates = all.filter((i) => dom(i) === "climate");
    if (temps.length || climates.length) {
      const vals = temps.length ? temps : climates.map((i) => this._s(i).attributes.current_temperature).filter((v) => v != null);
      const lo = Math.round(Math.min(...vals)), hi = Math.round(Math.max(...vals));
      const onC = climates.filter((i) => this._isOn(i)).length;
      const go = climates.length > 1 ? `data-nav="climate"` : climates.length ? `data-open="${esc(climates[0])}"` : `data-nav="climate"`;
      chips.push(chip(onC ? "on" : "", "mdi:thermometer", "background:#34c759;color:#0d2a14", t("Clima"),
        vals.length ? (lo === hi ? `${num(lo)}°` : `${num(lo)}–${num(hi)}°`) + (onC ? ` · ${tp(onC, "{n} ligado", "{n} ligados")}` : "") : tp(onC, "{n} ligado", "{n} ligados"), go));
    }
    const lights = all.filter((i) => dom(i) === "light"), lit = lights.filter((i) => this._isOn(i)).length;
    if (lights.length) chips.push(chip(lit ? "on" : "", "mdi:lightbulb-outline", "background:var(--amber);color:var(--ink)", t("Luzes"),
      lit ? tp(lit, "{n} acesa", "{n} acesas") : t("Apagadas"), `data-nav="rooms"`));
    const sec = all.filter((i) => dom(i) === "lock" || (dom(i) === "binary_sensor" && ["door", "window", "garage_door", "opening"].includes(this._s(i).attributes.device_class)));
    if (sec.length) {
      const bad = sec.filter((i) => (dom(i) === "lock" ? this._s(i).state === "unlocked" : this._s(i).state === "on")).length;
      chips.push(chip(bad ? "warn" : "", `mdi:shield-${bad ? "alert-outline" : "check-outline"}`, bad ? "background:#ff9f0a;color:#2a1500" : "background:#5a8dee;color:#0b1a3a",
        t("Segurança"), bad ? tp(bad, "{n} aberto", "{n} abertos") : t("Tudo seguro"), `data-nav="security"`));
    }
    for (const v of all.filter((i) => dom(i) === "vacuum")) {
      const level = this._vacBattery(v);
      chips.push(chip(this._isOn(v) ? "on" : "", "mdi:robot-vacuum", "background:#30d158;color:#06210f", t("Aspirador"),
        [this._fmtState(this._vacMember(v, "sensor", "status") || v), level != null ? `${level}%` : ""].filter(Boolean).join(" · "), `data-open="${esc(v)}"`));
    }
    const media = all.find((i) => dom(i) === "media_player" && this._s(i).state === "playing");
    if (media) chips.push(chip("on", "mdi:music-note", "background:#bf5af2;color:#1d0729", t("A tocar"), this._s(media).attributes.media_title || this._name(media), `data-open="${esc(media)}"`));
    return chips.length ? `<div class="pchips">${chips.join("")}</div>` : "";
  }

  _favTiles(rooms) {
    const e = this._edit;
    const list = e ? e.favorites.filter((i) => this._s(i)) : this._favList(rooms).slice(0, FAV_MAX * 2);
    if (!list.length && !e) return "";
    const tile = (id) => {
      const on = this._isOn(id), room = rooms.find((r) => r.ents.includes(id));
      const sub = [room && room.id !== "_none" ? this._roomName(room) : "", this._stateText(id)].filter(Boolean).join(" · ");
      return `<div class="ft ${on ? "on" : "glass"}" data-ent="${esc(id)}" data-key="${esc(id)}" style="--acc:${this._accent(id)}">
        ${e ? `<button class="ed-x" data-edfav="${esc(id)}" title="${t("Tirar")}">−</button>` : ""}
        <div class="ic"><ha-icon icon="${this._icon(id)}"></ha-icon></div><div class="fx"><div class="nm">${esc(this._name(id))}</div><div class="st">${esc(sub)}</div></div></div>`;
    };
    return `<div class="pfav"><div class="eyebrow">${t("Favoritos")}${e ? ` <button class="pill sm" data-pick="fav"><ha-icon icon="mdi:plus"></ha-icon>${t("Adicionar")}</button>` : ""}</div>
      <div class="pfgrid" data-sortable="favorites">${list.map(tile).join("")}</div></div>`;
  }

  /** The Painel layout of the home screen. */
  _painelLayout(rooms, { status, lightsOn, others, lightBtns, scenesHtml, showStatus, grid }) {
    const cfg = this._cfg();
    return `<div class="hpan ${this._edit ? "editing" : ""}">
      <aside class="pleft">
        <div class="eyebrow tdate">${esc(this._dateText())}</div><div class="clock">${this._clockText()}</div>${this._hint()}
        ${showStatus ? `<div class="pstat"><div class="status">${lightsOn.length ? tp(lightsOn.length, "{n} luz acesa", "{n} luzes acesas") : status}</div>
          ${others.length ? `<div class="sdet">${esc(this._othersLine(others))}</div>` : ""}${lightBtns}</div>` : ""}
        <span class="sp"></span>
        ${cfg.show_weather ? this._wxCard("tall side") : ""}
      </aside>
      <div class="pmain">
        <div class="pbar">${cfg.show_summary && !this._edit ? this._statusChips(rooms) : ""}<span class="sp"></span>${this._peopleHtml}${this._editBtn()}${this._gear()}</div>
        ${this._favTiles(rooms)}
        ${this._edit ? "" : scenesHtml}
        <div class="eyebrow psec">${t("Divisões")}</div>
        ${grid}
      </div>
    </div>`;
  }
}
