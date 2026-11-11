// Pine3 Homeview - weather from a Home Assistant weather entity, or Open-Meteo for the home's location.

// WMO weather codes (Open-Meteo) -> Home Assistant weather conditions.
function wmo(code, isDay = 1) {
  if (code === 0) return isDay ? "sunny" : "clear-night";
  if (code === 1 || code === 2) return isDay ? "partlycloudy" : "clear-night";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 57) || code === 61 || code === 63 || code === 80 || code === 81) return "rainy";
  if (code === 65 || code === 82) return "pouring";
  if (code === 66 || code === 67) return "snowy-rainy";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snowy";
  if (code === 95) return "lightning-rainy";
  if (code === 96 || code === 99) return "hail";
  return "cloudy";
}

const OM_TTL = 15 * 60 * 1000;

export class Weather {
  constructor(onChange) {
    this.onChange = onChange;
    this.om = null;
    this.omAt = 0;
    this.omLoading = false;
    this.fcCache = {};
  }

  entities(hass) {
    return Object.keys(hass.states).filter((i) => i.startsWith("weather.")).sort();
  }

  /** Which source to use: the chosen entity, the first available one, or Open-Meteo. */
  source(hass, pref) {
    if (pref === "open-meteo") return { kind: "om" };
    const ids = this.entities(hass);
    const ok = (i) => hass.states[i] && hass.states[i].state !== "unavailable" && hass.states[i].attributes.temperature != null;
    const id = pref && ok(pref) ? pref : ids.find(ok);
    return id ? { kind: "entity", id } : { kind: "om" };
  }

  /** Current conditions, or null while Open-Meteo is still loading. */
  current(hass, pref) {
    const src = this.source(hass, pref);
    if (src.kind === "entity") {
      const a = hass.states[src.id].attributes;
      return {
        source: src, cond: hass.states[src.id].state, temp: a.temperature, unit: a.temperature_unit || "°",
        humidity: a.humidity, wind: a.wind_speed, windUnit: a.wind_speed_unit || "",
      };
    }
    this._loadOM(hass);
    if (!this.om?.current) return null;
    const c = this.om.current;
    return {
      source: src, cond: wmo(c.weather_code, c.is_day), temp: c.temperature_2m, unit: this.om.current_units?.temperature_2m || "°C",
      humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, windUnit: this.om.current_units?.wind_speed_10m || "km/h",
    };
  }

  /** { hourly: [{time, cond, temp, precip}], daily: [{time, cond, temp, low, precip}] } */
  async forecast(hass, pref) {
    const src = this.source(hass, pref);
    if (src.kind === "entity") {
      const get = async (type) => {
        try {
          const res = await hass.callWS({
            type: "call_service", domain: "weather", service: "get_forecasts",
            service_data: { type }, target: { entity_id: src.id }, return_response: true,
          });
          return res?.response?.[src.id]?.forecast || [];
        } catch {
          return [];
        }
      };
      const [hourly, daily] = await Promise.all([get("hourly"), get("daily")]);
      // some sources (e.g. IPMA) send -99 for "no data"
      const pct = (v) => (v == null || v < 0 ? null : v);
      const norm = (f) => ({ time: new Date(f.datetime), cond: f.condition, temp: f.temperature, low: f.templow, precip: pct(f.precipitation_probability) });
      if (hourly.length || daily.length) {
        return { hourly: hourly.filter((f) => new Date(f.datetime) >= Date.now() - 3600e3).slice(0, 12).map(norm), daily: daily.slice(0, 7).map(norm) };
      }
    }
    await this._loadOM(hass, true);
    const om = this.om;
    if (!om) return { hourly: [], daily: [] };
    const now = Date.now() - 3600e3;
    const hourly = (om.hourly?.time || []).map((tm, k) => ({
      time: new Date(tm), cond: wmo(om.hourly.weather_code[k]), temp: om.hourly.temperature_2m[k], precip: om.hourly.precipitation_probability?.[k],
    })).filter((f) => f.time >= now).slice(0, 12);
    const daily = (om.daily?.time || []).map((tm, k) => ({
      time: new Date(tm), cond: wmo(om.daily.weather_code[k]), temp: om.daily.temperature_2m_max[k], low: om.daily.temperature_2m_min[k],
      precip: om.daily.precipitation_probability_max?.[k],
    }));
    return { hourly, daily };
  }

  async _loadOM(hass, wait = false) {
    if (this.omLoading) { if (wait) await this.omLoading; return; }
    if (this.om && Date.now() - this.omAt < OM_TTL) return;
    const lat = hass.config?.latitude, lon = hass.config?.longitude;
    if (lat == null || lon == null) return;
    const f = hass.config?.unit_system?.temperature === "°F" ? "&temperature_unit=fahrenheit" : "";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + "&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m"
      + "&hourly=temperature_2m,weather_code,precipitation_probability"
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
      + `&timezone=auto&forecast_days=7${f}`;
    this.omLoading = fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) { this.om = j; this.omAt = Date.now(); this.onChange?.(); } })
      .catch((e) => console.warn("Pine3 Homeview: Open-Meteo", e))
      .finally(() => { this.omLoading = false; });
    if (wait) await this.omLoading;
  }
}
