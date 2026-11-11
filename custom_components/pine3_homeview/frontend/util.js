// Pine3 Homeview - small helpers shared by the panel modules.

// the version of the frontend, from its URL (/pine3_homeview_static/<version>/…): differs from the integration's when the browser kept an old copy
export const FRONT_VERSION = (import.meta.url.match(/\/(\d+\.\d+\.\d+)\//) || [])[1] || null;

export const clone = (o) => JSON.parse(JSON.stringify(o));
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const SAVER_STEPS = [0, 1, 5, 10, 30];
export const EDIT_HINT = "Arrasta para mover. Toca em − para esconder e nas setas para duplicar o tamanho.";

/** A colour for a temperature, cold blue to hot orange (the forecast's range bars). */
export function tempColor(v) {
  const stops = [[0, [90, 200, 250]], [10, [100, 210, 255]], [16, [130, 214, 190]], [20, [246, 201, 74]], [26, [255, 159, 67]], [33, [255, 94, 58]]];
  if (v <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let k = 1; k < stops.length; k++) {
    const [t1, c1] = stops[k], [t0, c0] = stops[k - 1];
    if (v <= t1) { const f = (v - t0) / (t1 - t0); return `rgb(${c0.map((c, n) => Math.round(c + (c1[n] - c) * f))})`; }
  }
  return `rgb(${stops[stops.length - 1][1]})`;
}

/** Copy the methods (and getters / setters) of mixin classes onto a class. */
export function mixin(target, ...sources) {
  for (const src of sources)
    for (const key of Object.getOwnPropertyNames(src.prototype))
      if (key !== "constructor") Object.defineProperty(target.prototype, key, Object.getOwnPropertyDescriptor(src.prototype, key));
}
