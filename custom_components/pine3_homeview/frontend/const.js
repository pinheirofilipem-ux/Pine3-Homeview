// Pine3 Homeview - shared constants and helpers.

export const SHOWN = new Set([
  "light", "switch", "fan", "cover", "lock", "climate", "media_player", "sensor",
  "binary_sensor", "scene", "script", "vacuum", "camera", "input_boolean", "button",
]);
export const TOGGLE = new Set(["light", "switch", "fan", "input_boolean", "lock", "cover", "media_player"]);
export const DETAIL = new Set(["light", "cover", "climate", "media_player", "fan"]);

export const SECTIONS = [
  ["Luzes", ["light"]],
  ["Clima", ["climate", "fan"]],
  ["Cortinas e estores", ["cover"]],
  ["Multimédia", ["media_player"]],
  ["Segurança", ["lock", "camera"]],
  ["Tomadas e interruptores", ["switch", "input_boolean"]],
  ["Ações", ["script", "button", "vacuum"]],
  ["Sensores", ["sensor", "binary_sensor"]],
];

export const SECTION_ICON = {
  "Luzes": "mdi:lightbulb-outline", "Clima": "mdi:thermometer", "Cortinas e estores": "mdi:window-shutter", "Multimédia": "mdi:television",
  "Segurança": "mdi:shield-outline", "Tomadas e interruptores": "mdi:power-socket-eu", "Ações": "mdi:gesture-tap-button", "Sensores": "mdi:gauge",
};
export const DOMAIN_ICON = {
  light: "mdi:lightbulb", switch: "mdi:power-socket-eu", fan: "mdi:fan", cover: "mdi:window-shutter",
  lock: "mdi:lock", climate: "mdi:thermostat", media_player: "mdi:speaker", sensor: "mdi:gauge",
  binary_sensor: "mdi:checkbox-blank-circle-outline", scene: "mdi:palette", script: "mdi:script-text-play",
  vacuum: "mdi:robot-vacuum", camera: "mdi:cctv", input_boolean: "mdi:toggle-switch", button: "mdi:gesture-tap-button",
};
export const DEVICE_CLASS_ICON = {
  temperature: "mdi:thermometer", humidity: "mdi:water-percent", power: "mdi:flash", energy: "mdi:lightning-bolt",
  door: "mdi:door", window: "mdi:window-closed-variant", motion: "mdi:motion-sensor", battery: "mdi:battery",
  illuminance: "mdi:brightness-5", garage_door: "mdi:garage", blind: "mdi:blinds", curtain: "mdi:curtains",
  pm25: "mdi:blur", pm10: "mdi:blur", pm1: "mdi:blur", aqi: "mdi:air-filter", carbon_dioxide: "mdi:molecule-co2",
  volatile_organic_compounds: "mdi:molecule", volatile_organic_compounds_parts: "mdi:molecule",
  signal_strength: "mdi:wifi", duration: "mdi:timer-outline",
};
// Icon hints from an entity's name, for integrations that don't set icons or device classes
// (e.g. an air purifier's filter life, child lock, display light, beep).
export const NAME_ICON = [
  [/purif|air ?clean/i, "mdi:air-purifier"], [/filtr|filter|hepa/i, "mdi:air-filter"], [/bloqueio|child ?lock|\block\b/i, "mdi:lock"],
  [/al[ée]rg|allerg/i, "mdi:flower-pollen"], [/luz|light|display|ecr[ãa]/i, "mdi:lightbulb-on-outline"], [/beep|som|buzzer|sound/i, "mdi:volume-high"],
  [/modo|mode/i, "mdi:tune-variant"], [/velocidade|speed/i, "mdi:fan"], [/timer|temporizador|remaining|restante/i, "mdi:timer-outline"], [/rssi|wi-?fi|sinal|signal/i, "mdi:wifi"],
];
export const ACCENT = {
  light: "#ffb340", switch: "#5ac8fa", fan: "#64d2ff", cover: "#5e9cff", lock: "#30d158", climate: "#ff9f0a",
  media_player: "#bf5af2", input_boolean: "#5ac8fa", vacuum: "#30d158", script: "#5e5ce6", button: "#5e5ce6",
  binary_sensor: "#ff453a", camera: "#8e8e93",
};
export const STATE_PT = {
  on: "Ligado", off: "Desligado", open: "Aberto", closed: "Fechado", opening: "A abrir", closing: "A fechar",
  locked: "Trancado", unlocked: "Destrancado", playing: "A tocar", paused: "Em pausa", idle: "Inativo",
  standby: "Em espera", unavailable: "Indisponível", unknown: "Desconhecido", heat: "Aquecer", cool: "Arrefecer",
  auto: "Automático", heat_cool: "Aquecer/Arrefecer", dry: "Desumidificar", fan_only: "Ventilação",
  balanced: "Equilibrado", max: "Máximo", max_plus: "Máximo+", gentle: "Suave", charging: "A carregar", cleaning: "A limpar", docked: "Na base", returning: "A regressar",
  // fan / air purifier preset modes
  sleep: "Noturno", turbo: "Turbo", manual: "Manual", silent: "Silencioso", eco: "Eco", boost: "Reforço",
  allergen: "Alérgenos", bacteria: "Bactérias", night: "Noturno", smart: "Inteligente", natural: "Natural",
  low: "Baixo", medium: "Médio", high: "Alto",
  // climate: what it is doing now (hvac_action), fan / swing / preset modes (e.g. Tado via HomeKit)
  heating: "A aquecer", cooling: "A arrefecer", drying: "A desumidificar", fan: "A ventilar",
  preheating: "A pré-aquecer", defrosting: "A descongelar", middle: "Médio", quiet: "Silencioso",
  focus: "Focado", diffuse: "Difuso", both: "Ambos", vertical: "Vertical", horizontal: "Horizontal",
  // option lists of air purifiers (e.g. Philips)
  air_quality: "Qualidade do ar", ambient_light_mode: "Luz ambiente", indoor_allergen_index: "Índice de alérgenos",
  pm25: "PM2.5", humidity: "Humidade", temperature: "Temperatura", gas: "Gás",
  away: "Ausente", home: "Em casa", comfort: "Conforto", activity: "Atividade", none: "Nenhum",
};
export const WEATHER_PT = {
  "clear-night": "Céu limpo", cloudy: "Nublado", exceptional: "Excecional", fog: "Nevoeiro", hail: "Granizo",
  lightning: "Trovoada", "lightning-rainy": "Trovoada e chuva", partlycloudy: "Pouco nublado", pouring: "Chuva forte",
  rainy: "Chuva", snowy: "Neve", "snowy-rainy": "Chuva e neve", sunny: "Sol", windy: "Ventoso", "windy-variant": "Ventoso",
};
export const WEATHER_ICON = {
  "clear-night": "mdi:weather-night", cloudy: "mdi:weather-cloudy", fog: "mdi:weather-fog", hail: "mdi:weather-hail",
  lightning: "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy", partlycloudy: "mdi:weather-partly-cloudy",
  pouring: "mdi:weather-pouring", rainy: "mdi:weather-rainy", snowy: "mdi:weather-snowy", "snowy-rainy": "mdi:weather-snowy-rainy",
  sunny: "mdi:weather-sunny", windy: "mdi:weather-windy", "windy-variant": "mdi:weather-windy-variant",
};
export const BIN_PT = {
  door: ["Fechada", "Aberta"], window: ["Fechada", "Aberta"], garage_door: ["Fechada", "Aberta"],
  motion: ["Sem movimento", "Movimento"], occupancy: ["Livre", "Ocupado"], moisture: ["Seco", "Fuga"],
  battery: ["Normal", "Fraca"], smoke: ["Sem fumo", "Fumo"], problem: ["OK", "Problema"],
};

