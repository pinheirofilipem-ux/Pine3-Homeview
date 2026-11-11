// Pine3 Homeview - Edit mode: reorder, hide and resize cards.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { esc, dom } from "../const.js";
import { t } from "../i18n.js";
import { clone } from "../util.js";

export class EditMixin {

  // ---------- edit mode ----------
  _editBtn() {
    if (this._edit) return "";
    return `<div class="iconbtn" data-editstart title="${t("Editar")}"><ha-icon icon="mdi:pencil-outline"></ha-icon></div>`;
  }
  _startEdit() {
    const c = this._saved();
    const rooms = this._rooms();
    this._edit = {
      room_order: c.room_order?.length ? [...c.room_order] : rooms.map((r) => r.id),
      hidden_rooms: [...c.hidden_rooms], big_rooms: [...c.big_rooms], hidden: [...c.hidden],
      big_devices: [...c.big_devices], device_order: clone(c.device_order || {}),
      mosaic: clone(this._mosaicList(rooms, c)), favorites: [...this._favList(rooms, c)],
    };
    this._modal = null;
    this._render();
  }
  async _finishEdit(save = true) {
    const e = this._edit;
    this._edit = null;
    if (save && e) {
      if (this._model) Object.assign(this._model.settings, e);
      try { await this._persist(e); } catch (err) { console.error("Pine3 Homeview", err); }
    }
    this._render();
  }
  _editChrome(kind, key) {
    if (!this._edit) return "";
    const big = kind === "room" ? this._edit.big_rooms.includes(key) : this._edit.big_devices.includes(key);
    return `<button class="ed-x" data-edhide="${kind}|${esc(key)}" title="${t("Esconder")}">−</button>
      <button class="ed-big" data-edbig="${kind}|${esc(key)}" title="${big ? t("Tamanho normal") : t("Tamanho duplo")}"><ha-icon icon="mdi:arrow-${big ? "collapse" : "expand"}"></ha-icon></button>`;
  }
  _bindEdit(root) {
    const e = this._edit;
    const split = (v) => { const k = v.indexOf("|"); return [v.slice(0, k), v.slice(k + 1)]; };
    root.querySelectorAll("[data-edhide]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const [kind, key] = split(b.dataset.edhide);
      if (kind === "room") e.hidden_rooms = [...new Set([...e.hidden_rooms, key])];
      else e.hidden = [...new Set([...e.hidden, key])];
      this._render();
    }));
    root.querySelectorAll("[data-edbig]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const [kind, key] = split(b.dataset.edbig);
      const list = kind === "room" ? "big_rooms" : "big_devices";
      e[list] = e[list].includes(key) ? e[list].filter((x) => x !== key) : [...e[list], key];
      this._render();
    }));
    root.querySelectorAll("[data-edrestore]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.edrestore === "rooms") e.hidden_rooms = [];
      else {
        const ids = new Set(this._model?.rooms.find((r) => r.id === this._room)?.devices.map((d) => d.id) || []);
        e.hidden = e.hidden.filter((x) => !ids.has(x));
      }
      this._render();
    }));
    root.querySelector("[data-eddone]")?.addEventListener("click", () => this._finishEdit(true));
    root.querySelector("[data-edcancel]")?.addEventListener("click", () => this._finishEdit(false));
    root.querySelectorAll("[data-sortable]").forEach((c) => this._bindSortable(c));
    this._bindMosaicEdit(root);
    root.querySelectorAll("[data-edfav]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      e.favorites = e.favorites.filter((x) => x !== b.dataset.edfav);
      this._render();
    }));
    root.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => this._openModal("_pick:" + b.dataset.pick)));
  }
  _bindSortable(container) {
    const items = () => [...container.children].filter((c) => c.dataset.key);
    items().forEach((item) => {
      item.addEventListener("pointerdown", (ev) => {
        if (ev.target.closest("button")) return;
        ev.preventDefault();
        // listen on window: moving the item in the DOM would drop a pointer capture
        this._drag = true;
        item.classList.add("dragging");
        const move = (mv) => {
          const over = items().find((o) => {
            if (o === item) return false;
            const r = o.getBoundingClientRect();
            return mv.clientX >= r.left && mv.clientX <= r.right && mv.clientY >= r.top && mv.clientY <= r.bottom;
          });
          if (!over) return;
          const list = items();
          container.insertBefore(item, list.indexOf(over) > list.indexOf(item) ? over.nextSibling : over);
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
          item.classList.remove("dragging");
          this._drag = null;
          const keys = items().map((c) => c.dataset.key);
          const scope = container.dataset.sortable;
          if (scope === "rooms") {
            this._edit.room_order = [...keys, ...this._edit.room_order.filter((k) => !keys.includes(k))];
          } else if (scope === "mosaic") {
            const by = Object.fromEntries(this._edit.mosaic.map((x) => [x.id, x]));
            this._edit.mosaic = keys.map((k) => by[k]).filter(Boolean);
          } else if (scope === "favorites") {
            this._edit.favorites = keys;
          } else {
            // device order within one section of a room: slot the new order back into the room's full order
            const rid = scope.slice(4);
            const full = (this._rooms().find((r) => r.id === rid)?.ents || []).filter((k) => dom(k) !== "scene");
            const first = Math.min(...keys.map((k) => full.indexOf(k)).filter((n) => n >= 0));
            const rest = full.filter((k) => !keys.includes(k));
            const at = rest.filter((k) => full.indexOf(k) < first).length;
            this._edit.device_order = { ...this._edit.device_order, [rid]: [...rest.slice(0, at), ...keys, ...rest.slice(at)] };
          }
          this._render();
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      });
    });
  }
}
