// Pine3 Homeview - the agenda: calendar events and reminders from Home Assistant (calendar.* and
// todo.* entities, e.g. iCloud calendars through the CalDAV integration), the "Relógio e agenda" face,
// and the agenda and now-playing widgets of the Mosaico faces.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { WEATHER_ICON, esc, dom } from "../const.js";
import { t, tp, num, locale } from "../i18n.js";
import { cap } from "../util.js";
import { analogClock } from "./mosaic.js";

const REFRESH = 10 * 60e3; // events and reminders are fetched again after 10 minutes
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
/** A calendar date ("2026-11-11") or date-time, as a local Date. */
const asDate = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v));

export class AgendaMixin {

  /** Calendars to show: the chosen ones, or every calendar.* entity. */
  _calendars(cfg = this._cfg()) {
    const all = Object.keys(this._hass.states).filter((i) => dom(i) === "calendar");
    return Array.isArray(cfg.calendars) ? cfg.calendars.filter((i) => all.includes(i)) : all;
  }
  _todoList(cfg = this._cfg()) {
    const all = Object.keys(this._hass.states).filter((i) => dom(i) === "todo");
    return all.includes(cfg.todo_list) ? cfg.todo_list : cfg.todo_list === "none" ? null : all[0] || null;
  }

  /**
   * Events of this month (and the next 7 days) and open reminders, cached and refreshed in the background.
   * Returns { events: [{title, start, end, allDay, cal}], todos: [{title, due}] } or null while loading.
   */
  _agenda() {
    const c = this._agendaCache, cals = this._calendars(), todo = this._todoList();
    const key = `${cals.join(",")}|${todo}`;
    if ((!c || c.key !== key || Date.now() - c.at > REFRESH) && !this._agendaLoading) {
      this._agendaLoading = true;
      const now = new Date(), from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(Math.max(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(), now.getTime() + 8 * 86400e3));
      const call = (domain, service, target, data) => this._hass.callWS({ type: "call_service", domain, service, target: { entity_id: target }, service_data: data, return_response: true })
        .then((r) => r?.response || {});
      const evs = cals.length ? call("calendar", "get_events", cals, { start_date_time: from.toISOString(), end_date_time: to.toISOString() }).catch((e) => { console.warn("Pine3 Homeview: calendar", e); return {}; }) : Promise.resolve({});
      const tds = todo ? call("todo", "get_items", todo, { status: ["needs_action"] }).catch((e) => { console.warn("Pine3 Homeview: todo", e); return {}; }) : Promise.resolve({});
      Promise.all([evs, tds]).then(([er, tr]) => {
        const events = Object.entries(er).flatMap(([cal, v]) => (v?.events || []).map((e) => ({
          title: e.summary || t("Sem título"), start: asDate(e.start), end: asDate(e.end), allDay: /^\d{4}-\d{2}-\d{2}$/.test(e.start), cal,
        }))).filter((e) => !isNaN(e.start)).sort((a, b) => a.start - b.start);
        const todos = Object.values(tr).flatMap((v) => v?.items || []).filter((i) => i.status !== "completed")
          .map((i) => ({ title: i.summary || "", due: i.due ? asDate(i.due) : null }))
          .sort((a, b) => (a.due ? a.due.getTime() : Infinity) - (b.due ? b.due.getTime() : Infinity));
        this._agendaCache = { key, at: Date.now(), events, todos };
      }).finally(() => { this._agendaLoading = false; if (this._view === "home" && !this._drag) this._render(); });
    }
    return c && c.key === key ? c : null;
  }

  /** Today's events that haven't ended, then reminders due today or overdue (or without a date). */
  _todayItems(max = 5) {
    const a = this._agenda();
    if (!a) return null;
    const now = new Date(), today = dayKey(now), end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const events = a.events.filter((e) => e.start < end && e.end > now && (e.allDay ? dayKey(e.start) === today || e.start <= now : true));
    const todos = a.todos.filter((x) => !x.due || x.due < end);
    return { events: events.slice(0, max), todos: todos.slice(0, Math.max(0, max - Math.min(events.length, max))), moreEvents: Math.max(0, events.length - max), overdue: todos.filter((x) => x.due && x.due < new Date(now.getFullYear(), now.getMonth(), now.getDate())).length };
  }

  _timeRange(e) {
    if (e.allDay) return t("Todo o dia");
    const f = (d) => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    return `${f(e.start)} – ${f(e.end)}`;
  }

  /** Sunrise and sunset from sun.sun (the next ones). */
  _sunTimes() {
    const a = this._s("sun.sun")?.attributes;
    if (!a) return null;
    const f = (v) => (v ? new Date(v).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }) : "–");
    return { rise: f(a.next_rising), set: f(a.next_setting), up: this._s("sun.sun").state === "above_horizon" };
  }

  /** The media player to show: the one playing, else the one paused. */
  _activeMedia() {
    const ids = Object.keys(this._hass.states).filter((i) => dom(i) === "media_player");
    return ids.find((i) => this._s(i).state === "playing") || ids.find((i) => this._s(i).state === "paused") || null;
  }
  /** Settings → Home: which calendars and which reminders list. */
  _agendaSettings(d) {
    const cals = Object.keys(this._hass.states).filter((i) => dom(i) === "calendar");
    const todos = Object.keys(this._hass.states).filter((i) => dom(i) === "todo");
    const on = Array.isArray(d.calendars) ? d.calendars : cals;
    const name = (i) => esc(this._s(i)?.attributes.friendly_name || i);
    return `<div class="panel glass"><h3 style="margin-top:0">${t("Agenda")}</h3>
      <p>${t("Eventos de hoje e lembretes no face Relógio e agenda e no Mosaico+. O iCloud entra no Home Assistant com a integração CalDAV.")}</p>
      ${cals.length ? `<div class="opts">${cals.map((i) => `<div class="opt"><div><b>${name(i)}</b><small>${esc(i)}</small></div><div class="tg ${on.includes(i) ? "on" : ""}" data-caltg="${esc(i)}"><i></i></div></div>`).join("")}</div>`
        : `<p><b>${t("Ainda não há calendários no Home Assistant.")}</b></p>`}
      <div class="opts">${this._choice("todo_list", d.todo_list || "", [["", t("Automático")], ...todos.map((i) => [i, name(i)]), ["none", t("Nenhuma")]],
        t("Lista de lembretes"), todos.length ? t("Lembretes por fazer, de hoje ou atrasados.") : t("Sem listas de tarefas (todo) no Home Assistant."))}</div>
    </div>`;
  }
  _bindAgendaSettings(root, d, upd) {
    root.querySelectorAll("[data-caltg]").forEach((el) => el.addEventListener("click", () => {
      const all = Object.keys(this._hass.states).filter((i) => dom(i) === "calendar");
      const on = Array.isArray(d.calendars) ? d.calendars : all;
      const id = el.dataset.caltg;
      d.calendars = on.includes(id) ? on.filter((x) => x !== id) : all.filter((x) => x === id || on.includes(x));
      upd();
    }));
  }
}