export const THEMES = {
  ameixa: "radial-gradient(90% 70% at 55% 35%, #7b4467 0%, transparent 60%), radial-gradient(70% 60% at 0% 0%, #4a2440 0%, transparent 60%), radial-gradient(80% 70% at 100% 100%, #2c1630 0%, transparent 60%), linear-gradient(160deg, #3a1d36, #1d0f1f)",
  pinheiro: "radial-gradient(120% 90% at 10% 0%, #2f6b4a 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, #1d3f5e 0%, transparent 60%), linear-gradient(160deg, #11261b, #0b1520)",
  noite: "radial-gradient(100% 80% at 80% 0%, #3a2d6b 0%, transparent 55%), radial-gradient(90% 70% at 0% 100%, #1a3a5c 0%, transparent 60%), linear-gradient(170deg, #121026, #070912)",
  aurora: "radial-gradient(90% 70% at 0% 0%, #1f8a7a 0%, transparent 55%), radial-gradient(80% 70% at 100% 30%, #6a3fa0 0%, transparent 60%), linear-gradient(180deg, #0e1e2a, #120c22)",
  areia: "radial-gradient(100% 80% at 20% 0%, #a0724a 0%, transparent 55%), radial-gradient(80% 70% at 100% 100%, #5a4a7a 0%, transparent 60%), linear-gradient(160deg, #3a2a20, #1a1420)",
  oceano: "radial-gradient(100% 80% at 90% 0%, #1e6fa8 0%, transparent 55%), radial-gradient(80% 70% at 0% 100%, #0f8a8a 0%, transparent 60%), linear-gradient(170deg, #0a1f33, #06121c)",
  // ambient themes: a deep, near-black base with large soft glows of colour (low alpha), so the glass reads clearly
  nebulosa: "radial-gradient(60% 55% at 18% 20%, rgba(150,108,214,.34) 0%, transparent 70%), radial-gradient(55% 50% at 84% 28%, rgba(84,130,206,.26) 0%, transparent 70%), radial-gradient(60% 55% at 58% 98%, rgba(122,72,166,.24) 0%, transparent 70%), linear-gradient(155deg, #1a1530, #111827 55%, #0a0f18)",
  floresta: "radial-gradient(60% 55% at 16% 22%, rgba(86,168,124,.28) 0%, transparent 70%), radial-gradient(55% 50% at 86% 72%, rgba(58,140,152,.22) 0%, transparent 70%), radial-gradient(50% 45% at 70% 8%, rgba(140,170,96,.14) 0%, transparent 70%), linear-gradient(155deg, #18241e, #0f1613 55%, #080c0a)",
  ardosia: "radial-gradient(60% 55% at 22% 14%, rgba(136,148,182,.22) 0%, transparent 70%), radial-gradient(55% 50% at 86% 86%, rgba(104,124,158,.18) 0%, transparent 70%), linear-gradient(155deg, #1c1e26, #13151b 55%, #0b0c10)",
  vinho: "radial-gradient(60% 55% at 18% 18%, rgba(196,92,134,.30) 0%, transparent 70%), radial-gradient(55% 50% at 86% 62%, rgba(124,62,146,.26) 0%, transparent 70%), radial-gradient(50% 45% at 40% 100%, rgba(150,60,90,.18) 0%, transparent 70%), linear-gradient(155deg, #2a1424, #1a0e1a 55%, #100810)",
  meia_noite: "radial-gradient(60% 55% at 82% 14%, rgba(64,124,226,.30) 0%, transparent 70%), radial-gradient(55% 50% at 14% 86%, rgba(42,170,204,.20) 0%, transparent 70%), radial-gradient(45% 40% at 40% 30%, rgba(110,90,200,.14) 0%, transparent 70%), linear-gradient(155deg, #0f1630, #0b1122 55%, #060912)",
  brasa: "radial-gradient(60% 55% at 18% 14%, rgba(232,142,62,.28) 0%, transparent 70%), radial-gradient(55% 50% at 86% 76%, rgba(204,74,62,.22) 0%, transparent 70%), radial-gradient(45% 40% at 60% 40%, rgba(240,190,110,.08) 0%, transparent 70%), linear-gradient(155deg, #261a14, #18110e 55%, #0e0a08)",
  // vivid themes (saturated gradients, white text), in the spirit of a home app's wallpapers
  ambar: "radial-gradient(90% 75% at 15% 5%, #ffc24a 0%, transparent 60%), radial-gradient(80% 70% at 95% 30%, #ff7a2f 0%, transparent 60%), radial-gradient(90% 80% at 50% 110%, #b8360f 0%, transparent 65%), linear-gradient(160deg, #f0901f, #a33a12)",
  coral: "radial-gradient(90% 75% at 10% 0%, #ff9a7a 0%, transparent 60%), radial-gradient(80% 70% at 100% 40%, #ff4f6d 0%, transparent 60%), radial-gradient(90% 80% at 40% 110%, #9c1f4a 0%, transparent 65%), linear-gradient(160deg, #f0625a, #8f1f45)",
  lima: "radial-gradient(90% 75% at 15% 0%, #c6f25a 0%, transparent 60%), radial-gradient(80% 70% at 100% 50%, #2fbf71 0%, transparent 60%), radial-gradient(90% 80% at 50% 110%, #0b6b4a 0%, transparent 65%), linear-gradient(160deg, #6fcf3f, #0f6a45)",
  azul: "radial-gradient(90% 75% at 85% 0%, #5ac8ff 0%, transparent 60%), radial-gradient(80% 70% at 0% 50%, #2f6bff 0%, transparent 60%), radial-gradient(90% 80% at 60% 110%, #1b2a9e 0%, transparent 65%), linear-gradient(160deg, #3d8bff, #1b2b8f)",
  violeta: "radial-gradient(90% 75% at 15% 0%, #c08bff 0%, transparent 60%), radial-gradient(80% 70% at 100% 40%, #7a4dff 0%, transparent 60%), radial-gradient(90% 80% at 40% 110%, #3c1a8f 0%, transparent 65%), linear-gradient(160deg, #8d5cf6, #3d1c8a)",
  magenta: "radial-gradient(90% 75% at 85% 0%, #ff8ad8 0%, transparent 60%), radial-gradient(80% 70% at 0% 50%, #e0359f 0%, transparent 60%), radial-gradient(90% 80% at 50% 110%, #7a1466 0%, transparent 65%), linear-gradient(160deg, #e64aa8, #6f1a6b)",
  turquesa: "radial-gradient(90% 75% at 15% 0%, #7ff0e0 0%, transparent 60%), radial-gradient(80% 70% at 100% 50%, #14b8c4 0%, transparent 60%), radial-gradient(90% 80% at 50% 110%, #0b5c78 0%, transparent 65%), linear-gradient(160deg, #22c3b8, #0d5a74)",
  por_do_sol: "radial-gradient(90% 70% at 10% 0%, #ffd36b 0%, transparent 55%), radial-gradient(80% 70% at 100% 20%, #ff6b6b 0%, transparent 60%), radial-gradient(90% 80% at 30% 110%, #6a3fd0 0%, transparent 65%), linear-gradient(170deg, #ff9a4a, #5a2fa8)",
  // light themes (the whole panel switches to dark text on light glass)
  linho: "radial-gradient(90% 70% at 15% 0%, #fffaf1 0%, transparent 60%), radial-gradient(80% 70% at 100% 100%, #e8d9c4 0%, transparent 60%), linear-gradient(160deg, #f6efe4, #e9dfd0)",
  nevoa: "radial-gradient(90% 70% at 85% 0%, #ffffff 0%, transparent 60%), radial-gradient(80% 70% at 0% 100%, #cfdbe8 0%, transparent 60%), linear-gradient(170deg, #eef2f7, #dfe6ef)",
  pessego: "radial-gradient(90% 70% at 10% 0%, #fff3ec 0%, transparent 60%), radial-gradient(80% 70% at 100% 90%, #f4cdbf 0%, transparent 60%), linear-gradient(160deg, #fbe9e1, #f1dcd6)",
  menta: "radial-gradient(90% 70% at 90% 0%, #f6fffb 0%, transparent 60%), radial-gradient(80% 70% at 0% 100%, #c6e5d8 0%, transparent 60%), linear-gradient(170deg, #e9f5f0, #d9ebe3)",
  lavanda: "radial-gradient(90% 70% at 20% 0%, #fbf8ff 0%, transparent 60%), radial-gradient(80% 70% at 100% 100%, #d6cdee 0%, transparent 60%), linear-gradient(160deg, #f0ecf8, #e2dcf0)",
  ceu: "radial-gradient(90% 70% at 80% 0%, #ffffff 0%, transparent 60%), radial-gradient(80% 70% at 0% 100%, #bcd8f0 0%, transparent 60%), linear-gradient(170deg, #e7f1fa, #d4e5f4)",
};
export const LIGHT_THEMES = new Set(["linho", "nevoa", "pessego", "menta", "lavanda", "ceu"]);
export const AMBIENT_THEMES = new Set(["nebulosa", "floresta", "ardosia", "vinho", "meia_noite", "brasa"]);
export const VIVID_THEMES = new Set(["ambar", "coral", "lima", "azul", "violeta", "magenta", "turquesa", "por_do_sol"]);
export const CARD_COLORS = ["#f5efe1", "#efe3c8", "#e6dcc2", "#d6e2e8", "#c3d3da", "#d9d3e3", "#e6d3d6", "#cfe0cc", "#bccfc3", "#cbb9a8", "#bcc6d3", "#d8ccb4", "#cdc6d8", "#b9d3cd"];
export const ACCENTS = ["#f6b83f", "#f5a524", "#ff9f43", "#ff7a59", "#ff6b81", "#f472b6", "#a78bfa", "#7c8cff", "#4aa8ff", "#2dd4bf", "#4ade80", "#a3e635"];
export const DOCK_ITEMS = [
  ["home", "mdi:home-outline", "Casa", ""],
  ["rooms", "mdi:view-grid-outline", "Divisões", "Todas as divisões numa grelha."],
  ["house", "mdi:cube-outline", "Casa 3D", "Vista 3D da casa, por pisos."],
  ["scenes", "mdi:creation-outline", "Cenas", "Cenas e scripts."],
  ["climate", "mdi:thermometer", "Clima", "Ar condicionado, termóstatos e temperatura por divisão."],
  ["security", "mdi:shield-outline", "Segurança", "Portas, janelas, fechaduras e câmaras."],
];
export const DEFAULTS = {
  theme: "ameixa", card_color: "#f5efe1", accent_color: "#f6b83f", clock_24h: true,
  show_weather: true, show_people: true, show_status: true, show_scenes: true, show_summary: true,
  dock: ["home", "rooms", "house", "scenes"], hidden: [], hidden_rooms: [], room_order: [],
  language: "pt", layout: "grid", home_layout: "top", appearance: "fixed", theme_day: "linho", theme_night: "ameixa", weather_entity: "", screensaver: 0, animations: true,
  big_rooms: [], big_devices: [], device_order: {}, house_size: {}, house_layout: {}, shown: [], placements: {}, wall_height: 30,
};
export const THEME_NAMES = { ameixa: "Ameixa", pinheiro: "Pinheiro", noite: "Noite", aurora: "Aurora", areia: "Areia", oceano: "Oceano", linho: "Linho", nevoa: "Névoa", pessego: "Pêssego", menta: "Menta", lavanda: "Lavanda", ceu: "Céu", ambar: "Âmbar", coral: "Coral", lima: "Lima", azul: "Azul", violeta: "Violeta", magenta: "Magenta", turquesa: "Turquesa", por_do_sol: "Pôr do sol", nebulosa: "Nebulosa", floresta: "Floresta", ardosia: "Ardósia", vinho: "Vinho", meia_noite: "Meia-noite", brasa: "Brasa" };



