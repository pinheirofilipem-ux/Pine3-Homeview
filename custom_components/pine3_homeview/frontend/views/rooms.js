// Pine3 Homeview - Rooms, room, climate, security and scenes screens.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { SECTIONS, SECTION_ICON, esc, dom } from "../const.js";
import { t, tp, num } from "../i18n.js";

export class RoomsViewMixin {

  _roomsView(rooms) {
    return `<div class="hero"><div><div class="eyebrow">${tp(rooms.length, "{n} divisão", "{n} divisões")}</div><div class="t" style="margin-top:8px">${t("Divisões")}</div>${this._hint()}</div>
      <div class="right">${this._editBtn()}${this._gear()}</div></div>
      <div class="grid" data-sortable="rooms">${rooms.map((r) => this._roomCard(r)).join("")}${this._restoreCard(this._hiddenRooms.length)}</div>`;
  }

  /** Climate screen: every air conditioner / thermostat with quick controls, then the temperature of each room. */
  _climateView(rooms) {
    const cl = rooms.flatMap((r) => r.ents.filter((i) => dom(i) === "climate" && this._s(i)).map((i) => [i, r]));
    const on = cl.filter(([i]) => this._isOn(i)).length;
    const readings = rooms.map((r) => [r, this._roomClimate(r)]).filter(([, c]) => c.temp || c.hum);
    return `<div class="hero"><div><div class="eyebrow">${cl.length ? t("{a} de {b} ligados", { a: on, b: cl.length }) : t("Clima")}</div><div class="t" style="margin-top:8px">${t("Clima")}</div></div><div class="right">${this._gear()}</div></div>
      ${cl.length ? `<div class="tiles clim">${cl.map(([i, r]) => this._climateCard(i, r)).join("")}</div>` : ""}
      ${readings.length ? `<div class="sect"><div class="eyebrow">${t("Temperatura por divisão")}</div>
        <div class="tiles rtemp">${readings.map(([r, c]) => `<div class="tile glass rt" data-room="${esc(r.id)}"><div class="nm">${esc(r.name)}</div>
          <div class="rtv"><b>${esc((c.temp || "–").replace("°C", "°"))}</b>${c.hum ? `<span><ha-icon icon="mdi:water-percent"></ha-icon>${esc(c.hum)}</span>` : ""}</div></div>`).join("")}</div></div>` : ""}
      ${cl.length || readings.length ? "" : `<div class="empty">${t("Nada para monitorizar.")}</div>`}`;
  }
  /** Target temperature shown on the climate card: the value just asked for until the device reports it. */
  _climateTarget(id) {
    const a = this._s(id).attributes, w = this._ctWant?.[id];
    if (w && Date.now() - w.t < 15000 && a.temperature !== w.v) return w.v;
    return a.temperature;
  }
  /**
   * Climate card with direct control (climate screen and room view): a ring with the target, the current
   * temperature, a few modes (cool / heat / off) and − / +. A tap elsewhere opens the full card.
   */
  _climateCard(id, r) {
    const s = this._s(id), a = s.attributes, on = this._isOn(id);
    const act = on && a.hvac_action && !["off", "idle"].includes(a.hvac_action) ? a.hvac_action : null;
    const tgt = this._climateTarget(id), range = tgt == null && a.target_temp_low != null && a.target_temp_high != null;
    const all = a.hvac_modes || [], short = { cool: t("Frio"), heat: t("Calor"), heat_cool: t("Auto"), auto: t("Auto"), dry: t("Seco"), fan_only: t("Ventilar"), off: t("Desligar") };
    let modes = ["cool", "heat"].filter((m) => all.includes(m));
    if (modes.length < 2) modes = [...modes, ...all.filter((m) => m !== "off" && !modes.includes(m))].slice(0, 2);
    if (all.includes("off")) modes.push("off");
    if (s.state !== "off" && all.includes(s.state) && !modes.includes(s.state)) modes.splice(modes.length - (all.includes("off") ? 1 : 0), 0, s.state);
    const mode = { heating: "heat", preheating: "heat", cooling: "cool", drying: "dry", fan: "fan_only" }[act] || s.state;
    const col = !on ? "var(--clx-off)" : { cool: "#4aa8ff", dry: "#64d2ff", fan_only: "#a8b0bd", heat: "#ff9f43", heat_cool: "#4ade80", auto: "#4ade80" }[mode] || "#ff9f43";
    const lo = a.min_temp ?? 7, hi = a.max_temp ?? 35, val = range ? a.target_temp_high : tgt ?? a.current_temperature;
    const frac = on && val != null ? Math.max(0.04, Math.min(1, (val - lo) / (hi - lo || 1))) : 0;
    const C = 2 * Math.PI * 44, arc = C * 0.75;
    const big = on && tgt != null ? num(tgt) : range && on ? `${num(a.target_temp_low)}–${num(a.target_temp_high)}` : a.current_temperature != null ? num(Math.round(a.current_temperature)) : "–";
    const cur = a.current_temperature != null ? `${num(a.current_temperature)}°` : "";
    const sub = [r && this._view !== "room" ? r.name : "", on && tgt != null ? cur : "", this._st(act || s.state)].filter(Boolean).join(" · ");
    const na = s.state === "unavailable";
    return `<div class="tile clx big ${on ? "on" : "glass"} ${na ? "na" : ""}" data-open="${esc(id)}" data-key="${esc(id)}">
      ${this._meta?.[id] ? this._editChrome("dev", id) : ""}
      <div class="clx-ring"><svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="44" stroke-dasharray="${arc.toFixed(1)} ${C.toFixed(1)}"/>
        <circle cx="50" cy="50" r="44" style="stroke:${col}" stroke-dasharray="${(arc * frac).toFixed(1)} ${C.toFixed(1)}"/></svg>
        <div class="clx-t ${range && on ? "rng" : String(big).length > 3 ? "long" : ""}"><b>${big}</b><sup>°</sup>${!on && cur ? `<small>${t("Atual")}</small>` : ""}</div></div>
      <div class="clx-r"><div class="nm">${esc(this._name(id))}</div><div class="st">${esc(sub)}</div>
        ${!na && modes.length > 1 ? `<div class="clx-seg">${modes.map((m) => `<button class="${m === s.state ? "act" : ""}" data-chvac="${esc(id)}" data-m="${m}">${short[m] || this._st(m)}</button>`).join("")}</div>` : ""}
        ${on && tgt != null ? `<div class="clx-pm"><button data-ctemp="${esc(id)}" data-d="-1" title="${t("Baixar")}">−</button><button data-ctemp="${esc(id)}" data-d="1" title="${t("Subir")}">+</button></div>` : ""}
      </div>
    </div>`;
  }

