// Pine3 Homeview - light appearance. The panel is styled for dark backgrounds; for a light theme the same
// stylesheet is converted once: translucent white surfaces become a whiter glass, white text, lines and
// icons become ink, dark surfaces (dock, sheets, labels) become light glass, and shadows get softer.

import { THEMES, LIGHT_THEMES } from "./const.js";

const INK = "33,24,38"; // text, lines and icons on light themes
const SURFACE = /^(background|background-color|background-image|--glass|--glass-hi|--glass-strong|--surface)$/;

/** The light version of a stylesheet (computed once per stylesheet). */
export function toLight(css) {
  return css.replace(/([a-z-]+)\s*:\s*([^;{}]+)/gi, (m, prop, val) => {
    const p = prop.toLowerCase();
    if (p.startsWith("--") && !SURFACE.test(p) && !/^--(muted|line|ink|ring)/.test(p)) return m; // other variables untouched
    const surface = SURFACE.test(p);
    const shadow = /shadow/.test(p);
    let v = val;
    // dark translucent colours: surfaces become light glass, shadows get softer
    v = v.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/g, (s, r, g, b, a) => {
      if (+r > 90 || +g > 90 || +b > 90) return s;
      const al = parseFloat(a);
      if (shadow) return `rgba(${r},${g},${b},${(al * 0.45).toFixed(2)})`;
      if (surface) return `rgba(255,255,255,${Math.min(0.95, al + 0.12).toFixed(2)})`;
      return s;
    });
    // translucent white: a whiter glass for surfaces, ink for text, lines and icons
    v = v.replace(/rgba\(255,\s*255,\s*255,\s*([.\d]+)\)/g, (s, a) => {
      const al = parseFloat(a);
      if (shadow) return s;
      return surface ? `rgba(255,255,255,${Math.min(0.9, al * 2.4 + 0.3).toFixed(2)})` : `rgba(${INK},${Math.min(1, al * 1.1).toFixed(2)})`;
    });
    if (!surface && !shadow) v = v.replace(/#fff\b|#ffffff\b|\bwhite\b/gi, `rgb(${INK})`);
    return `${prop}:${v}`;
  }) + LIGHT_FIXES;
}

// what a mechanical conversion can't know
const LIGHT_FIXES = `
:host{--ring-bg:#fff;--sheen:linear-gradient(145deg,rgba(255,255,255,.55),rgba(255,255,255,.12) 50%,rgba(255,255,255,0) 75%);--edge:inset 0 1px 0 rgba(255,255,255,.9);--lift:0 16px 40px -24px rgba(60,40,50,.35)}
.rc.on,.tile.on{box-shadow:0 14px 34px -18px rgba(60,40,50,.45),inset 0 0 0 2px color-mix(in srgb,var(--amber) 55%,transparent)}
.rc.media.pic,.rc.media.pic .eyebrow,.rc.media.pic .ttl,.rc.media.pic .art{color:#fff}
.rc.media.pic .art{opacity:.8}
.bg::after{background:none}
.ov{background:rgba(236,230,226,.42)}
/* small surfaces on the near-white sheets and panels: a faint ink instead of white on white */
.sheet .sh-x,.sheet .more button,.sheet .round,.sheet .mini,.sheet .vac-b:not(.act),.sheet .vac-sec,.sheet .dv-r,.sheet .dv-c,.sheet .dv-t:not(.on),.sheet .dv-sel,.sheet .fh,
.sheet .vslider,.sheet .hslider,.sheet .pill:not(.act):not(.solid),.sheet .seg .pill:not(.solid){background:rgba(33,24,38,.06)}
.tg:not(.on){background:rgba(33,24,38,.18)}
.tile .pw,.rc .pw{background:rgba(255,255,255,.75)}
`;

/** Which theme is showing: the fixed one, or the day / night one by the sun (sun.sun, else 7:00–19:00). */
export function currentTheme(cfg, hass, fallback = "ameixa") {
  if (cfg.appearance === "auto") {
    const sun = hass?.states?.["sun.sun"]?.state;
    const h = new Date().getHours();
    const day = sun ? sun === "above_horizon" : h >= 7 && h < 19;
    const key = day ? cfg.theme_day || "linho" : cfg.theme_night || "ameixa";
    return THEMES[key] ? key : fallback;
  }
  const key = cfg.theme || fallback;
  return THEMES[key] ? key : fallback;
}
export const isLight = (key) => LIGHT_THEMES.has(key);
