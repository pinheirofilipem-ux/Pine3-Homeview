// Pine3 Homeview - colour tokens for the dark and light appearances.
//
// The stylesheets are written for dark backgrounds and take their colours from these tokens, so the
// same rules serve both appearances: a light background adds the `light` class to the panel, which
// switches the tokens below (and adds a few rules that a token can't express).
//
//   rgb(var(--fg)) / rgba(var(--fg), a * --fg-k)       text, lines and icons (white, or ink on light)
//   rgba(255,255,255, a * --glass-k + --glass-b)       white glass surfaces (whiter on light)
//   rgba(var(--deep-rgb, r,g,b), a + --deep-add)       dark surfaces such as sheets and the dock
//                                                      (they become light glass on light themes)
//   rgba(r,g,b, a * --shade-k)                         dark shadows (softer on light)
//
// New code (the faces) should use the semantic --hv-* tokens at the end.

export const tokens = `
:host{
  --fg:255,255,255;--fg-k:1;
  --glass-k:1;--glass-b:0;--glass-max:1;
  --deep-add:0;--deep-max:1;
  --shade-k:1;
  --hv-text:rgb(var(--fg));
  --hv-text-2:rgba(var(--fg),min(1,calc(.66 * var(--fg-k))));
  --hv-line:rgba(var(--fg),min(1,calc(.12 * var(--fg-k))));
  --hv-glass:var(--glass);
  --hv-glass-hi:var(--glass-hi);
  --hv-on:var(--cream);
  --hv-on-ink:var(--ink);
  --hv-accent:var(--amber);
  --hv-r:var(--r);
  --hv-gap:20px;
}
`;

export const tokensLight = `
:host{
  --fg:33,24,38;--fg-k:1.1;
  --glass-k:2.4;--glass-b:.3;--glass-max:.9;
  --deep-rgb:255,255,255;--deep-add:.12;--deep-max:.95;
  --shade-k:.45;
}
`;
