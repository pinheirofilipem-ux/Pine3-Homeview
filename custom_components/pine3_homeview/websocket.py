"""Websocket API and registry listeners for Pine3 Homeview."""

from __future__ import annotations

import asyncio
import time
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store

from .const import DOMAIN, EVENT_UPDATED, VERSION
from .discovery import build_home

STORAGE_KEY = f"{DOMAIN}.settings"
DEFAULT_SETTINGS: dict[str, Any] = {
    "hidden": [],
    "hidden_rooms": [],
    "room_order": [],
    "theme": "ameixa",
    "appearance": "fixed",
    "theme_day": "linho",
    "theme_night": "ameixa",
    "card_color": "#f5efe1",
    "accent_color": "#f6b83f",
    "clock_24h": True,
    "animations": True,
    "show_weather": True,
    "show_people": True,
    "show_status": True,
    "show_scenes": True,
    "show_summary": True,
    "dock": ["home", "rooms", "house", "scenes"],
    "language": "pt",
    "layout": "grid",
    "home_layout": "painel",
    "weather_entity": "",
    "screensaver": 5,
    "faces": ["painel", "mosaico", "mosaico_plus", "agenda", "relogio"],
    "start_face": "painel",
    "ambient_face": "relogio",
    "favorites": None,  # None: picked automatically until the user saves a list
    "mosaic": None,  # None: filled automatically until the user saves a list
    "mosaic_plus": None,
    "calendars": None,  # None: every calendar entity
    "todo_list": "",  # "": the first todo entity, "none": no reminders
    "big_rooms": [],
    "big_devices": [],
    "device_order": {},
    "house_size": {},
    "house_layout": {},
    "shown": [],
    "placements": {},
    "wall_height": 30,
    "settings_version": 2,
}
FACE_IDS = ["painel", "mosaico", "mosaico_plus", "agenda", "relogio", "fluxo"]
DOCK_ITEMS = ["home", "rooms", "house", "scenes", "climate", "security"]
DEVICE_TYPES = [
    "ceiling", "lamp", "led", "spot", "bulb", "tv", "appletv", "homepod", "speaker", "ac", "fan", "purifier",
    "blind", "door", "window", "plug", "sensor", "motion", "camera", "lock", "vacuum", "other",
]
COLOR = vol.Match(r"^#[0-9a-fA-F]{6}$")
MOSAIC = vol.Any(None, vol.All([{vol.Required("id"): str, vol.Required("size"): vol.In(["s", "m", "l"])}], vol.Length(max=48)))
REGISTRY_EVENTS = (
    "area_registry_updated",
    "device_registry_updated",
    "entity_registry_updated",
    "floor_registry_updated",
)


async def async_setup_api(hass: HomeAssistant) -> None:
    store: Store = Store(hass, 1, STORAGE_KEY)
    stored = await store.async_load() or {}
    settings = {**DEFAULT_SETTINGS, **stored}
    if stored and stored.get("settings_version", 1) < 2:
        # v0.5 adds the 3D Home: show it in the dock of existing installs once.
        if "house" not in settings["dock"]:
            settings["dock"] = [d for d in DOCK_ITEMS if d in settings["dock"] or d == "house"]
        settings["settings_version"] = 2
        await store.async_save(settings)
    hass.data[DOMAIN] = {"store": store, "settings": settings, "unsubs": []}

    websocket_api.async_register_command(hass, ws_home)
    websocket_api.async_register_command(hass, ws_settings)
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_ipma_warnings)

    pending: list = []

    @callback
    def _fire(_now=None) -> None:
        pending.clear()
        hass.bus.async_fire(EVENT_UPDATED)

    @callback
    def _changed(_event: Event) -> None:
        # Registries change in bursts (e.g. a new integration): debounce.
        if not pending:
            pending.append(async_call_later(hass, 2, _fire))

    for ev in REGISTRY_EVENTS:
        hass.data[DOMAIN]["unsubs"].append(hass.bus.async_listen(ev, _changed))


@callback
def async_unload_api(hass: HomeAssistant) -> None:
    for unsub in hass.data.get(DOMAIN, {}).get("unsubs", []):
        unsub()
    hass.data.pop(DOMAIN, None)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/home"})
