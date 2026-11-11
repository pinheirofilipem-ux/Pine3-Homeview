// Pine3 Homeview - The detail sheet of a device, and its sliders.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { TOGGLE, esc, dom } from "../const.js";
import { t, num } from "../i18n.js";

export class ModalMixin {

  _slider(kind, pct, compact) {
    return compact
      ? `<div class="hslider" data-slider="${kind}" data-val="${pct}"><div class="fill" style="width:${pct}%"></div><div class="lbl">${pct}%</div></div>`
      : `<div class="vslider" data-slider="${kind}" data-val="${pct}"><div class="fill" style="height:${pct}%"></div><div class="lbl">${pct}%</div></div>`;
  }

  _modalView() {
    if (this._modal === "_wx") return this._forecastSheet();
    if (this._modal?.startsWith("_pick:")) return this._pickerSheet(this._modal.slice(6));
    const id = this._modal, s = id && this._s(id);
    if (!s) return "";
    const d = dom(id), a = s.attributes, on = this._isOn(id);
    const compact = !!this._meta?.[id]?.members?.some((e) => this._s(e)); // a whole-device card: keep it short
    let content = "";
    if (d === "light" && (a.supported_color_modes || []).some((m) => m !== "onoff")) {
      const pct = on ? Math.round(((a.brightness ?? 255) / 255) * 100) : 0;
      const colors = (a.supported_color_modes || []).some((m) => ["hs", "rgb", "rgbw", "rgbww", "xy"].includes(m));
      content = `${this._slider("brightness", pct, compact)}
        <!--side-->${colors ? `<div class="sub sh-only">${t("Cor")}</div>` : ""}${colors ? `<div class="swatches">${["#ffffff", "#ffd28a", "#ff8a5c", "#ff5ca8", "#8a7cff", "#5cc8ff", "#5cff9d"].map((c) => `<div class="sw" data-color="${c}" style="background:${c}"></div>`).join("")}</div>` : ""}`;
    } else if (d === "cover" && a.current_position != null) {
      const pct = a.current_position;
      content = `${this._slider("position", pct, compact)}
        <!--side--><div class="row"><button class="pill" data-svc="cover.open_cover">${t("Abrir")}</button><button class="pill" data-svc="cover.stop_cover">${t("Parar")}</button><button class="pill" data-svc="cover.close_cover">${t("Fechar")}</button></div>`;
    } else if (d === "climate") {
      // single target ("temperature") or a range (heat_cool / auto: target_temp_low + target_temp_high, e.g. Tado via HomeKit)
      const step = a.target_temp_step || 0.5, min = a.min_temp ?? 7, max = a.max_temp ?? 35;
      const lo = a.target_temp_low, hi = a.target_temp_high;
      const range = a.temperature == null && lo != null && hi != null;
      const tg = range ? null : a.temperature;
      const pos = (v) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
      const off = s.state === "off" || s.state === "unavailable";
      const act = off ? null : a.hvac_action; // what it is doing right now: heating, cooling, idle…
      const mode = { heating: "heat", preheating: "heat", cooling: "cool", defrosting: "cool", drying: "dry", fan: "fan_only", idle: "idle" }[act] || s.state;
      const col = off ? "var(--ring-off)" : { cool: "#5ac8fa", dry: "#64d2ff", fan_only: "#a8b0bd", idle: "var(--ring-idle)" }[mode] || "#ff9f0a";
      const dim = "var(--ring-dim)";
      const grad = range ? `${dim} 0 ${pos(lo)}%, ${col} 0 ${pos(hi)}%, ${dim} 0` : `${col} 0 ${tg != null ? pos(tg) : 0}%, ${dim} 0`;
      const info = [a.current_temperature != null ? `${t("Atual")} ${num(a.current_temperature)}°` : "", a.current_humidity != null ? `${Math.round(a.current_humidity)}% ${t("hum.")}` : ""].filter(Boolean).join(" · ");
      const setter = (end, v, label) => `<div class="tset"><span>${label}</span><button class="round" data-temp="${-step}" data-end="${end}">−</button><b>${num(v)}°</b><button class="round" data-temp="${step}" data-end="${end}">+</button></div>`;
      const chips = (label, list, cur, attr) => list?.length > 1 ? `<div class="sub">${label}</div><div class="row presets">${list.map((m) => `<button class="pill ${m === cur ? "act" : ""}" data-cmode="${attr}" data-v="${esc(m)}">${esc(this._st(m))}</button>`).join("")}</div>` : "";
      const modes = a.hvac_modes || [];
      content = `<div class="ring ${compact ? "sm" : ""}" style="background:conic-gradient(${grad})">
        <div style="position:absolute;inset:14px;border-radius:50%;background:var(--ring-bg)"></div>
        <div style="position:relative;text-align:center"><div class="tgt ${range ? "rng" : ""}">${range ? `${num(lo)}–${num(hi)}°` : tg != null ? num(tg) + "°" : "–"}</div>
        ${act && act !== "off" ? `<div class="act" style="color:${col}">${esc(this._st(act))}</div>` : ""}${info ? `<div class="cur">${info}</div>` : ""}</div></div>
        ${range ? setter("low", lo, t("Mínima")) + setter("high", hi, t("Máxima")) : tg != null ? `<div class="row"><button class="round" data-temp="${-step}">−</button><button class="round" data-temp="${step}">+</button></div>` : ""}
        <!--side-->${modes.length ? `<div class="sub sh-only">${t("Modo")}</div>` : ""}
        ${modes.length ? `<div class="row ${modes.length > 4 || compact ? "presets" : ""}">${modes.map((m) => `<button class="pill ${m === s.state ? "act" : ""}" data-hvac="${m}">${this._st(m)}</button>`).join("")}</div>` : ""}
        ${chips(t("Velocidade"), a.fan_modes, a.fan_mode, "fan_mode")}${chips(t("Oscilação"), a.swing_modes, a.swing_mode, "swing_mode")}${chips(t("Perfil"), a.preset_modes, a.preset_mode, "preset_mode")}`;
    } else if (d === "media_player") {
      // only the controls the player supports (a HomeKit TV has power and inputs, no tracks)
      const f = a.supported_features || 0, has = (b) => (f & b) !== 0;
      const vol = Math.round((a.volume_level ?? 0) * 100);
      const sources = a.source_list || [];
      const playing = s.state === "playing";
      const transport = [has(16) ? `<button class="round" data-svc="media_player.media_previous_track">⏮</button>` : "",
        has(1) || has(16384) ? `<button class="round" data-svc="media_player.media_play_pause">${playing ? "⏸" : "▶"}</button>` : "",
        has(32) ? `<button class="round" data-svc="media_player.media_next_track">⏭</button>` : ""].join("");
      content = `${a.entity_picture && on ? `<img src="${esc(a.entity_picture)}" style="width:100%;max-height:260px;object-fit:cover;border-radius:20px;margin-top:18px">` : ""}
        ${a.media_title ? `<div style="text-align:center;margin-top:14px;font-weight:700">${esc(a.media_title)}</div><div style="text-align:center;color:var(--muted);font-size:13px">${esc(a.media_artist || a.app_name || "")}</div>` : ""}
        ${on && transport ? `<div class="row">${transport}</div>` : ""}
        <!--side-->${on && sources.length ? `<div class="sub">${t("Entrada")}</div><div class="row presets">${sources.map((src) => `<button class="pill ${src === a.source ? "act" : ""}" data-src="${esc(src)}">${esc(src)}</button>`).join("")}</div>` : ""}
        ${on && has(4) && a.volume_level != null ? `<div class="sub">${t("Volume")}</div>${this._slider("volume", vol, true)}`
          : on && has(1024) ? `<div class="sub">${t("Volume")}</div><div class="row"><button class="round" data-svc="media_player.volume_down">−</button>${has(8) ? `<button class="round" data-mute><ha-icon icon="mdi:volume-${a.is_volume_muted ? "off" : "high"}"></ha-icon></button>` : ""}<button class="round" data-svc="media_player.volume_up">+</button></div>` : ""}`;
    } else if (d === "fan" && (a.percentage != null || a.preset_modes?.length)) {
      content = `${a.percentage != null ? this._slider("fan", on ? a.percentage : 0, compact) : ""}
        <!--side-->${a.preset_modes?.length ? `<div class="sub sh-only">${t("Modo")}</div>` : ""}${a.preset_modes?.length ? `<div class="row ${compact ? "presets" : ""}">${a.preset_modes.map((m) => `<button class="pill ${on && m === a.preset_mode ? "act" : ""}" data-preset="${esc(m)}">${esc(this._st(m))}</button>`).join("")}</div>` : ""}`;
    } else if (d === "vacuum") {
      content = this._vacuumContent(id);
    } else if (d === "camera") {
      content = `<img src="/api/camera_proxy/${esc(id)}?token=${esc(a.access_token || "")}&t=${Date.now()}" style="width:100%;border-radius:18px;margin-top:18px;background:#000">`;
    } else {
      const skip = new Set(["friendly_name", "icon", "entity_picture", "supported_features", "attribution", "color_mode", "supported_color_modes", "device_class"]);
      const rows = ["light", "switch", "input_boolean"].includes(d) ? [] : Object.entries(a).filter(([k, v]) => !skip.has(k) && typeof v !== "object" && v != null).slice(0, 8);
      content = `${d === "sensor" ? `<div style="font-size:48px;font-weight:300;text-align:center;margin:24px 0 6px">${esc(this._sensorVal(id))}</div>` : ""}
        <!--side-->${rows.length ? `<div class="attrs">${rows.map(([k, v]) => `<span>${esc(k.replace(/_/g, " "))}</span><b>${esc(v)}</b>`).join("")}</div>` : ""}`;
    }
    const canToggle = TOGGLE.has(d) && (d !== "media_player" || ((a.supported_features || 0) & 384) !== 0);
    const device = d === "vacuum" ? this._vacuumSections(id) : this._deviceSection(id);
    const more = `<div class="more"><button data-more title="${t("Mais definições")}" aria-label="${t("Mais definições")}"><ha-icon icon="mdi:cog-outline"></ha-icon></button></div>`;
    // wide screens: the main control on the left, everything else of the device on the right
    // landscape screens: two columns wherever there are two parts. Left: the main control (and, without a
    // second part of its own, the device's readings); right: the rest (modes, inputs, colours, controls...).
    const has = (h) => h.replace(/<!--side-->|\s/g, "") !== "";
    const [cm, cs = ""] = content.split("<!--side-->"), [dm, ds = ""] = device.split("<!--side-->");
    let left, right;
    const c = cm + cs;
    if (has(cm) && has(cs)) { left = cm; right = cs + device; } else if (has(ds) && has(c + dm)) { left = c + dm; right = ds; } else if (has(c) && has(dm)) { left = c; right = dm; }
    const cols = !!(left && right && has(left) && has(right));
    const layout = cols ? `wide dev cols ${device ? "" : "cols-sm"}` : device ? "wide dev" : "";
    return `<div class="ov ${this._ovEnter(id)} ${device ? "dev" : ""}" data-close><div class="sheet ${layout}" style="--acc:${this._accent(id)}">
      <div class="hd"><div class="ic"><ha-icon icon="${this._icon(id)}"></ha-icon></div><div style="flex:1;min-width:0"><div class="nm">${esc(this._name(id))}</div><div class="st">${esc(this._stateText(id))}</div></div>
      ${canToggle ? `<button class="pill ${on ? "act" : ""}" data-toggle>${on ? t("Desligar") : t("Ligar")}</button>` : ""}<button class="sh-x sh-fav ${this._isFav(id) ? "on" : ""}" data-fav title="${this._isFav(id) ? t("Tirar dos Favoritos") : t("Pôr nos Favoritos")}" aria-label="${this._isFav(id) ? t("Tirar dos Favoritos") : t("Pôr nos Favoritos")}"><ha-icon icon="mdi:star${this._isFav(id) ? "" : "-outline"}"></ha-icon></button><button class="sh-x" data-closex title="${t("Fechar")}" aria-label="${t("Fechar")}"><ha-icon icon="mdi:close"></ha-icon></button></div>
      ${cols ? `<div class="sh-main">${left}${more}</div><div class="sh-side">${right}</div>` : `${content}${device}${more}`}</div></div>`;
  }

