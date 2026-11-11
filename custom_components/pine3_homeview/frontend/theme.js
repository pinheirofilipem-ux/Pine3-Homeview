// Pine3 Homeview - light appearance and the day / night theme.
// The stylesheets take their colours from the tokens in tokens.js; on a light theme the panel adds
// cssLight after them, which switches the tokens and fixes what a token cannot.

import { THEMES, LIGHT_THEMES } from "./const.js";
import { tokensLight } from "./tokens.js";

/** Added after the stylesheets on light themes: the light tokens, and what a token can't express. */
export const cssLight = `${tokensLight}
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