export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const dom = (id) => id.split(".")[0];
export const store = {
  get(k, d) { try { const v = localStorage.getItem("pine3hv." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pine3hv." + k, JSON.stringify(v)); } catch { /* ignore */ } },
};

export function loadFonts() {
  // Fonts: Outfit (display) + Figtree (text), both SIL OFL 1.1, shipped in ./fonts.
(() => {
  if (document.getElementById("pine3-fonts")) return;
  const base = new URL("./fonts/", import.meta.url).href;
  const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  const EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
  const face = (fam, file, range) => `@font-face{font-family:"${fam}";font-style:normal;font-display:swap;font-weight:100 900;src:url(${base}${file}) format("woff2-variations"),url(${base}${file}) format("woff2");unicode-range:${range}}`;
  const st = document.createElement("style");
  st.id = "pine3-fonts";
  st.textContent = [
    face("Pine3 Outfit", "outfit-latin-wght-normal.woff2", LATIN), face("Pine3 Outfit", "outfit-latin-ext-wght-normal.woff2", EXT),
    face("Pine3 Figtree", "figtree-latin-wght-normal.woff2", LATIN), face("Pine3 Figtree", "figtree-latin-ext-wght-normal.woff2", EXT),
  ].join("");
  document.head.appendChild(st);
})();
}
