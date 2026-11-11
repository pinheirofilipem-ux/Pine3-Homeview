// Pine3 Homeview - 3D view of the home: one block per room, stacked by floor, lit rooms glow.
// Pure CSS 3D (no WebGL). Rooms are packed automatically; their size can be set in Settings.

import { esc, dom } from "./const.js";
import { t, tp } from "./i18n.js";
import { DEVICE_TYPES, typeOf, stripOf } from "./devtypes.js";
import { drawHouse, cssCanvas } from "./housecanvas.js";

const U = 56; // px per layout unit
export const WALL_DEFAULT = 30; // wall height in px (Settings > 3D floor plan > Wall height)
const SLAB_MARGIN = 14; // floor slab margin around the rooms, in px
const SIZES = { 1: [2, 2], 2: [3, 2], 3: [4, 3] };

export const view3d = { rx: 58, rz: -38, floor: "all", sc: null, zoom: 1, px: 0, py: 0 };

/** Colour temperature (K) to an RGB triple (Tanner Helland's approximation). */
function kelvinRgb(k) {
  const t = Math.min(40000, Math.max(1000, k)) / 100;
  const cl = (v) => Math.round(Math.min(255, Math.max(0, v)));
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [cl(r), cl(g), cl(b)];
}

/** The colour and intensity (0.25–1) a light is shining with, or null when it is off / not a light. */
export function lightGlow(p, id) {
  const s = p._s(id);
  if (!s || dom(id) !== "light" || !p._isOn(id)) return null;
  const a = s.attributes;
  const rgb = a.rgb_color || (a.color_temp_kelvin ? kelvinRgb(a.color_temp_kelvin) : a.color_temp ? kelvinRgb(1e6 / a.color_temp) : null);
  const k = a.brightness != null ? Math.max(0.25, a.brightness / 255) : 1;
  return { rgb, k };
}
const glowVars = (g) => (g ? `${g.rgb ? `--lc:rgb(${g.rgb.join(",")});` : ""}--li:${g.k.toFixed(2)};` : "");

/** One colour for a room: the brightness-weighted mix of its lit lights (amber if none of them has a colour). */
function roomGlow(glows) {
  const withRgb = glows.filter((g) => g.rgb);
  const k = glows.length ? Math.max(...glows.map((g) => g.k)) : 0.7;
  if (!withRgb.length) return { rgb: null, k };
  const w = withRgb.reduce((a, g) => a + g.k, 0);
  const rgb = [0, 1, 2].map((i) => Math.round(withRgb.reduce((a, g) => a + g.rgb[i] * g.k, 0) / w));
  return { rgb, k };
}

export function autoSize(r) {
  const n = r.count || 0;
  return n <= 3 ? 1 : n <= 7 ? 2 : 3;
}

/** Shelf-pack rooms into rows; returns {items:[{room,x,y,w,d}], W, D}. */
export function pack(rooms, sizes) {
  const boxes = rooms.map((r) => {
    const [w, d] = SIZES[sizes[r.id] || autoSize(r)];
    return { room: r, w, d };
  });
  const area = boxes.reduce((a, b) => a + b.w * b.d, 0);
  const rowW = Math.max(6, Math.ceil(Math.sqrt(area) * 1.35), ...boxes.map((b) => b.w));
  let x = 0, y = 0, rowD = 0, W = 0;
  for (const b of boxes.sort((a, c) => c.d - a.d || c.w - a.w)) {
    if (x + b.w > rowW) { y += rowD; x = 0; rowD = 0; }
    b.x = x; b.y = y;
    x += b.w; rowD = Math.max(rowD, b.d); W = Math.max(W, x);
  }
  return { items: boxes, W, D: y + rowD };
}