  _securityView(rooms) {
    const all = rooms.flatMap((r) => r.ents);
    const ids = all.filter((i) => dom(i) === "lock" || dom(i) === "camera" || (dom(i) === "binary_sensor" && ["door", "window", "garage_door", "opening", "motion", "smoke", "moisture", "gas"].includes(this._s(i).attributes.device_class)));
    const watch = ids.filter((i) => ["lock", "binary_sensor"].includes(dom(i)) && this._s(i).state !== "unavailable");
    const isBad = (i) => (dom(i) === "lock" ? this._s(i).state !== "locked" : this._s(i).state === "on");
    const bad = watch.filter(isBad).length;
    const chip = watch.length ? `<div class="secst ${bad ? "bad" : "ok"}"><ha-icon icon="mdi:shield-${bad ? "alert-outline" : "check-outline"}"></ha-icon>${bad ? tp(bad, "{n} item aberto", "{n} itens abertos") : t("Tudo seguro")}</div>` : "";
    const tile = (i) => (watch.includes(i) && !isBad(i) ? this._tile(i).replace('class="tile ', 'class="tile secok ') : this._tile(i));
    return `<div class="hero"><div><div class="eyebrow">${t("Segurança")}</div><div class="t" style="margin-top:8px">${t("Portas, janelas e fechaduras")}</div></div><div class="right">${chip}${this._gear()}</div></div>
      ${ids.length ? `<div class="tiles">${ids.map(tile).join("")}</div>` : `<div class="empty">${t("Nada para monitorizar.")}</div>`}`;
  }

