// Pine3 Homeview - The settings screen: draft, sections and their controls.
// Methods of the panel element, mixed into it by pine3-homeview-panel.js.

import { THEMES, LIGHT_THEMES, VIVID_THEMES, AMBIENT_THEMES, CARD_COLORS, ACCENTS, DOCK_ITEMS, DEFAULTS, THEME_NAMES, esc, store } from "../const.js";
import { t, tp } from "../i18n.js";
import { planView, bindPlan } from "../plan2d.js";
import { FRONT_VERSION, clone, SAVER_STEPS } from "../util.js";

export class SettingsViewMixin {

  // ---------- settings ----------
  _openSettings(section) {
    if (section) this._section = section;
    const c = this._saved();
    if (!c.room_order?.length) c.room_order = this._rooms().map((r) => r.id);
    this._draft = clone(c);
    this._savedJson = JSON.stringify(this._draft);
    this._prevView = this._view === "settings" ? "home" : this._view;
    this._edit = null;
    this._modal = null;
    this._go("settings");
  }
  _closeSettings() { this._draft = null; this._go(this._prevView || "home"); }

  async _saveDraft() {
    const d = this._draft;
    this._theme = d.theme;
    store.set("theme", d.theme);
    try {
      await this._persist(d);
      if (this._model) this._model = await this._hass.callWS({ type: "pine3_homeview/home" });
      this._toast = t("Alterações guardadas");
    } catch (e) { console.error("Pine3 Homeview", e); this._toast = t("Não foi possível guardar"); }
    this._savedJson = JSON.stringify(d);
    this._render();
    setTimeout(() => { this._toast = null; this._render(); }, 1800);
  }

  _toggle(key, on, label, sub) {
    return `<div class="opt"><div><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</div><div class="tg ${on ? "on" : ""}" data-tg="${key}"><i></i></div></div>`;
  }
  _choice(key, value, options, label, sub) {
    return `<div class="opt col"><div><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</div><div class="seg">${options.map(([v, l]) =>
      `<button class="pill ${String(v) === String(value) ? "solid" : ""}" data-choice="${key}" data-val="${esc(v)}" data-type="${typeof v}">${l}</button>`).join("")}</div></div>`;
  }