export function houseView(p, rooms) {
  const cfg = p._cfg();
  const layout = cfg.house_layout || {};
  const lvOf = (r) => layout[r.id]?.f ?? r.floor_level ?? 0;
  const levels = [...new Set(rooms.map(lvOf))].sort((a, b) => a - b);
  const floorName = (lv) => rooms.find((r) => (r.floor_level ?? 0) === lv && r.floor)?.floor || t("Piso {n}", { n: lv });
  if (view3d.floor !== "all" && !levels.includes(view3d.floor)) view3d.floor = "all";
  // how this device shows the house (Settings > This device): full CSS 3D, light CSS 3D, a painted picture, or the plan
  const mode = p._houseMode(), cvs = mode === "image" || mode === "plan", flat = mode === "plan";
  if (flat && view3d.floor === "all" && levels.length) view3d.floor = levels[0]; // the plan shows one floor at a time
  const shown = view3d.floor === "all" ? levels : [view3d.floor];

  // Rooms drawn in the floor-plan editor keep their place; the rest are packed beside them.
  const plans = shown.map((lv) => {
    const onFloor = rooms.filter((r) => lvOf(r) === lv);
    const placed = onFloor.filter((r) => layout[r.id]).map((r) => ({ room: r, ...layout[r.id] }));
    const auto = pack(onFloor.filter((r) => !layout[r.id]), cfg.house_size || {});
    const ox = placed.length ? Math.max(...placed.map((b) => b.x + b.w)) + 1 : 0;
    const items = [...placed, ...auto.items.map((b) => ({ ...b, x: b.x + ox }))];
    const x0 = items.length ? Math.min(...items.map((b) => b.x)) : 0, y0 = items.length ? Math.min(...items.map((b) => b.y)) : 0;
    const x1 = Math.max(x0 + 1, ...items.map((b) => b.x + b.w)), y1 = Math.max(y0 + 1, ...items.map((b) => b.y + b.d));
    return { lv, items, x0, y0, x1, y1, W: x1 - x0, D: y1 - y0 };
  });
  // Drawn plans share one coordinate system across floors: crop it to the rooms actually used,
  // so the scene (and each floor slab) is only as big as the house, not the whole editor grid.
  const drawn = Object.keys(layout).length > 0;
  const gx0 = drawn ? Math.min(...plans.map((pl) => pl.x0)) : 0, gy0 = drawn ? Math.min(...plans.map((pl) => pl.y0)) : 0;
  const W = drawn ? Math.max(...plans.map((pl) => pl.x1)) - gx0 : Math.max(...plans.map((pl) => pl.W), 1);
  const D = drawn ? Math.max(...plans.map((pl) => pl.y1)) - gy0 : Math.max(...plans.map((pl) => pl.D), 1);
  const wall = Math.max(8, Math.min(120, cfg.wall_height || WALL_DEFAULT));
  const gap = Math.max(110, wall + 100); // distance between floors when all are shown
  // the same house as plain data, for the canvas picture
  const M = { mode, wall, W: W * U, D: D * U, stack: flat ? 0 : (shown.length - 1) * gap, floors: [] };

  const floorsHtml = plans.map((pl, k) => {
    const z = flat ? 0 : k * gap;
    // drawn plans keep their shared coordinates (cropped); automatic plans are centred
    const ox = drawn ? -gx0 * U : ((W - pl.W) / 2 - pl.x0) * U, oy = drawn ? -gy0 * U : ((D - pl.D) / 2 - pl.y0) * U;
    const F = { z, lv: pl.lv, slab: [ox + pl.x0 * U - SLAB_MARGIN, oy + pl.y0 * U - SLAB_MARGIN, pl.W * U + 2 * SLAB_MARGIN, pl.D * U + 2 * SLAB_MARGIN], rooms: [] };
    M.floors.push(F);
    const roomsHtml = pl.items.map((b) => {
      const r = b.room, sw = p._switchables(r), lit = sw.filter((i) => p._isOn(i));
      const X = ox + b.x * U, Y = oy + b.y * U;
      const R = { id: r.id, name: r.name, w: b.w * U, h: b.d * U, cx: X + (b.w * U) / 2, cy: Y + (b.d * U) / 2, lights: [], things: [] };
      F.rooms.push(R);
      // entities placed in the floor-plan editor (only meaningful when the room itself is drawn)
      const placements = cfg.placements || {};
      const placed = layout[r.id] ? r.ents.filter((i) => placements[i] && placements[i].f === lvOf(r)) : [];
      const marks = placed.map((id) => {
        const P = placements[id], ty = typeOf(P, id, p._s(id), p._meta?.[id] || {}), [icon, , kind] = DEVICE_TYPES[ty];
        const pos = `left:${((P.x - b.x) / b.w) * 100}%;top:${((P.y - b.y) / b.d) * 100}%`;
        const on = p._isOn(id) ? "on" : "";
        const g = lightGlow(p, id);
        const at = { id, x: X + (P.x - b.x) * U, y: Y + (P.y - b.y) * U, on: !!on, glow: g, kind };
        if (kind === "thing") R.things.push({ ...at, icon });
        else R.lights.push(kind === "strip" ? { ...at, len: stripOf(P).l * U, rot: stripOf(P).r } : at);
        if (kind === "strip") {
          // an LED strip at its real length (grid units → px) and angle; its light spreads along it
          const S = stripOf(P), w = S.l * U, rot = `--rot:${S.r}deg;--len:${w}px;`;
          return `<i class="pin k-strip ${on}" data-pin="${esc(id)}" title="${esc(p._name(id))}" style="${pos};${rot}${glowVars(g)}"></i>${g ? `<i class="pool k-strip" style="${pos};${rot}${glowVars(g)}"></i>` : ""}`;
        }
        if (kind !== "thing") return `<i class="pin k-${kind} ${on}" data-pin="${esc(id)}" title="${esc(p._name(id))}" style="${pos};${glowVars(g)}"></i>${g ? `<i class="pool k-${kind}" style="${pos};${glowVars(g)}"></i>` : ""}`;
        if (kind === "thing") return `<div class="mk3 ${on}" data-mk="${esc(id)}" title="${esc(p._name(id))}" style="${pos}"><div class="mki"><ha-icon icon="${icon}"></ha-icon></div></div>`;
        return `<i class="pin k-${kind} ${on}" data-pin="${esc(id)}" title="${esc(p._name(id))}" style="${pos}"></i>`;
      }).join("");
      const lights = r.ents.filter((i) => dom(i) === "light" && !placed.includes(i)).slice(0, 6);
      const c = p._roomClimate(r);
      const open = r.ents.some((i) => (dom(i) === "binary_sensor" && ["door", "window", "garage_door", "opening"].includes(p._s(i)?.attributes.device_class) && p._s(i).state === "on") || (dom(i) === "cover" && p._isOn(i)));
      // free shapes (from the floor-plan editor): one floor tile per cell, walls only on the outline
      const cells = b.cells ? b.cells.map(([x, y]) => [x - b.x, y - b.y]) : null;
      let shape = `<div class="fl"></div><div class="wl n"></div><div class="wl s"></div><div class="wl e"></div><div class="wl w"></div>`;
      let spots = null, lbl = "";
      if (cells) {
        const set = new Set(cells.map(([x, y]) => x + "," + y));
        const has = (x, y) => set.has(x + "," + y);
        shape = cells.map(([x, y]) => {
          const L = x * U, T = y * U;
          return `<div class="fl c" style="left:${L}px;top:${T}px;width:${U}px;height:${U}px"></div>`
            + (has(x, y - 1) ? "" : `<div class="wl ws n" style="left:${L}px;top:${T}px;width:${U}px;height:var(--wall)"></div>`)
            + (has(x, y + 1) ? "" : `<div class="wl ws s" style="left:${L}px;top:calc(${T + U}px - var(--wall));width:${U}px;height:var(--wall)"></div>`)
            + (has(x - 1, y) ? "" : `<div class="wl ws w" style="left:${L}px;top:${T}px;width:var(--wall);height:${U}px"></div>`)
            + (has(x + 1, y) ? "" : `<div class="wl ws e" style="left:calc(${L + U}px - var(--wall));top:${T}px;width:var(--wall);height:${U}px"></div>`);
        }).join("");
        spots = lights.map((_, n) => cells[Math.floor(((n + 0.5) * cells.length) / Math.max(1, lights.length))]).map(([x, y]) => [((x + 0.5) / b.w) * 100, ((y + 0.5) / b.d) * 100]);
        // label over the cell closest to the shape's centre of mass
        const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length, cy = cells.reduce((a, c) => a + c[1], 0) / cells.length;
        const [mx, my] = cells.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cy) < Math.hypot(best[0] - cx, best[1] - cy) ? c : best), cells[0]);
        lbl = `style="left:${(mx + 0.5) * U}px;top:${(my + 0.5) * U}px"`;
      }
      const cols = Math.min(3, Math.max(1, lights.length));
      const pins = lights.map((id, n) => {
        const [px, py] = spots ? spots[n] : [((n % cols) + 1) / (cols + 1) * 100, (Math.floor(n / cols) + 1) / (Math.ceil(lights.length / cols) + 1) * 100];
        const g = lightGlow(p, id), pos = `left:${px}%;top:${py}%`;
        R.lights.push({ id, x: X + (px / 100) * b.w * U, y: Y + (py / 100) * b.d * U, on: p._isOn(id), glow: g, kind: "lamp" });
        return `<i class="pin ${p._isOn(id) ? "on" : ""}" data-pin="${esc(id)}" title="${esc(p._name(id))}" style="${pos};${glowVars(g)}"></i>${g ? `<i class="pool" style="${pos};${glowVars(g)}"></i>` : ""}`;
      }).join("");
      const meta = [c.temp && c.temp.replace(/,\d/, "").replace(".", "").replace("°C", "°"), lit.length ? tp(lit.length, "{n} ligado", "{n} ligados") : null].filter(Boolean).join(" · ");
      // the room takes the colour of its lit lights (a plug or a switch alone keeps the accent colour)
      const glows = r.ents.map((i) => lightGlow(p, i)).filter(Boolean);
      const rg = lit.length ? roomGlow(glows) : null;
      Object.assign(R, { lit: lit.length > 0, open, glow: rg, meta });
      if (cells) {
        R.shape = true;
        R.cells = cells.map(([x, y]) => [X + x * U, Y + y * U, U, U]);
        const set = new Set(cells.map(([x, y]) => x + "," + y));
        R.edges = cells.flatMap(([x, y]) => {
          const L = X + x * U, T = Y + y * U, e = [];
          if (!set.has(x + "," + (y - 1))) e.push([L, T, L + U, T]);
          if (!set.has(x + "," + (y + 1))) e.push([L, T + U, L + U, T + U]);
          if (!set.has(x - 1 + "," + y)) e.push([L, T, L, T + U]);
          if (!set.has(x + 1 + "," + y)) e.push([L + U, T, L + U, T + U]);
          return e;
        });
        R.cx = X + (cells.reduce((a, c) => a + c[0], 0) / cells.length + 0.5) * U;
        R.cy = Y + (cells.reduce((a, c) => a + c[1], 0) / cells.length + 0.5) * U;
        const [lx, ly] = lbl.match(/[\d.]+/g).map(Number);
        R.lx = X + lx; R.ly = Y + ly;
      } else {
        const x0 = X + 3, y0 = Y + 3, x1 = X + b.w * U - 3, y1 = Y + b.d * U - 3;
        R.cells = [[x0, y0, x1 - x0, y1 - y0]];
        R.edges = [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
        R.lx = R.cx; R.ly = R.cy;
      }
      return `<div class="r3 ${lit.length ? "lit" : ""} ${open ? "open" : ""} ${cells ? "shape" : ""}" data-room="${esc(r.id)}" style="${glowVars(rg)}left:${ox + b.x * U}px;top:${oy + b.y * U}px;width:${b.w * U}px;height:${b.d * U}px">
        ${shape}
        ${pins}${marks}
        <div class="lbw" ${lbl}><div class="lb"><b>${esc(r.name)}</b>${meta ? `<small>${esc(meta)}</small>` : ""}</div></div>
      </div>`;
    }).join("");
    return `<div class="fl3" style="transform:translateZ(${z}px)">
      <div class="slab" style="left:${ox + pl.x0 * U - SLAB_MARGIN}px;top:${oy + pl.y0 * U - SLAB_MARGIN}px;width:${pl.W * U + 2 * SLAB_MARGIN}px;height:${pl.D * U + 2 * SLAB_MARGIN}px"></div>
      ${roomsHtml}
      ${shown.length > 1 ? `<div class="lbw flab" style="left:${ox + pl.x0 * U - SLAB_MARGIN}px;top:${oy + pl.y0 * U - SLAB_MARGIN}px"><div class="lb"><small>${esc(floorName(pl.lv))}</small></div></div>` : ""}
    </div>`;
  }).join("");

  const chips = levels.length > 1 ? `<div class="chips3">
      ${flat ? "" : `<button class="pill ${view3d.floor === "all" ? "solid" : ""}" data-floor="all">${t("Todos os pisos")}</button>`}
      ${levels.map((lv) => `<button class="pill ${view3d.floor === lv ? "solid" : ""}" data-floor="${lv}">${esc(floorName(lv))}</button>`).join("")}
    </div>` : "";

  // canvas modes: names, floor names and things are plain HTML placed over the picture by drawHouse()
  const overlay = !cvs ? "" : M.floors.map((F) => [
    ...F.rooms.map((R) => `<div class="cvl ${R.lit ? "lit" : ""}" data-at="${R.lx},${R.ly},${flat ? F.z : F.z + wall + 26}"><div class="lb"><b>${esc(R.name)}</b>${R.meta ? `<small>${esc(R.meta)}</small>` : ""}</div></div>`),
    ...F.rooms.flatMap((R) => R.things.map((T) => `<div class="cvt ${T.on ? "on" : ""}" data-mk="${esc(T.id)}" title="${esc(p._name(T.id))}" data-at="${T.x},${T.y},${flat ? F.z : F.z + 16}"><div class="mki"><ha-icon icon="${T.icon}"></ha-icon></div></div>`)),
    shown.length > 1 && !flat ? `<div class="cvl fname" data-at="${F.slab[0]},${F.slab[1]},${F.z}"><div class="lb"><small>${esc(floorName(F.lv))}</small></div></div>` : "",
  ].join("")).join("");
  p._house = M;

  const lit = rooms.filter((r) => p._switchables(r).some((i) => p._isOn(i))).length;
  return `<div class="hero"><div><div class="eyebrow">${tp(lit, "{n} divisão acesa", "{n} divisões acesas")}</div><div class="t" style="margin-top:8px">${t("Casa 3D")}</div></div>
      <div class="right"><button class="pill" data-editplan><ha-icon icon="mdi:floor-plan"></ha-icon>${t("Editar planta")}</button>${p._gear()}</div></div>
    ${chips}
    <div class="stage ${cvs ? `cvs ${flat ? "flat" : ""}` : mode === "lite" ? "lite3d" : "glass"}" data-stage>
      ${cvs ? `<canvas></canvas>${rooms.length ? overlay : ""}` : `<div class="scene3d" style="--rx:${view3d.rx}deg;--rz:${view3d.rz}deg;--sc:${(view3d.sc ?? 1) * view3d.zoom};--px:${view3d.px}px;--py:${view3d.py}px;--zi:${(1 / view3d.zoom).toFixed(3)};width:${W * U}px;height:${D * U}px;--stack:${(shown.length - 1) * gap}px;--wall:${wall}px">
        ${rooms.length ? floorsHtml : ""}
      </div>`}
      <div class="ctl3">
        <button class="mini" data-zoom="out" title="${t("Afastar")}"><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="mini" data-zoom="in" title="${t("Aproximar")}"><ha-icon icon="mdi:plus"></ha-icon></button>
        ${flat ? `<button class="mini" data-rot="reset" title="${t("Repor vista")}"><ha-icon icon="mdi:crosshairs"></ha-icon></button>` : `
        <button class="mini" data-rot="-30" title="${t("Rodar")}"><ha-icon icon="mdi:rotate-left"></ha-icon></button>
        <button class="mini" data-rot="reset" title="${t("Repor vista")}"><ha-icon icon="mdi:crosshairs"></ha-icon></button>
        <button class="mini" data-rot="30" title="${t("Rodar")}"><ha-icon icon="mdi:rotate-right"></ha-icon></button>
        <button class="mini" data-wall="-6" title="${t("Paredes mais baixas")}"><ha-icon icon="mdi:arrow-collapse-vertical"></ha-icon></button>
        <button class="mini" data-wall="6" title="${t("Paredes mais altas")}"><ha-icon icon="mdi:arrow-expand-vertical"></ha-icon></button>`}
      </div>
      <div class="hint3">${flat ? t("Arrasta para mover · Dois dedos para aproximar · Toca numa divisão para a abrir ou numa luz para a ligar") : t("Arrasta para rodar · Dois dedos para aproximar · Toca numa divisão para a abrir ou numa luz para a ligar")}</div>
    </div>
    ${rooms.length ? "" : `<div class="empty">${t("Ainda não há divisões com dispositivos.")}</div>`}`;
}