  _roomView(room) {
    const c = this._roomClimate(room);
    const devs = room.ents.filter((i) => dom(i) !== "scene");
    // categories: one grid ordered by kind (lights first, sensors last) and filter chips on top, like a home app
    const cat = (i) => SECTIONS.findIndex(([, domains]) => domains.includes(dom(i)));
    const cats = SECTIONS.map(([title], k) => [k, title, devs.filter((i) => cat(i) === k)]).filter(([, , l]) => l.length);
    if (this._roomCatFor !== room.id) { this._roomCat = null; this._roomCatFor = room.id; }
    const sel = this._edit ? null : this._roomCat;
    const shown = devs.map((i, n) => [i, n]).sort((x, y) => ((cat(x[0]) + 99) % 99) - ((cat(y[0]) + 99) % 99) || x[1] - y[1]).map(([i]) => i)
      .filter((i) => sel == null || cat(i) === sel);
    const lights = devs.filter((i) => dom(i) === "light"), lit = lights.filter((i) => this._isOn(i));
    const others = this._activeOthers(devs);
    const status = lit.length ? tp(lit.length, "{n} luz acesa", "{n} luzes acesas") : others.length ? tp(others.length, "{n} dispositivo ligado", "{n} dispositivos ligados") : t("Tudo desligado");
    const sub = [c.temp, c.hum].filter(Boolean).join(" · ");
    const hiddenHere = this._edit && this._model ? this._model.rooms.find((r) => r.id === room.id)?.devices.filter((d) => this._edit.hidden.includes(d.id)).length : 0;
    const scenes = room.ents.filter((i) => dom(i) === "scene");
    const chips = (cats.length > 1 && !this._edit ? `<button class="pill rcat ${sel == null ? "solid" : ""}" data-rcat="">${t("Tudo")} <small>${devs.length}</small></button>${cats.map(([k, title, l]) => `<button class="pill rcat ${sel === k ? "solid" : ""}" data-rcat="${k}"><ha-icon icon="${SECTION_ICON[title] || "mdi:shape-outline"}"></ha-icon>${t(title)} <small>${l.length}</small></button>`).join("")}` : "")
      + (scenes.length && !this._edit ? `${cats.length > 1 ? `<span class="rsep"></span>` : ""}${scenes.map((i) => `<div class="scene glass ${this._fired === i ? "fired" : ""} ${this._sceneOn(i) ? "on" : ""}" data-scene="${i}" title="${this._sceneOn(i) ? t("Toca para desligar") : ""}"><ha-icon icon="${this._s(i).attributes.icon || "mdi:creation-outline"}"></ha-icon>${esc(this._name(i))}</div>`).join("")}` : "");
    return `<div class="rhead">
        <div class="rtitle"><div class="eyebrow">${tp(room.count, "{n} dispositivo", "{n} dispositivos")}${sub ? ` · ${esc(sub)}` : ""}</div><div class="t">${esc(this._roomName(room))}</div>${this._hint()}</div>
        ${this._edit ? "" : `<div class="rstat"><div class="status">${status}</div>${others.length && lit.length ? `<div class="sdet">${esc(this._othersLine(others))}</div>` : ""}</div>`}
        <div class="right">${lights.length && !this._edit ? `<button class="pill" data-rlights="on"><ha-icon icon="mdi:lightbulb-outline"></ha-icon>${t("Acender")}</button><button class="pill solid" data-rlights="off"><ha-icon icon="mdi:power"></ha-icon>${t("Apagar")}</button>` : ""}${this._editBtn()}${this._gear()}</div>
      </div>
      ${chips ? `<div class="rchips">${chips}</div>` : ""}
      <div class="tiles rgrid" data-sortable="dev:${esc(room.id)}">${shown.map((i) => (dom(i) === "climate" && this._s(i) ? this._climateCard(i, room) : this._tile(i))).join("")}</div>
      ${hiddenHere ? `<div class="tiles" style="margin-top:18px"><div class="tile add" data-edrestore="devices"><ha-icon icon="mdi:plus"></ha-icon><span>${tp(hiddenHere, "Mostrar {n} escondido", "Mostrar {n} escondidos")}</span></div></div>` : ""}`;
  }

  /**
   * Room categories share rows: each spans as many grid columns as it has tiles (never more than the row).
   * A category with more tiles than a row continues in a section of its own (no title), so the next
   * categories can sit beside its last tiles instead of leaving the rest of that row empty.
   */
  _packSections() {
    const box = this.shadowRoot?.querySelector(".secs");
    if (!box) return;
    const cols = getComputedStyle(box).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
    if (box.dataset.cols && Number(box.dataset.cols) !== cols) { this._render(); return; } // the row changed: lay out again
    box.dataset.cols = cols;
    const width = (el) => (el.classList.contains("big") ? 2 : 1);
    if (!this._edit) {
      for (const sec of [...box.querySelectorAll(":scope > .sec")]) {
        const chunks = [[]];
        let used = 0;
        for (const tile of sec.querySelectorAll(":scope > .tiles > .tile")) {
          if (used + width(tile) > cols && chunks.at(-1).length) { chunks.push([]); used = 0; }
          chunks.at(-1).push(tile);
          used += width(tile);
        }
        let after = sec;
        for (const chunk of chunks.slice(1)) {
          const cont = document.createElement("section");
          cont.className = "sec cont";
          cont.innerHTML = `<h2 aria-hidden="true">&nbsp;</h2><div class="tiles"></div>`;
          chunk.forEach((tile) => cont.lastChild.appendChild(tile));
          after.after(cont);
          after = cont;
        }
      }
    }
    box.querySelectorAll(":scope > .sec").forEach((sec) => {
      const cells = [...sec.querySelectorAll(":scope > .tiles > .tile")].reduce((a, el) => a + width(el), 0);
      sec.style.setProperty("--span", Math.max(1, Math.min(cols, cells || 1)));
    });
  }

  _scenesView() {
    const h = this._hass;
    const list = (d) => this._model ? (d === "scene" ? this._model.scenes : this._model.scripts).filter((i) => this._s(i)) : Object.keys(h.states).filter((i) => dom(i) === d && !h.entities?.[i]?.hidden);
    const sc = list("scene"), sp = list("script");
    const grid = (ids) => `<div class="tiles">${ids.map((i) => this._tile(i)).join("")}</div>`;
    return `<div class="hero"><div><div class="eyebrow">${t("Toca para executar")}</div><div class="t" style="margin-top:8px">${t("Cenas e scripts")}</div></div>${this._gear()}</div>
      ${sc.length ? `<h2>${t("Cenas")}</h2>${grid(sc)}` : ""}${sp.length ? `<h2>${t("Scripts")}</h2>${grid(sp)}` : ""}
      ${!sc.length && !sp.length ? `<div class="empty">${t("Não há cenas nem scripts.")}</div>` : ""}`;
  }
}
