// Pine3 Homeview - the home painted as one picture on a <canvas> ("3D image" and "2D plan" modes).
// Same geometry as the CSS 3D view, but drawn once per change instead of hundreds of 3D layers,
// so it stays smooth (and correct) on weaker tablets. Names and things are light HTML on top.

const P = 1600; // perspective, as the CSS stage

/** A CSS colour as an [r,g,b] triple (the canvas normalises any CSS colour for us). */
function rgbOf(ctx, css, fallback) {
  ctx.fillStyle = fallback;
  if (css) ctx.fillStyle = css;
  const v = String(ctx.fillStyle);
  if (v[0] === "#") return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  const m = v.match(/[\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : [246, 184, 63];
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** World (px, z up) → screen (CSS px) for the current angle; the scale ignores the angle, so rotating doesn't zoom. */
export function camera(M, view, cw, ch) {
  const flat = M.mode === "plan";
  const rx = flat ? 0 : (view.rx * Math.PI) / 180, rz = flat ? 0 : (view.rz * Math.PI) / 180;
  const cz = Math.cos(rz), sz = Math.sin(rz), cx = Math.cos(rx), sx = Math.sin(rx);
  const { W, D, stack } = M;
  let sc;
  if (flat) sc = Math.max(0.2, Math.min(1.6, (cw - 48) / W, (ch - 72) / D));
  else {
    const diag = Math.hypot(W, D) + 80;
    sc = Math.max(0.35, Math.min(1.25, (cw - 24) / diag, (ch - 60) / (diag * 0.62 + stack)));
  }
  sc *= view.zoom || 1; // pinch / wheel zoom, and the pan below, as in the CSS view
  const ox = cw / 2 + (view.px || 0), oy = (flat ? ch / 2 : ch * 0.52) + (view.py || 0), px = cw / 2, py = ch * 0.35;
  const pr = (x, y, z) => {
    const X = x - W / 2, Y = y - D / 2, Z = z - stack / 2;
    const x1 = X * cz - Y * sz, y1 = X * sz + Y * cz;
    const y2 = y1 * cx - Z * sx, z2 = y1 * sx + Z * cx;
    const ax = ox + x1 * sc, ay = oy + y2 * sc;
    if (flat) return [ax, ay, z2];
    const f = P / (P - z2);
    return [px + (ax - px) * f, py + (ay - py) * f, z2];
  };
  pr.sc = sc;
  return pr;
}

function inPoly(pts, x, y) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function segDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l));
  return Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
}

/**
 * Paint the model into the stage's canvas and place the HTML labels.
 * Returns a hit tester: (x, y) in stage px → {pin} | {room} | null.
 */