  _settingsView() {
    const d = this._draft, sec = this._section || "look";
    const dirty = JSON.stringify(d) !== this._savedJson;
    const navItems = [
      ["look", "mdi:palette-outline", t("Aparência")], ["home", "mdi:home-outline", t("Início")], ["rooms", "mdi:view-grid-outline", t("Divisões")],
      ["entities", "mdi:format-list-checks", t("Entidades")], ["plan", "mdi:floor-plan", t("Planta 3D")],
      ["nav", "mdi:dock-bottom", t("Navegação")], ["system", "mdi:cog-outline", t("Sistema")],
    ];
    let main = "";
    if (sec === "look") {
      main = `<div class="panel glass"><div class="opts">
          ${this._choice("language", d.language, [["pt", "Português"], ["en", "English"]], t("Idioma"), t("Idioma de todo o painel."))}
          ${this._choice("layout", d.layout, [["grid", t("Grelha")], ["list", t("Lista")]], t("Disposição"), t("Como as divisões e os dispositivos aparecem."))}
          ${this._toggle("animations", d.animations !== false, t("Animações"), t("Transições ao mudar de ecrã, a lente da dock e a abertura dos cartões. Desliga para um painel mais leve."))}
        </div></div>
        <div class="panel glass">
          <div class="preview">
            <div class="rc on pv"><span class="pv-badge">2</span><div class="ri"><ha-icon icon="mdi:lightbulb-outline"></ha-icon></div>
              <div class="foot"><div class="nm">${t("Sala")}</div><div class="meta">75%</div><div class="pv-bar"><i></i></div></div></div>
            <div class="rc glass pv off"><div class="ri"><ha-icon icon="mdi:bed"></ha-icon></div>
              <div class="foot"><div class="nm">${t("Quarto")}</div><div class="meta">${t("Tudo desligado")}</div><div class="dots"><i></i><i class="on"></i><i></i></div></div></div>
          </div>
          <h3>${t("Cor dos cartões")}</h3><p>${t("Superfície suave dos cartões ligados.")}</p>
          <div class="swr">${CARD_COLORS.map((c) => `<div class="swc ${c === d.card_color ? "act" : ""}" data-card="${c}" style="background:${c}"></div>`).join("")}</div>
          <h3>${t("Cor de destaque")}</h3><p>${t("Ícones acesos, pontos das luzes, sliders e contadores.")}</p>
          <div class="swr">${ACCENTS.map((c) => `<div class="swc ${c === d.accent_color ? "act" : ""}" data-accent="${c}" style="background:${c}"></div>`).join("")}</div>
        </div>
        ${(() => {
          // themes: dark and light; automatic = one for the day and one for the night, by sunrise and sunset
          const keys = Object.keys(THEMES), dark = keys.filter((k) => !LIGHT_THEMES.has(k) && !VIVID_THEMES.has(k) && !AMBIENT_THEMES.has(k)), amb = keys.filter((k) => AMBIENT_THEMES.has(k)), vivid = keys.filter((k) => VIVID_THEMES.has(k)), lightK = keys.filter((k) => LIGHT_THEMES.has(k));
          const grid = (attr, cur, list) => `<div class="bgs">${list.map((k) => `<div class="bgc ${k === cur ? "act" : ""}" data-${attr}="${k}"><div style="background:${THEMES[k]}"></div><span>${t(THEME_NAMES[k])}</span></div>`).join("")}</div>`;
          const auto = d.appearance === "auto";
          const sun = this._s("sun.sun");
          return `<div class="panel glass"><h3 style="margin-top:0">${t("Fundo")}</h3><p>${t("O ambiente por trás dos cartões. Os fundos claros põem todo o painel em modo claro.")}</p>
            <div class="opts">${this._choice("appearance", auto ? "auto" : "fixed", [["fixed", t("Fixo")], ["auto", t("Automático")]], t("Modo"),
              auto ? (sun ? t("Usa o fundo de dia entre o nascer e o pôr do sol (sun.sun) e o de noite no resto do tempo.") : t("Sem a entidade sun.sun: usa o fundo de dia das 7h às 19h.")) : t("Um fundo sempre igual, ou um para o dia e outro para a noite, ao nascer e ao pôr do sol."))}</div>
            ${auto ? `<h3>${t("De dia")}</h3>${grid("themeday", d.theme_day || "linho", [...lightK, ...vivid, ...amb, ...dark])}<h3>${t("À noite")}</h3>${grid("themenight", d.theme_night || "ameixa", [...amb, ...dark, ...vivid, ...lightK])}`
              : `<h3>${t("Ambiente")}</h3>${grid("theme", d.theme, amb)}<h3>${t("Vivos")}</h3>${grid("theme", d.theme, vivid)}<h3>${t("Escuros")}</h3>${grid("theme", d.theme, dark)}<h3>${t("Claros")}</h3>${grid("theme", d.theme, lightK)}`}</div>`;
        })()}`;
    } else if (sec === "home") {
      const wxs = this._weather.entities(this._hass);
      main = `${this._facesSettings(d)}<div class="panel glass"><h3 style="margin-top:0">${t("Painel")}</h3><p>${t("O que o face Painel mostra.")}</p><div class="opts">
        ${this._toggle("show_weather", d.show_weather, t("Meteorologia"), t("Pílula com a temperatura e o estado do tempo. Toca nela para ver a previsão."))}
        ${this._choice("weather_entity", d.weather_entity, [["", t("Automático")], ...wxs.map((i) => [i, esc(this._s(i).attributes.friendly_name || i)]), ["open-meteo", "Open-Meteo"]],
          t("Fonte do tempo"), t("Automático usa a primeira entidade de tempo do Home Assistant ou, se não houver, a Open-Meteo para a localização da casa."))}
        ${this._toggle("show_people", d.show_people, t("Pessoas"), t("Quem está em casa."))}
        ${this._choice("home_layout", d.home_layout || "painel", [["painel", t("Painel")], ["top", t("Relógio grande")], ["columns", t("Duas colunas")], ["sidebar", t("Barra lateral")], ["classic", t("Clássica")]], t("Disposição do início"), t("Relógio grande com o estado da casa ao lado; duas colunas, com o relógio, o tempo e o que está ligado à esquerda e os cartões à direita; uma barra lateral de vidro com o relógio, o tempo e o estado, e as cenas e os cartões ao lado; ou a disposição original."))}
        ${this._toggle("show_status", d.show_status, t("Estado da casa"), t("Luzes acesas, outros aparelhos ligados e botões Acender/Apagar luzes."))}
        ${this._toggle("show_scenes", d.show_scenes, t("Cenas"), t("Faixa de cenas no início."))}
        ${this._toggle("show_summary", d.show_summary, t("Cartões de resumo"), t("Clima, Segurança e A tocar."))}
        ${this._toggle("clock_24h", d.clock_24h, t("Relógio de 24 horas"), t("Desliga para mostrar AM/PM."))}
      </div></div>
      <div class="panel glass"><h3 style="margin-top:0">${t("Este dispositivo")}</h3><p>${t("Opções guardadas só neste browser, para um tablet na parede ficar diferente do telemóvel.")}</p><div class="opts">
        ${this._localToggle("hide_sidebar", t("Esconder a barra lateral do Home Assistant"), t("O painel ocupa a largura toda. Também podes abrir o painel com ?kiosk no endereço."))}
        ${this._localToggle("wake_lock", t("Manter o ecrã ligado"), navigator.wakeLock ? t("Impede o ecrã de adormecer enquanto o painel está aberto.") : t("Este browser não suporta manter o ecrã ligado."), !navigator.wakeLock)}
        ${(() => {
          const modes = { full: t("3D completo"), lite: t("3D leve"), image: t("Imagem 3D"), plan: t("Planta 2D") };
          const hm = store.get("house_mode", "auto"), fx = store.get("lite_fx", "auto"), an = store.get("anim", "auto");
          return this._localChoice("house_mode", hm, [["auto", hm === "auto" ? t("Automático ({m})", { m: modes[this._houseMode()] }) : t("Automático")], ...Object.entries(modes)],
              t("Vista da Casa 3D"), t("Em tablets mais fracos, a Imagem 3D desenha a casa como uma imagem (leve e fluida) e a Planta 2D mostra-a vista de cima. O 3D leve mantém a vista atual sem os efeitos mais pesados."))
            + this._localChoice("lite_fx", fx, [["auto", fx === "auto" ? t("Automático ({m})", { m: this._liteFx() ? t("Ligado") : t("Desligado") }) : t("Automático")], ["on", t("Ligado")], ["off", t("Desligado")]],
              t("Efeitos leves"), t("Tira o desfoque do vidro (o mais pesado para a placa gráfica). Usa se vires zonas brancas, vazias ou a piscar."))
            + this._localChoice("anim", an, [["auto", t("Como no painel")], ["on", t("Ligadas")], ["off", t("Desligadas")]],
              t("Animações neste dispositivo"), t("Sobrepõe a opção Animações da Aparência só neste dispositivo."));
        })()}
        ${this._fsSupported() ? `<div class="opt"><div><b>${t("Ecrã inteiro")}</b><small>${t("Esconde as barras do browser. Também há um botão no topo do painel.")}</small></div><button class="pill" data-fs><ha-icon icon="mdi:fullscreen"></ha-icon>${document.fullscreenElement ? t("Sair do ecrã inteiro") : t("Ecrã inteiro")}</button></div>` : ""}
      </div></div>
      <div class="panel glass"><div class="opts">
        ${this._choice("screensaver", d.screensaver, SAVER_STEPS.map((m) => [m, m ? t("{n} min", { n: m }) : t("Desligado")]), t("Face ambiente depois de"), t("Sem toques durante este tempo, o painel mostra o face ambiente. Ideal para tablets na parede."))}
      </div></div>`;
    } else if (sec === "rooms") {
      const all = this._model?.rooms || this._localRooms();
      const byId = Object.fromEntries(all.map((r) => [r.id, r]));
      const order = [...d.room_order.filter((i) => byId[i]), ...all.map((r) => r.id).filter((i) => !d.room_order.includes(i))];
      const hiddenDev = this._model ? all.flatMap((r) => r.devices.filter((x) => d.hidden.includes(x.id)).map((x) => ({ ...x, room: this._roomName(r) }))) : [];
      const size = (id) => d.house_size?.[id] || 0;
      main = `<div class="panel glass"><h3 style="margin-top:0">${t("Divisões")}</h3><p>${t("Criadas automaticamente a partir das áreas do Home Assistant. Ordena, esconde e escolhe o tamanho de cada uma na Casa 3D.")}</p>
        <div class="list big">${order.map((id, k) => { const r = byId[id], vis = !d.hidden_rooms.includes(id); return `<div class="it">
          <div class="ri sm"><ha-icon icon="${r.icon || "mdi:home-outline"}"></ha-icon></div><span>${esc(this._roomName(r))} <small>${tp((r.devices || r.ents).length, "{n} dispositivo", "{n} dispositivos")}</small></span>
          <div class="seg sm" title="${t("Tamanho na Casa 3D")}">${[[0, "A"], [1, "P"], [2, "M"], [3, "G"]].map(([v, l]) => `<button class="mini ${size(id) === v ? "on" : ""}" data-size="${esc(id)}:${v}">${t(l)}</button>`).join("")}</div>
          <button class="mini" data-move="${k}:-1" ${k === 0 ? "disabled" : ""}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
          <button class="mini" data-move="${k}:1" ${k === order.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
          <div class="tg ${vis ? "on" : ""}" data-roomvis="${esc(id)}"><i></i></div></div>`; }).join("")}</div>
        <p style="margin:14px 0 0;font-size:14px">${t("Tamanho na Casa 3D: A = automático, P = pequeno, M = médio, G = grande. Os pisos vêm dos pisos do Home Assistant.")}</p></div>
        ${hiddenDev.length ? `<div class="panel glass"><h3 style="margin-top:0">${t("Dispositivos escondidos")}</h3><p>${t("Escondidos no modo de edição ou na folha de detalhe.")}</p><div class="list big">${hiddenDev.map((x) => `<div class="it"><span>${esc(x.name)} <small>${esc(x.room)}</small></span><button class="pill" data-unhide="${esc(x.id)}">${t("Mostrar")}</button></div>`).join("")}</div></div>` : ""}`;
      this._order = order;
    } else if (sec === "entities") {
      main = this._entitiesSection(d);
    } else if (sec === "plan") {
      main = planView(this, d, this._planRooms());
    } else if (sec === "nav") {
      main = `<div class="panel glass"><h3 style="margin-top:0">${t("Dock")}</h3><p>${t("Botões da barra de navegação. A Casa está sempre presente.")}</p><div class="opts">
        ${DOCK_ITEMS.filter(([k]) => k !== "home").map(([k, , label, sub]) => this._toggle("dock:" + k, d.dock.includes(k), t(label), t(sub))).join("")}
      </div></div>`;
    } else {
      const rooms = this._model?.rooms || [];
      const devs = rooms.reduce((a, r) => a + r.devices.length, 0);
      main = `<div class="panel glass"><h3 style="margin-top:0">${t("Sistema")}</h3><div class="facts">
          <div><small>${t("Versão")}</small><b>${esc(this._model?.version || "—")}${FRONT_VERSION && this._model?.version && FRONT_VERSION !== this._model.version ? ` · ${esc(t("painel {v}", { v: FRONT_VERSION }))}` : ""}</b></div>
          <div><small>${t("Modo")}</small><b>${this._model ? t("Integração") : t("Local (sem API)")}</b></div>
          <div><small>${t("Divisões")}</small><b>${rooms.length || this._localRooms().length}</b></div>
          <div><small>${t("Dispositivos")}</small><b>${devs || "—"}</b></div>
        </div>
        <div class="row" style="justify-content:flex-start;margin-top:22px">
          <button class="pill" data-rebuild><ha-icon icon="mdi:refresh"></ha-icon>${t("Reconstruir agora")}</button>
          <button class="pill" data-reset><ha-icon icon="mdi:backup-restore"></ha-icon>${t("Repor predefinições")}</button>
          <a class="pill" href="/config/integrations/integration/pine3_homeview" target="_top"><ha-icon icon="mdi:open-in-new"></ha-icon>${t("Integração no HA")}</a>
        </div></div>`;
    }
    return `<div class="set">
      <div class="set-hd"><div><div class="eyebrow">Pine3 Homeview</div><div class="t">${t("Definições")}</div><div class="s">${t("Aparência, ecrã inicial, divisões e navegação.")}</div></div>
        <div class="actions"><button class="pill ${dirty ? "solid" : "dim"}" data-save ${dirty ? "" : "disabled"}><ha-icon icon="mdi:check"></ha-icon>${t("Guardar alterações")}</button>
        <div class="iconbtn" data-closeset title="${t("Fechar")}"><ha-icon icon="mdi:close"></ha-icon></div></div></div>
      <div class="set-body"><nav class="set-nav">${navItems.map(([k, icon, label]) => `<button class="${k === sec ? "act" : ""}" data-sec="${k}"><span class="ni"><ha-icon icon="${icon}"></ha-icon></span>${label}</button>`).join("")}</nav>
        <div class="set-main">${main}</div></div>
      ${this._toast ? `<div class="toast">${esc(this._toast)}</div>` : ""}
    </div>`;
  }

  _planRooms() {
    if (this._model) return this._model.rooms.map((r) => ({ ...r, count: r.devices.length }));
    return this._localRooms();
  }

  _entShown(d, e) { return e.primary ? !d.hidden.includes(e.id) : d.shown.includes(e.id) && !d.hidden.includes(e.id); }

  _entitiesSection(d) {
    if (!this._model) return `<div class="panel glass"><p>${t("Esta secção precisa da integração Pine3 Homeview instalada.")}</p></div>`;
    const q = (this._entQ || "").trim().toLowerCase();
    const tag = (e) => (e.primary ? t("Principal") : e.category ? t("Diagnóstico") : e.ha_hidden ? t("Escondida no HA") : t("Secundária"));
    const groups = this._model.rooms.map((r) => {
      const all = r.entities || [];
      const list = all.filter((e) => (this._entAll || (!e.category && !e.ha_hidden) || this._entShown(d, e))
        && (!q || e.name.toLowerCase().includes(q) || e.id.includes(q)));
      if (!list.length) return "";
      const n = all.filter((e) => this._entShown(d, e)).length;
      return `<div class="panel glass"><h3 style="margin-top:0;display:flex;align-items:center;gap:10px"><ha-icon icon="${r.icon || "mdi:home-outline"}"></ha-icon>${esc(this._roomName(r))}
          <small style="font-size:14px;color:var(--muted);font-family:inherit">${t("{a} de {b} visíveis", { a: n, b: all.length })}</small></h3>
        <div class="list big">${list.map((e) => `<div class="it ${this._entShown(d, e) ? "" : "off"}">
          <ha-icon icon="${this._s(e.id) ? this._icon(e.id) : "mdi:help-circle-outline"}"></ha-icon>
          <span>${esc(e.name)} <small>${esc(e.id)}</small></span><em class="tag ${e.primary ? "pri" : ""}">${tag(e)}</em>
          <div class="tg ${this._entShown(d, e) ? "on" : ""}" data-enttg="${esc(e.id)}" data-primary="${e.primary ? 1 : 0}"><i></i></div></div>`).join("")}</div></div>`;
    }).join("");
    return `<div class="panel glass"><h3 style="margin-top:0">${t("Entidades")}</h3>
        <p>${t("Escolhe o que aparece no painel. As entidades principais são os mosaicos criados automaticamente; as secundárias (por exemplo, o interruptor de uma TV ou o sensor de potência de uma tomada) podes mostrá-las como mosaicos próprios.")}</p>
        <input class="search" data-entq type="search" placeholder="${t("Procurar entidades…")}" value="${esc(this._entQ || "")}">
        <div class="opts" style="margin-top:8px">${this._toggle("_entall", !!this._entAll, t("Mostrar diagnóstico e escondidas no HA"), t("Inclui entidades de diagnóstico, de configuração e as escondidas no Home Assistant."))}</div>
      </div>${groups || `<div class="empty">${t("Nenhuma entidade encontrada.")}</div>`}`;
  }

  _bindSettings() {
    const root = this.shadowRoot, d = this._draft;
    if (!d) return;
    if (this._section === "plan") bindPlan(this, root, d, this._planRooms());
    const q = root.querySelector("[data-entq]");
    if (q) {
      q.addEventListener("input", () => { this._entQ = q.value; this._entFocus = true; this._render(); });
      q.addEventListener("blur", () => { this._entFocus = false; });
    }
    root.querySelectorAll("[data-enttg]").forEach((el) => el.addEventListener("click", () => {
      const id = el.dataset.enttg, primary = el.dataset.primary === "1";
      const e = this._model.rooms.flatMap((r) => r.entities || []).find((x) => x.id === id);
      const on = this._entShown(d, e);
      if (primary) d.hidden = on ? [...d.hidden, id] : d.hidden.filter((x) => x !== id);
      else if (on) d.shown = d.shown.filter((x) => x !== id);
      else { d.shown = [...new Set([...d.shown, id])]; d.hidden = d.hidden.filter((x) => x !== id); }
      this._render();
    }));
    const on = (sel, fn) => root.querySelectorAll(sel).forEach((el) => el.addEventListener("click", (ev) => fn(el, ev)));
    const upd = () => this._render();
    on("[data-sec]", (el) => { this._section = el.dataset.sec; upd(); });
    if (this._section === "home") this._bindFacesSettings(root, d, upd);
    on("[data-fs]", () => this._toggleFullscreen());
    on("[data-local]", (el) => {
      const k = el.dataset.local, v = !store.get(k, false);
      store.set(k, v);
      if (k === "hide_sidebar") this._dockSidebar(v);
      if (k === "wake_lock") { if (v) this._applyWakeLock(); else { this._wake?.release?.().catch(() => {}); this._wake = null; } }
      upd();
    });
    on("[data-lchoice]", (el) => { store.set(el.dataset.lchoice, el.dataset.val); upd(); });
    on("[data-closeset]", () => this._closeSettings());
    on("[data-save]", () => this._saveDraft());
    on("[data-card]", (el) => { d.card_color = el.dataset.card; upd(); });
    on("[data-accent]", (el) => { d.accent_color = el.dataset.accent; upd(); });
    on("[data-theme]", (el) => { d.theme = el.dataset.theme; upd(); });
    on("[data-themeday]", (el) => { d.theme_day = el.dataset.themeday; upd(); });
    on("[data-themenight]", (el) => { d.theme_night = el.dataset.themenight; upd(); });
    on("[data-choice]", (el) => { d[el.dataset.choice] = el.dataset.type === "number" ? Number(el.dataset.val) : el.dataset.val; upd(); });
    on("[data-tg]", (el) => {
      const k = el.dataset.tg;
      if (k === "_entall") { this._entAll = !this._entAll; upd(); return; }
      if (k.startsWith("dock:")) { const it = k.slice(5); d.dock = d.dock.includes(it) ? d.dock.filter((x) => x !== it) : DOCK_ITEMS.map(([x]) => x).filter((x) => x === it || d.dock.includes(x)); }
      else d[k] = !d[k];
      upd();
    });
    on("[data-roomvis]", (el) => { const id = el.dataset.roomvis; d.hidden_rooms = d.hidden_rooms.includes(id) ? d.hidden_rooms.filter((x) => x !== id) : [...d.hidden_rooms, id]; upd(); });
    on("[data-size]", (el) => {
      const [id, v] = el.dataset.size.split(/:(?=\d$)/);
      d.house_size = { ...(d.house_size || {}) };
      if (Number(v)) d.house_size[id] = Number(v); else delete d.house_size[id];
      upd();
    });
    on("[data-move]", (el) => {
      const [k, dir] = el.dataset.move.split(":").map(Number), o = [...this._order], j = k + dir;
      if (j < 0 || j >= o.length) return;
      [o[k], o[j]] = [o[j], o[k]];
      // keep the summary cards (keys "@…") where they were in the home order
      const full = [...d.room_order];
      let n = 0;
      d.room_order = full.map((x) => (x.startsWith("@") ? x : o[n++])).filter(Boolean).concat(o.slice(n));
      upd();
    });
    on("[data-unhide]", (el) => { d.hidden = d.hidden.filter((x) => x !== el.dataset.unhide); upd(); });
    on("[data-reset]", () => { const keepLang = d.language; Object.assign(d, clone(DEFAULTS)); d.language = keepLang; d.room_order = (this._model?.rooms || []).map((r) => r.id); upd(); });
    on("[data-rebuild]", async () => { if (this._model) { this._model = await this._hass.callWS({ type: "pine3_homeview/home" }); this._toast = t("Casa reconstruída"); upd(); setTimeout(() => { this._toast = null; upd(); }, 1500); } });
  }
}