export function bindHouse(p, root) {
  const stage = root.querySelector("[data-stage]");
  if (!stage) return;
  const scene = stage.querySelector(".scene3d"), M = p._house;
  const cvs = !scene && M && stage.querySelector("canvas");
  const flat = M?.mode === "plan" && !!cvs;
  let hit = () => null;
  const draw = () => { if (cvs) hit = drawHouse(p, stage, M, view3d); };
  // one update per frame while dragging or pinching, however many pointer events arrive
  let raf = 0;
  const apply = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (cvs) { draw(); return; }
      const st = scene.style;
      st.setProperty("--rx", view3d.rx + "deg");
      st.setProperty("--rz", view3d.rz + "deg");
      st.setProperty("--sc", (view3d.sc ?? 1) * view3d.zoom);
      st.setProperty("--px", view3d.px + "px");
      st.setProperty("--py", view3d.py + "px");
      st.setProperty("--zi", (1 / view3d.zoom).toFixed(3));
    });
  };
  const fit = () => {
    if (cvs) { draw(); return; }
    const w = scene.offsetWidth, d = scene.offsetHeight;
    const diag = Math.hypot(w, d) + 80;
    const sc = Math.min(1.25, (stage.clientWidth - 24) / diag, (stage.clientHeight - 60) / (diag * 0.62 + parseFloat(scene.style.getPropertyValue("--stack") || 0)));
    // remember the scale so the next redraw starts at the right size (no jump/flicker)
    view3d.sc = Math.max(0.35, sc).toFixed(3);
    scene.style.setProperty("--sc", view3d.sc * view3d.zoom);
  };
  fit();

  // zoom (pinch, wheel) keeps the point under the fingers / cursor in place; the house can't be pushed off the stage
  const centre = () => [stage.clientWidth / 2, stage.clientHeight * (flat ? 0.5 : 0.52)];
  const zoomTo = (z, m0, m, z0, p0) => {
    z = Math.min(3, Math.max(0.6, z));
    const [cx, cy] = centre(), k = z / z0;
    const lx = (stage.clientWidth * z) / 2, ly = (stage.clientHeight * z) / 2;
    view3d.zoom = z;
    view3d.px = Math.max(-lx, Math.min(lx, m[0] - cx - (m0[0] - cx - p0[0]) * k));
    view3d.py = Math.max(-ly, Math.min(ly, m[1] - cy - (m0[1] - cy - p0[1]) * k));
    apply();
  };
  const local = (ev) => { const r = stage.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };

  const pts = new Map();
  let start = null, pinch = null, moved = false;
  const grab = () => { if (!p._drag) { p._drag = true; stage.classList.add("rotating"); } };
  stage.addEventListener("pointerdown", (ev) => {
    if (ev.target.closest("button")) return;
    pts.set(ev.pointerId, local(ev));
    if (pts.size === 2) {
      // a second finger: pinch to zoom (and move), no rotation
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], z: view3d.zoom, p: [view3d.px, view3d.py] };
      start = null; moved = true; grab();
      for (const id of pts.keys()) try { stage.setPointerCapture(id); } catch { /* already gone */ }
      return;
    }
    if (pts.size === 1) { start = { x: ev.clientX, y: ev.clientY, rx: view3d.rx, rz: view3d.rz, px: view3d.px, py: view3d.py }; moved = false; }
  });
  stage.addEventListener("pointermove", (ev) => {
    if (!pts.has(ev.pointerId)) return;
    pts.set(ev.pointerId, local(ev));
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      zoomTo(pinch.z * (d / pinch.d), pinch.m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], pinch.z, pinch.p);
      return;
    }
    if (!start) return;
    const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) > 8) { moved = true; stage.setPointerCapture(ev.pointerId); grab(); }
    if (!moved) return;
    if (flat) { view3d.px = start.px + dx; view3d.py = start.py + dy; } // the plan doesn't rotate: one finger moves it
    else {
      // the house turns with the finger (drag right → the front moves right)
      view3d.rz = start.rz - dx * 0.35;
      view3d.rx = Math.min(78, Math.max(18, start.rx - dy * 0.25));
    }
    apply();
  });
  const up = (ev) => {
    pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 1) start = null; // lifting one finger of a pinch doesn't start a rotation
    if (pts.size) return;
    start = null; p._drag = null; stage.classList.remove("rotating");
    setTimeout(() => { moved = false; }, 0);
  };
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", up);
  stage.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const m = local(ev);
    zoomTo(view3d.zoom * Math.exp(-ev.deltaY * 0.0015), m, m, view3d.zoom, [view3d.px, view3d.py]);
  }, { passive: false });

  // the light or device closest to a tap, within a finger's reach: small targets win over the room under them
  const nearest = (x, y, reach) => {
    let best = null, bd = reach;
    stage.querySelectorAll(".pin[data-pin], [data-mk] .mki").forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      if (d < bd) { bd = d; best = el; }
    });
    return best;
  };
  stage.addEventListener("click", (ev) => {
    if (moved) { ev.stopPropagation(); return; }
    if (ev.target.closest("button")) return;
    if (cvs) {
      const mk = ev.target.closest("[data-mk]");
      if (mk) { ev.stopPropagation(); p._openModal(mk.dataset.mk); return; }
      const h = hit(...local(ev));
      if (h?.pin) { ev.stopPropagation(); p._call("homeassistant", "toggle", { entity_id: h.pin }); }
      else if (h?.room) { ev.stopPropagation(); p._go("room", h.room); }
      return;
    }
    const near = nearest(ev.clientX, ev.clientY, 26);
    if (near?.dataset.pin) { ev.stopPropagation(); p._call("homeassistant", "toggle", { entity_id: near.dataset.pin }); return; }
    const mk = near?.closest("[data-mk]");
    if (mk) { ev.stopPropagation(); p._openModal(mk.dataset.mk); return; }
    const room = ev.target.closest("[data-room]");
    if (room) { ev.stopPropagation(); p._go("room", room.dataset.room); }
  }, true);
  root.querySelectorAll("[data-rot]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.rot === "reset") Object.assign(view3d, { rx: 58, rz: -38, zoom: 1, px: 0, py: 0 });
    else view3d.rz += Number(b.dataset.rot);
    apply();
  }));
  root.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    const c = centre();
    zoomTo(view3d.zoom * (b.dataset.zoom === "in" ? 1.35 : 1 / 1.35), c, c, view3d.zoom, [view3d.px, view3d.py]);
  }));
  root.querySelectorAll("[data-wall]").forEach((b) => b.addEventListener("click", () => {
    const cur = p._cfg().wall_height || WALL_DEFAULT;
    const next = Math.max(10, Math.min(100, cur + Number(b.dataset.wall)));
    if (next !== cur) { p._saveSettings({ wall_height: next }); p._render(); }
  }));
  root.querySelector("[data-editplan]")?.addEventListener("click", () => p._openSettings("plan"));
  root.querySelectorAll("[data-floor]").forEach((b) => b.addEventListener("click", () => {
    view3d.floor = b.dataset.floor === "all" ? "all" : Number(b.dataset.floor);
    p._render();
  }));
  p._fit3d = fit;
}