export function drawHouse(host, stage, M, view) {
  const cv = stage.querySelector("canvas");
  const cw = stage.clientWidth, ch = stage.clientHeight;
  if (!cv || !cw || !ch) return () => null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bw = Math.round(cw * dpr), bh = Math.round(ch * dpr);
  if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
  const ctx = cv.getContext("2d");
  const reset = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  reset();
  ctx.clearRect(0, 0, cw, ch);
  const cs = getComputedStyle(host);
  const amber = rgbOf(ctx, cs.getPropertyValue("--amber").trim(), "#f6b83f");
  const pr = camera(M, view, cw, ch);
  const W = host.classList.contains("light") ? "40,30,46" : "255,255,255"; // floors and walls: white on dark themes, ink on light ones
  const flat = M.mode === "plan";
  const path = (pts) => { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  const quad = ([x, y, w, h], z) => [pr(x, y, z), pr(x + w, y, z), pr(x + w, y + h, z), pr(x, y + h, z)];
  // the floor plane around a point as a canvas transform, for circles and gradients lying on the floor
  const plane = (x, y, z) => {
    const o = pr(x, y, z), a = pr(x + 1, y, z), b = pr(x, y + 1, z);
    ctx.setTransform(dpr * (a[0] - o[0]), dpr * (a[1] - o[1]), dpr * (b[0] - o[0]), dpr * (b[1] - o[1]), dpr * o[0], dpr * o[1]);
  };
  const wall = M.wall;
  const pins = [], rooms = [];

  for (const F of M.floors) {
    const z = F.z;
    // floor slab
    ctx.beginPath(); path(quad(F.slab, z - 2));
    ctx.fillStyle = `rgba(${W},.07)`; ctx.fill();
    ctx.strokeStyle = `rgba(${W},.14)`; ctx.lineWidth = 1; ctx.stroke();

    // room floors, with the glow of their lights
    for (const R of F.rooms) {
      const lc = R.glow?.rgb || amber, k = R.glow?.k ?? 0.7;
      const qs = R.cells.map((c) => quad(c, z));
      R.qs = qs;
      rooms.push({ id: R.id, qs });
      ctx.beginPath(); qs.forEach(path);
      ctx.fillStyle = `rgba(${W},.10)`; ctx.fill();
      if (R.lit) {
        ctx.save(); ctx.clip();
        plane(R.cx, R.cy, z);
        const rad = Math.max(R.w, R.h) * 0.62;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        g.addColorStop(0, rgba(lc, 0.85 * k)); g.addColorStop(0.55, rgba(lc, 0.5 * k)); g.addColorStop(1, rgba(lc, 0.22 * k));
        ctx.fillStyle = g; ctx.fillRect(-rad, -rad, 2 * rad, 2 * rad);
        ctx.restore(); reset();
      }
      if (!R.shape) {
        ctx.beginPath(); qs.forEach(path);
        ctx.strokeStyle = R.lit ? rgba(lc, 0.75) : `rgba(${W},.16)`; ctx.lineWidth = 1; ctx.stroke();
      }
    }

    // light cast on the floor (kept inside its room)
    for (const R of F.rooms) for (const L of R.lights) {
      if (!L.glow) continue;
      const lc = L.glow.rgb || amber, k = L.glow.k;
      ctx.save();
      ctx.beginPath(); R.qs.forEach(path); ctx.clip();
      plane(L.x, L.y, z + 1);
      if (L.kind === "strip") { ctx.rotate((L.rot * Math.PI) / 180); ctx.scale((L.len + 30 + k * 40) / 2, (28 + k * 34) / 2); }
      else { const r = (60 + k * 90) / 2; ctx.scale(r, r); }
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, rgba(lc, 0.75 * k)); g.addColorStop(0.55, rgba(lc, 0.3 * k)); g.addColorStop(1, rgba(lc, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); reset();
    }

    // walls, far ones first
    if (!flat) {
      const ws = [];
      for (const R of F.rooms) for (const e of R.edges) {
        const a0 = pr(e[0], e[1], z), b0 = pr(e[2], e[3], z), a1 = pr(e[0], e[1], z + wall), b1 = pr(e[2], e[3], z + wall);
        ws.push({ R, q: [a0, b0, b1, a1], d: a0[2] + b0[2] + a1[2] + b1[2] });
      }
      ws.sort((a, b) => a.d - b.d);
      for (const { R, q } of ws) {
        const lc = R.glow?.rgb || amber, k = R.glow?.k ?? 0.7;
        ctx.beginPath(); path(q);
        ctx.fillStyle = `rgba(${W},.10)`; ctx.fill();
        if (R.lit) { ctx.fillStyle = rgba(lc, 0.24 * k); ctx.fill(); }
        ctx.strokeStyle = R.lit ? rgba(lc, 0.5) : `rgba(${W},.22)`; ctx.lineWidth = 1;
        if (R.open) ctx.setLineDash([4, 3]);
        ctx.stroke(); ctx.setLineDash([]);
      }
    } else {
      // the plan: walls as lines along the outline
      ctx.lineCap = "round";
      for (const R of F.rooms) {
        const lc = R.glow?.rgb || amber;
        ctx.beginPath();
        for (const e of R.edges) { const a = pr(e[0], e[1], z), b = pr(e[2], e[3], z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
        ctx.strokeStyle = R.lit ? rgba(lc, 0.8) : `rgba(${W},.4)`; ctx.lineWidth = 2.5;
        if (R.open) ctx.setLineDash([6, 4]);
        ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // the lights themselves
    for (const R of F.rooms) for (const L of R.lights) {
      const lc = L.glow?.rgb || amber, k = L.glow?.k ?? 1;
      const lz = flat ? z : z + (L.kind === "ceiling" ? wall - 2 : 3);
      const fill = L.on ? `rgb(${lc.map((v) => Math.round(v * 0.35 + 255 * 0.65)).join(",")})` : `rgba(${W},.35)`;
      const stroke = L.on ? rgba(lc, 1) : `rgba(${W},.6)`;
      if (L.kind === "strip") {
        const a = (L.rot * Math.PI) / 180, h = L.len / 2;
        const A = pr(L.x - Math.cos(a) * h, L.y - Math.sin(a) * h, lz), B = pr(L.x + Math.cos(a) * h, L.y + Math.sin(a) * h, lz);
        ctx.lineCap = "round";
        if (L.on) { ctx.strokeStyle = rgba(lc, 0.35 * k + 0.15); ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
        ctx.strokeStyle = stroke; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        ctx.strokeStyle = fill; ctx.lineWidth = 4; ctx.stroke();
        pins.push({ id: L.id, seg: [A, B] });
        continue;
      }
      const [sx, sy] = pr(L.x, L.y, lz), r = L.kind === "ceiling" ? 10 : 8;
      if (L.on) {
        const gr = r + 6 + k * 14, g = ctx.createRadialGradient(sx, sy, r * 0.6, sx, sy, gr);
        g.addColorStop(0, rgba(lc, 0.55 + 0.35 * k)); g.addColorStop(1, rgba(lc, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, gr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
      pins.push({ id: L.id, x: sx, y: sy });
    }
  }

  // names and things: plain HTML moved over the picture (no 3D, no blur)
  const ls = Math.max(0.55, Math.min(1, pr.sc)).toFixed(3); // names shrink with the house, as in the 3D view
  stage.querySelectorAll("[data-at]").forEach((el) => {
    const [x, y, z] = el.dataset.at.split(",").map(Number);
    const [sx, sy] = pr(x, y, z);
    el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) scale(${ls})`;
  });

  return (x, y) => {
    // the closest light within a finger's reach wins over the room under it
    let best = null, bd = 28;
    for (const q of pins) {
      const d = q.seg ? segDist(x, y, q.seg[0], q.seg[1]) + 4 : Math.hypot(x - q.x, y - q.y);
      if (d < bd) { bd = d; best = q.id; }
    }
    if (best) return { pin: best };
    for (let i = rooms.length - 1; i >= 0; i--) if (rooms[i].qs.some((qd) => inPoly(qd, x, y))) return { room: rooms[i].id };
    return null;
  };
}

export const cssCanvas = `
.stage.cvs{cursor:grab}
.stage.cvs.flat{cursor:move}
.stage.cvs canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.cvl{position:absolute;left:0;top:0;pointer-events:none;transform-origin:0 0}
@media (max-width:720px){.cvl.fname{display:none}}
.cvl .lb{transform:translate(-50%,-100%);white-space:nowrap;text-align:center;padding:5px 11px;border-radius:13px;background:rgba(20,10,22,.78);border:1px solid rgba(255,255,255,.14);line-height:1.2}
.flat .cvl .lb{transform:translate(-50%,-50%)}
.cvl.lit .lb{background:var(--cream);color:var(--ink)}
.cvl.lit .lb small{color:var(--ink-soft)}
.cvl.fname .lb{background:rgba(20,10,22,.55);border:0;transform:translate(0,-100%)}
.cvl.fname .lb small{font-size:12px;letter-spacing:.18em;text-transform:uppercase}
.cvt{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;transform-origin:0 0}
.cvt .mki{transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgba(25,14,28,.85);color:#fff;border:2px solid rgba(255,255,255,.45)}
.cvt.on .mki{background:var(--cream);color:var(--ink);border-color:#fff}
.cvt .mki ha-icon{--mdc-icon-size:18px}
`;