@callback
def ws_home(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    connection.send_result(msg["id"], _model(hass))


def _model(hass: HomeAssistant) -> dict[str, Any]:
    return {**build_home(hass, hass.data[DOMAIN]["settings"]), "version": VERSION}


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Push a fresh home model whenever the registries or settings change."""

    @callback
    def _forward(_event: Event) -> None:
        if DOMAIN in hass.data:
            connection.send_message(
                websocket_api.event_message(msg["id"], _model(hass))
            )

    connection.subscriptions[msg["id"]] = hass.bus.async_listen(EVENT_UPDATED, _forward)
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/settings",
        vol.Optional("hidden"): [str],
        vol.Optional("hidden_rooms"): [str],
        vol.Optional("room_order"): [str],
        vol.Optional("theme"): str,
        vol.Optional("appearance"): vol.In(["fixed", "auto"]),
        vol.Optional("theme_day"): str,
        vol.Optional("theme_night"): str,
        vol.Optional("card_color"): COLOR,
        vol.Optional("accent_color"): COLOR,
        vol.Optional("clock_24h"): bool,
        vol.Optional("animations"): bool,
        vol.Optional("show_weather"): bool,
        vol.Optional("show_people"): bool,
        vol.Optional("show_status"): bool,
        vol.Optional("show_scenes"): bool,
        vol.Optional("show_summary"): bool,
        vol.Optional("dock"): [vol.In(DOCK_ITEMS)],
        vol.Optional("language"): vol.In(["pt", "en"]),
        vol.Optional("layout"): vol.In(["grid", "list"]),
        vol.Optional("home_layout"): vol.In(["painel", "classic", "top", "columns", "sidebar"]),
        vol.Optional("weather_entity"): vol.Any("", "open-meteo", vol.Match(r"^weather\.[a-z0-9_]+$")),
        vol.Optional("screensaver"): vol.All(int, vol.Range(min=0, max=240)),
        vol.Optional("faces"): vol.All([vol.In(FACE_IDS)], vol.Length(min=1)),
        vol.Optional("start_face"): vol.In(FACE_IDS),
        vol.Optional("ambient_face"): vol.In(FACE_IDS),
        vol.Optional("favorites"): vol.Any(None, vol.All([str], vol.Length(max=48))),
        vol.Optional("mosaic"): MOSAIC,
        vol.Optional("mosaic_plus"): MOSAIC,
        vol.Optional("calendars"): vol.Any(None, [vol.Match(r"^calendar\.[a-z0-9_]+$")]),
        vol.Optional("todo_list"): vol.Any("", "none", vol.Match(r"^todo\.[a-z0-9_]+$")),
        vol.Optional("big_rooms"): [str],
        vol.Optional("big_devices"): [str],
        vol.Optional("device_order"): {str: [str]},
        vol.Optional("house_size"): {str: vol.In([1, 2, 3])},
        vol.Optional("house_layout"): {
            str: {
                vol.Required("f"): vol.All(int, vol.Range(min=-5, max=20)),
                vol.Required("x"): vol.All(int, vol.Range(min=0, max=60)),
                vol.Required("y"): vol.All(int, vol.Range(min=0, max=60)),
                vol.Required("w"): vol.All(int, vol.Range(min=1, max=30)),
                vol.Required("d"): vol.All(int, vol.Range(min=1, max=30)),
                # free-shape rooms: the grid cells they cover
                vol.Optional("cells"): vol.All(
                    [vol.All([vol.All(int, vol.Range(min=0, max=60))], vol.Length(min=2, max=2))],
                    vol.Length(min=1, max=1000),
                ),
            }
        },
        vol.Optional("shown"): [str],
        vol.Optional("wall_height"): vol.All(int, vol.Range(min=8, max=120)),
        # entities placed on the floor plan: floor, position in grid units, optional device type
        vol.Optional("placements"): {
            str: {
                vol.Required("f"): vol.All(int, vol.Range(min=-5, max=20)),
                vol.Required("x"): vol.All(vol.Coerce(float), vol.Range(min=0, max=60)),
                vol.Required("y"): vol.All(vol.Coerce(float), vol.Range(min=0, max=60)),
                vol.Optional("t"): vol.In(DEVICE_TYPES),
                # LED strips: angle in degrees and length in grid units
                vol.Optional("r"): vol.All(vol.Coerce(float), vol.Range(min=0, max=360)),
                vol.Optional("l"): vol.All(vol.Coerce(float), vol.Range(min=0.25, max=30)),
            }
        },
        vol.Optional("settings_version"): int,
    }
)
@websocket_api.async_response
async def ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    data = hass.data[DOMAIN]
    for key in DEFAULT_SETTINGS:
        if key in msg:
            data["settings"][key] = msg[key]
    await data["store"].async_save(data["settings"])
    hass.bus.async_fire(EVENT_UPDATED)
    connection.send_result(msg["id"], data["settings"])


# IPMA (Portuguese weather service): the HA integration exposes only the first warning of an area,
# so the panel asks for all of them here (server side: no CORS, one download for every panel).
IPMA_WARNINGS_URL = "https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json"
IPMA_TTL = 600  # seconds
IPMA_FIELDS = ("text", "awarenessTypeName", "awarenessLevelID", "startTime", "endTime")


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/ipma_warnings", vol.Required("area"): str})
@websocket_api.async_response
async def ws_ipma_warnings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    cache = hass.data.setdefault(f"{DOMAIN}_ipma", {})
    if cache.get("raw") is None or time.monotonic() - cache.get("at", 0) > IPMA_TTL:
        try:
            async with asyncio.timeout(10):
                resp = await async_get_clientsession(hass).get(IPMA_WARNINGS_URL)
                resp.raise_for_status()
                raw = await resp.json(content_type=None)
            if isinstance(raw, list):
                cache.update(raw=raw, at=time.monotonic())
        except Exception as err:  # noqa: BLE001 - network or format: keep the last list if there is one
            if cache.get("raw") is None:
                connection.send_error(msg["id"], "unavailable", str(err))
                return
    warnings = [
        {k: w.get(k) for k in IPMA_FIELDS}
        for w in cache.get("raw") or []
        if isinstance(w, dict) and w.get("idAreaAviso") == msg["area"] and w.get("awarenessLevelID") not in (None, "green")
    ]
    connection.send_result(msg["id"], {"warnings": warnings})