  _bindSlider(el, id) {
    const fill = el.querySelector(".fill"), lbl = el.querySelector(".lbl");
    const kind = el.dataset.slider;
    let val = Number(el.dataset.val);
    const horiz = el.classList.contains("hslider");
    const at = (ev) => {
      const r = el.getBoundingClientRect();
      const f = horiz ? (ev.clientX - r.left) / r.width : (r.bottom - ev.clientY) / r.height;
      return Math.round(Math.min(100, Math.max(0, f * 100)));
    };
    const show = (v) => { fill.style[horiz ? "width" : "height"] = v + "%"; lbl.textContent = v + "%"; };
    el.addEventListener("pointerdown", (ev) => { el.setPointerCapture(ev.pointerId); this._drag = true; val = at(ev); show(val); });
    el.addEventListener("pointermove", (ev) => { if (this._drag) { val = at(ev); show(val); } });
    const end = () => {
      if (!this._drag) return;
      this._drag = null;
      if (kind === "brightness") this._call("light", val ? "turn_on" : "turn_off", val ? { entity_id: id, brightness_pct: val } : { entity_id: id });
      else if (kind === "position") this._call("cover", "set_cover_position", { entity_id: id, position: val });
      else if (kind === "volume") this._call("media_player", "volume_set", { entity_id: id, volume_level: val / 100 });
      else if (kind === "fan") this._call("fan", val ? "set_percentage" : "turn_off", val ? { entity_id: id, percentage: val } : { entity_id: id });
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }
}
