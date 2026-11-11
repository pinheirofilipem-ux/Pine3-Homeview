// Pine3 Homeview - device types for placing entities on the floor plan (and drawing them in 3D).

import { dom } from "./const.js";

// key -> [icon, Portuguese label, kind]   kind: "light" glows when on, "ceiling" glows from above,
// "strip" is a line of light, "thing" is an icon marker.
export const DEVICE_TYPES = {
  ceiling: ["mdi:ceiling-light", "Luz de teto", "ceiling"],
  lamp: ["mdi:floor-lamp", "Candeeiro", "light"],
  led: ["mdi:led-strip-variant", "Fita LED", "strip"],
  spot: ["mdi:spotlight-beam", "Spot", "ceiling"],
  bulb: ["mdi:lightbulb", "Lâmpada", "light"],
  tv: ["mdi:television", "TV", "thing"],
  appletv: ["mdi:television-box", "Apple TV", "thing"],
  homepod: ["mdi:speaker", "HomePod", "thing"],
  speaker: ["mdi:speaker-wireless", "Coluna", "thing"],
  ac: ["mdi:air-conditioner", "Ar condicionado", "thing"],
  fan: ["mdi:fan", "Ventoinha", "thing"],
  purifier: ["mdi:air-purifier", "Purificador", "thing"],
  blind: ["mdi:blinds", "Estore", "thing"],
  door: ["mdi:door", "Porta", "thing"],
  window: ["mdi:window-closed-variant", "Janela", "thing"],
  plug: ["mdi:power-socket-eu", "Tomada", "thing"],
  sensor: ["mdi:thermometer", "Sensor", "thing"],
  motion: ["mdi:motion-sensor", "Movimento", "thing"],
  camera: ["mdi:cctv", "Câmara", "thing"],
  lock: ["mdi:lock", "Fechadura", "thing"],
  vacuum: ["mdi:robot-vacuum", "Aspirador", "thing"],
  other: ["mdi:circle-medium", "Outro", "thing"],
};

const has = (s, ...words) => words.some((w) => s.includes(w));

/** Best guess of a device type from the entity's domain, device class, name and device model. */
export function autoType(id, state, meta = {}) {
  const d = dom(id);
  const a = state?.attributes || {};
  const name = `${meta.name || ""} ${a.friendly_name || ""} ${id}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const model = `${meta.model || ""}`.toLowerCase(), maker = `${meta.manufacturer || ""}`.toLowerCase();
  if (d === "light") {
    if (has(name, "fita", "led", "strip", "lightstrip", "barra")) return "led";
    // "candeeiro de teto" is a ceiling light, so the ceiling words win over "candeeiro"
    if (has(name, "teto", "tecto", "ceiling", "plafon", "lustre", "pendente", "suspens")) return "ceiling";
    if (has(name, "spot", "foco", "embutid")) return "spot";
    if (has(name, "candeeiro", "lamp", "abajur", "de pe", "cabeceira", "floor")) return "lamp";
    return "ceiling";
  }
  if (d === "media_player") {
    if (maker.includes("apple") && model.includes("homepod")) return "homepod";
    if (maker.includes("apple") && model.includes("tv")) return "appletv";
    if (has(name, "homepod")) return "homepod";
    if (has(name, "apple tv", "appletv")) return "appletv";
    if (a.device_class === "tv" || has(name, "tv", "televis")) return "tv";
    return "speaker";
  }
  if (d === "climate") return "ac";
  if (d === "fan") return has(name, "purif", "air clean") || (maker.includes("philips") && model.startsWith("ac")) ? "purifier" : "fan";
  if (d === "cover") return a.device_class === "door" || a.device_class === "garage" ? "door" : "blind";
  if (d === "lock") return "lock";
  if (d === "camera") return "camera";
  if (d === "vacuum") return "vacuum";
  if (d === "switch" || d === "input_boolean") return has(name, "tv", "televis") ? "tv" : "plug";
  if (d === "binary_sensor") {
    if (["door", "garage_door", "opening"].includes(a.device_class)) return "door";
    if (a.device_class === "window") return "window";
    if (["motion", "occupancy", "presence"].includes(a.device_class)) return "motion";
    return "sensor";
  }
  if (d === "sensor") return "sensor";
  return "other";
}

/** Length (grid units) and angle (degrees) of a placed LED strip. */
export const stripOf = (P) => ({ l: Math.min(30, Math.max(0.25, Number(P?.l) || 1)), r: ((Number(P?.r) || 0) % 360 + 360) % 360 });

export const typeOf = (placement, id, state, meta) => (placement?.t && DEVICE_TYPES[placement.t] ? placement.t : autoType(id, state, meta));