export const css3d = `
.chips3{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.stage{position:relative;margin-top:20px;border-radius:32px;height:min(68vh,640px);min-height:380px;overflow:hidden;perspective:1600px;perspective-origin:50% 35%;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
.stage.rotating{cursor:grabbing}
.scene3d{position:absolute;left:50%;top:52%;transform-style:preserve-3d;transform:translate(calc(-50% + var(--px,0px)),calc(-50% + var(--py,0px))) scale(var(--sc)) rotateX(var(--rx)) rotateZ(var(--rz)) translateZ(calc(var(--stack) / -2));transition:transform .08s linear}
.fl3{position:absolute;inset:0;transform-style:preserve-3d;pointer-events:none}
.fl3 .r3{pointer-events:auto}
.fl3 .r3.shape{pointer-events:none}
.slab{position:absolute;pointer-events:none;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 60px rgba(0,0,0,.35);transform:translateZ(-2px)}
.r3{position:absolute;transform-style:preserve-3d;cursor:pointer;padding:3px}
.r3 .fl{position:absolute;inset:3px;border-radius:10px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);transition:background .3s,box-shadow .3s}
.r3:hover .fl{background:rgba(255,255,255,.16)}
.r3{--lc:var(--amber);--li:1}
.r3.lit .fl{background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--lc) calc(var(--li) * 85%),transparent) 0%,color-mix(in srgb,var(--lc) calc(var(--li) * 50%),transparent) 55%,color-mix(in srgb,var(--lc) calc(var(--li) * 22%),transparent) 100%);box-shadow:0 0 calc(var(--li) * 44px) color-mix(in srgb,var(--lc) calc(var(--li) * 55%),transparent);border-color:color-mix(in srgb,var(--lc) 70%,#fff)}
.r3 .wl{position:absolute;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.20);backface-visibility:visible}
.r3.lit .wl{background:color-mix(in srgb,var(--lc) calc(var(--li) * 24%),rgba(255,255,255,.12));border-color:color-mix(in srgb,var(--lc) 45%,rgba(255,255,255,.3))}
.r3.open .wl.s,.r3.open .wl.e{border-style:dashed}
.r3 .wl.n{left:3px;right:3px;top:3px;height:var(--wall);transform-origin:top;transform:rotateX(90deg)}
.r3 .wl.s{left:3px;right:3px;bottom:3px;height:var(--wall);transform-origin:bottom;transform:rotateX(-90deg)}
.r3 .wl.w{top:3px;bottom:3px;left:3px;width:var(--wall);transform-origin:left;transform:rotateY(-90deg)}
.r3 .wl.e{top:3px;bottom:3px;right:3px;width:var(--wall);transform-origin:right;transform:rotateY(90deg)}
.r3.shape{padding:0;pointer-events:none}
.r3.shape .fl.c{inset:auto;border-radius:0;border:0;pointer-events:auto}
.r3.shape.lit .fl.c{background:color-mix(in srgb,var(--lc) calc(var(--li) * 62%),rgba(255,255,255,.12));box-shadow:none}
.r3.shape .pin{pointer-events:auto}
.r3 .wl.ws{right:auto;bottom:auto}
.r3 .wl.ws.n{transform-origin:top;transform:rotateX(90deg)}
.r3 .wl.ws.s{transform-origin:bottom;transform:rotateX(-90deg)}
.r3 .wl.ws.w{transform-origin:left;transform:rotateY(-90deg)}
.r3 .wl.ws.e{transform-origin:right;transform:rotateY(90deg)}
.pin{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.6);transform:translateZ(3px);cursor:pointer}
.pin.k-ceiling{transform:translateZ(calc(var(--wall) - 2px));width:20px;height:20px;margin:-10px 0 0 -10px}
.pin.k-ceiling.on{box-shadow:0 0 calc(10px + var(--li) * 16px) calc(var(--li) * 9px) var(--lc)}
.pin.k-strip{--len:44px;--rot:0deg;width:var(--len);height:8px;margin:-4px 0 0 calc(var(--len) / -2);border-radius:4px;transform:translateZ(3px) rotate(var(--rot))}
.pin.k-strip.on{box-shadow:0 0 calc(8px + var(--li) * 12px) calc(var(--li) * 6px) var(--lc)}
.mk3{position:absolute;transform-style:preserve-3d;pointer-events:auto;cursor:pointer}
.mki{transform:translateZ(16px) rotateZ(calc(var(--rz) * -1)) rotateX(calc(var(--rx) * -1)) translate(-50%,-50%);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;
  background:rgba(25,14,28,.8);color:#fff;border:2px solid rgba(255,255,255,.45);box-shadow:0 4px 12px rgba(0,0,0,.4);transform-origin:0 0}
.mki ha-icon{--mdc-icon-size:18px}
.mk3.on .mki{background:var(--cream);color:var(--ink);border-color:#fff;box-shadow:0 0 16px color-mix(in srgb,var(--amber) 60%,transparent)}
.r3.shape .mk3{pointer-events:auto}
.pin{--lc:var(--amber);--li:1}
.pin.on{background:color-mix(in srgb,var(--lc) 35%,#fff);border-color:var(--lc);box-shadow:0 0 calc(6px + var(--li) * 12px) calc(var(--li) * 5px) var(--lc)}
/* the light it casts on the floor: its own colour, wider and brighter with the brightness */
.pool{--lc:var(--amber);--li:1;position:absolute;width:calc(60px + var(--li) * 90px);height:calc(60px + var(--li) * 90px);border-radius:50%;transform:translate(-50%,-50%) translateZ(1px);pointer-events:none;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--lc) calc(var(--li) * 75%),transparent),color-mix(in srgb,var(--lc) calc(var(--li) * 30%),transparent) 55%,transparent)}
.pool.k-strip{--len:44px;--rot:0deg;width:calc(var(--len) + 30px + var(--li) * 40px);height:calc(28px + var(--li) * 34px);border-radius:999px;transform:translate(-50%,-50%) translateZ(1px) rotate(var(--rot))}
.lbw{position:absolute;left:50%;top:50%;transform-style:preserve-3d;transform:translateZ(calc(var(--wall) + 26px)) rotateZ(calc(var(--rz) * -1)) rotateX(calc(var(--rx) * -1));pointer-events:none}
.lb{transform:translate(-50%,-100%) scale(var(--zi,1));transform-origin:50% 100%;white-space:nowrap;text-align:center;padding:6px 12px;border-radius:14px;background:rgba(20,10,22,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.14);line-height:1.2}
.lb b{display:block;font-family:var(--display);font-weight:500;font-size:15px}
.lb small{display:block;font-size:12px;color:var(--muted)}
.r3.lit .lb{background:color-mix(in srgb,var(--cream) 92%,transparent);color:var(--ink)}
.r3.lit .lb small{color:var(--ink-soft)}
.flab{transform:translateZ(4px) rotateZ(calc(var(--rz) * -1)) rotateX(calc(var(--rx) * -1))}
.flab .lb{background:rgba(20,10,22,.45);border:0;transform:translate(-50%,-50%) scale(var(--zi,1));transform-origin:50% 50%}
.flab .lb small{font-size:13px;letter-spacing:.18em;text-transform:uppercase}
.ctl3{position:absolute;right:16px;top:16px;display:flex;gap:8px}
.hint3{position:absolute;left:0;right:0;bottom:14px;text-align:center;font-size:13px;color:var(--muted);pointer-events:none;padding:0 16px}
@media (max-width:720px){.flab{display:none}}
/* 3D light: the same scene without the costly bits (blur, big shadows, transitions) */
.stage.lite3d,.stage.cvs{background:rgba(255,255,255,.06);border:1px solid var(--line)}
.lite3d .scene3d,.lite3d .r3 .fl{transition:none}
.lite3d .slab,.lite3d .r3.lit .fl,.lite3d .pin.on,.lite3d .pin.k-ceiling.on,.lite3d .pin.k-strip.on,.lite3d .mki,.lite3d .mk3.on .mki{box-shadow:none}
.lite3d .lb{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgba(20,10,22,.8)}
.lite3d .r3.lit .lb{background:var(--cream)}
.lite3d .pool{background:radial-gradient(closest-side,color-mix(in srgb,var(--lc) calc(var(--li) * 55%),transparent),transparent)}
${cssCanvas}`;
