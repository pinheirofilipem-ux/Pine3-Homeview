"""Builds the Pine3 Homeview home model automatically from Home Assistant's registries.

Areas -> devices -> entities. Each device becomes one tile, driven by its most
useful ("primary") entity; the device's other entities become extras (power,
battery, humidity...) shown on that tile instead of cluttering the room.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

try:  # floors exist from HA 2024.4
    from homeassistant.helpers import floor_registry as fr
except ImportError:  # pragma: no cover
    fr = None

# Lower number = better candidate for a device's primary entity.
PRIMARY_RANK = {
    "climate": 0, "media_player": 1, "vacuum": 2, "cover": 3, "lock": 4, "light": 5,
    "fan": 6, "camera": 7, "switch": 8, "input_boolean": 9, "button": 10,
    "binary_sensor": 20, "sensor": 21,
}
SUPPORTED = set(PRIMARY_RANK) | {"scene", "script"}
ROOM_CLIMATE = {"temperature", "humidity"}
AIR_QUALITY = ["pm25", "pm10", "pm1", "aqi", "carbon_dioxide", "volatile_organic_compounds", "volatile_organic_compounds_parts"]
EXTRA_SENSOR_CLASSES = {"power", "energy", "battery", "temperature", "humidity", "illuminance", *AIR_QUALITY}
SENSOR_PRIORITY = ["temperature", "humidity", *AIR_QUALITY, "illuminance", "power", "energy", "battery"]
# Everything a device can expose on its detail card (readings and controls), beyond the tile domains.
MEMBER_DOMAINS = {"sensor", "binary_sensor", "switch", "light", "fan", "select", "number", "button", "cover", "lock", "climate", "media_player", "vacuum", "input_boolean", "image"}
BINARY_PRIORITY = ["door", "window", "garage_door", "opening", "motion", "occupancy", "presence", "moisture", "smoke", "gas"]

# Room icon from the area name (pt + en keywords, accent-insensitive).
ROOM_ICONS = [
    (("casa de banho", "wc", "banho", "bathroom", "lavabo"), "mdi:shower"),
    (("cozinha", "kitchen"), "mdi:silverware-fork-knife"),
    (("sala de jantar", "jantar", "dining"), "mdi:table-chair"),
    (("sala", "living", "estar"), "mdi:sofa"),
    (("quarto", "suite", "bedroom", "dormitorio"), "mdi:bed"),
    (("crianca", "bebe", "kids", "nursery", "filho", "filha"), "mdi:teddy-bear"),
    (("escritorio", "office", "estudo", "study"), "mdi:desk"),
    (("garagem", "garage"), "mdi:garage"),
    (("jardim", "garden", "quintal", "exterior", "outdoor", "patio"), "mdi:flower"),
    (("varanda", "terraco", "balcony", "terrace"), "mdi:balcony"),
    (("piscina", "pool"), "mdi:pool"),
    (("lavandaria", "laundry", "arrumos", "despensa"), "mdi:washing-machine"),
    (("entrada", "hall", "corredor", "hallway", "entry"), "mdi:door"),
    (("ginasio", "gym"), "mdi:dumbbell"),
    (("cave", "basement", "sotao", "attic"), "mdi:stairs"),
]


def _fold(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in text if not unicodedata.combining(c)).lower()


def room_icon(name: str, explicit: str | None) -> str:
    if explicit:
        return explicit
    folded = _fold(name)
    for words, icon in ROOM_ICONS:
        if any(re.search(rf"\b{re.escape(w)}\b", folded) for w in words):
            return icon
    return "mdi:home-outline"


def _strip_prefix(name: str, *prefixes: str | None) -> str:
    """'Sala Candeeiro de pé' in area 'Sala' -> 'Candeeiro de pé'."""
    for prefix in prefixes:
        if not prefix:
            continue
        if _fold(name).startswith(_fold(prefix) + " ") and len(name) > len(prefix) + 1:
            rest = name[len(prefix):].lstrip(" -–:")
            return rest[:1].upper() + rest[1:]
    return name


def _sensor_class(hass: HomeAssistant, entity_id: str, entry: er.RegistryEntry | None) -> str | None:
    state = hass.states.get(entity_id)
    if state and state.attributes.get("device_class"):
        return state.attributes["device_class"]
    if entry:
        return entry.device_class or entry.original_device_class
    return None


def _rank(hass: HomeAssistant, entity_id: str, entry: er.RegistryEntry | None) -> tuple:
    domain = entity_id.split(".")[0]
    base = PRIMARY_RANK.get(domain, 99)
    sub = 50
    dc = _sensor_class(hass, entity_id, entry)
    if domain == "sensor" and dc in SENSOR_PRIORITY:
        sub = SENSOR_PRIORITY.index(dc)
    elif domain == "binary_sensor" and dc in BINARY_PRIORITY:
        sub = BINARY_PRIORITY.index(dc)
    return (base, sub, entity_id)


def _is_identify(hass: HomeAssistant, entry: er.RegistryEntry) -> bool:
    """A button that only identifies the device (blinks / beeps), e.g. HomeKit's "Identify"."""
    if not entry.entity_id.startswith("button."):
        return False
    state = hass.states.get(entry.entity_id)
    dc = (state.attributes.get("device_class") if state else None) or entry.device_class or entry.original_device_class
    return dc == "identify"


def _is_power_on_behavior(entry: er.RegistryEntry) -> bool:
    """The "Power-on behavior" select of bulbs and plugs (Zigbee2MQTT, ZHA, Hue...): set once, not used day to day."""
    key = f"{entry.entity_id} {entry.translation_key or ''} {entry.original_name or ''}".lower().replace("-", "_").replace(" ", "_")
    return entry.entity_id.split(".")[0] in ("select", "switch") and ("power_on_behavior" in key or "power_on_state" in key or "startup_on_off" in key)


def kind_of(hass: HomeAssistant, entity_id: str, entry: er.RegistryEntry | None) -> str:
    domain = entity_id.split(".")[0]
    dc = _sensor_class(hass, entity_id, entry)
    if domain == "switch" and dc == "outlet":
        return "outlet"
    if domain == "input_boolean":
        return "switch"
    return domain


def _device_entries(devices: dr.DeviceRegistry) -> list:
    """Every device entry. Newer Home Assistant iterates the registry's devices as entries (looking them up
    as a mapping is deprecated); older versions iterate their ids."""
    return [devices.async_get(d) if isinstance(d, str) else d for d in devices.devices]


def companions(devices: dr.DeviceRegistry, entities: er.EntityRegistry) -> dict[str, str]:
    """Devices that belong with a robot vacuum (its dock...): device id -> the vacuum's device id.

    Integrations such as Roborock register the dock as a second device, so its entities
    (dust collection, mop washing, dock errors...) would end up on a card of their own.
    A device joins a vacuum's device when it is connected through it (via_device) or
    shares its identifier with a "_dock" suffix.
    """
    vacuums = {e.device_id for e in entities.entities.values() if e.device_id and e.entity_id.startswith("vacuum.") and not e.disabled_by}
    if not vacuums:
        return {}
    all_devices = [d for d in _device_entries(devices) if d]
    by_ident = {}
    for d in all_devices:
        for ident in d.identifiers:
            by_ident[tuple(ident)] = d.id
    out = {}
    for d in all_devices:
        if d.id in vacuums:
            continue
        parent = d.via_device_id if d.via_device_id in vacuums else None
        for ident in d.identifiers if not parent else ():
            dom, val = ident[0], ident[-1]
            if isinstance(val, str) and val.endswith("_dock") and by_ident.get((dom, val[:-5])) in vacuums:
                parent = by_ident[(dom, val[:-5])]
                break
        if parent:
            out[d.id] = parent
    return out


def build_home(hass: HomeAssistant, settings: dict[str, Any]) -> dict[str, Any]:
    areas = ar.async_get(hass)
    devices = dr.async_get(hass)
    entities = er.async_get(hass)
    floors = fr.async_get(hass) if fr else None
    hidden = set(settings.get("hidden", []))
    alias = companions(devices, entities)  # a vacuum's dock joins the vacuum

    def device_of(entry: er.RegistryEntry):
        """The device an entity is shown with (a dock's entities go with its vacuum) and its area."""
        dev_id = alias.get(entry.device_id, entry.device_id) if entry.device_id else None
        device = devices.async_get(dev_id) if dev_id else None
        own = devices.async_get(entry.device_id) if entry.device_id else None
        area_id = entry.area_id or (device.area_id if device else None) or (own.area_id if own else None) or "_none"
        return dev_id, device, own, area_id

    # 1. Collect visible entities, grouped by (area, device).
    groups: dict[tuple[str, str], list[str]] = {}
    for entry in entities.entities.values():
        eid = entry.entity_id
        domain = eid.split(".")[0]
        if domain not in SUPPORTED or entry.disabled_by or entry.hidden_by or entry.entity_category:
            continue
        if hass.states.get(eid) is None:
            continue
        dev_id, device, own, area_id = device_of(entry)
        if (device and device.disabled_by) or (own and own.disabled_by):
            continue
        groups.setdefault((area_id, dev_id or f"entity:{eid}"), []).append(eid)

    # Entities defined in YAML (no registry entry) only matter as scenes/scripts.
    scenes = sorted(
        s.entity_id for s in hass.states.async_all("scene")
        if not (e := entities.async_get(s.entity_id)) or not (e.hidden_by or e.disabled_by)
    )
    scripts = sorted(
        s.entity_id for s in hass.states.async_all("script")
        if not (e := entities.async_get(s.entity_id)) or not (e.hidden_by or e.disabled_by)
    )

    # 2. Turn each group into tiles.
    rooms: dict[str, dict[str, Any]] = {}
    for (area_id, device_key), eids in groups.items():
        room = rooms.setdefault(area_id, {"devices": [], "temperature": [], "humidity": [], "scenes": []})
        device = devices.async_get(device_key) if not device_key.startswith("entity:") else None
        area = areas.async_get_area(area_id) if area_id != "_none" else None

        scene_like = [e for e in eids if e.split(".")[0] in ("scene", "script")]
        room["scenes"].extend(e for e in scene_like if e.startswith("scene."))
        eids = [e for e in eids if e not in scene_like]
        if not eids:
            continue

        ordered = sorted(eids, key=lambda e: _rank(hass, e, entities.async_get(e)))
        # Room climate readings come from any temperature/humidity sensor.
        for e in ordered:
            if e.startswith("sensor.") and _sensor_class(hass, e, entities.async_get(e)) in ROOM_CLIMATE:
                room[_sensor_class(hass, e, entities.async_get(e))].append(e)

        controls = [e for e in ordered if PRIMARY_RANK.get(e.split(".")[0], 99) < 20]
        # A device with several independent controls (e.g. 2-gang switch) -> one tile each.
        primaries = controls if len({e.split(".")[0] for e in controls}) == 1 and len(controls) > 1 and controls[0].split(".")[0] in ("light", "switch", "cover") else ordered[:1]
        extras = [
            e for e in ordered if e not in primaries
            and e.split(".")[0] in ("sensor", "binary_sensor")
            and (_sensor_class(hass, e, entities.async_get(e)) in EXTRA_SENSOR_CLASSES or e.startswith("binary_sensor."))
        ][:3]

        dev_name = (device.name_by_user or device.name) if device else None
        for primary in primaries:
            state = hass.states.get(primary)
            name = state.attributes.get("friendly_name") or primary
            if len(primaries) == 1 and dev_name:
                name = dev_name
            name = _strip_prefix(name, area.name if area else None)
            room["devices"].append({
                "id": primary,
                "device_id": device.id if device else None,
                "manufacturer": device.manufacturer if device else None,
                "model": device.model if device else None,
                "name": name,
                "kind": kind_of(hass, primary, entities.async_get(primary)),
                "extras": extras,
                "hidden": primary in hidden,
            })

    # 3. Every entity of each room, so the user can pick extra ones to show (or hide tiles).
    primary_ids = {d["id"] for r in rooms.values() for d in r["devices"]}
    for entry in entities.entities.values():
        eid = entry.entity_id
        domain = eid.split(".")[0]
        if domain not in SUPPORTED or domain in ("scene", "script") or entry.disabled_by:
            continue
        state = hass.states.get(eid)
        if state is None:
            continue
        _dev_id, device, own, area_id = device_of(entry)
        if (device and device.disabled_by) or (own and own.disabled_by):
            continue
        area = areas.async_get_area(area_id) if area_id != "_none" else None
        room = rooms.setdefault(area_id, {"devices": [], "temperature": [], "humidity": [], "scenes": []})
        room.setdefault("entities", []).append({
            "id": eid,
            "name": _strip_prefix(state.attributes.get("friendly_name") or eid, area.name if area else None),
            "primary": eid in primary_ids,
            "category": bool(entry.entity_category),
            "ha_hidden": bool(entry.hidden_by),
            "manufacturer": device.manufacturer if device else None,
            "model": device.model if device else None,
        })

    # 3b. Every entity of each device ("members"), for a detail card that shows the whole device
    # (e.g. an air purifier's fan, air quality, filter life, child lock, modes...).
    by_device: dict[str, list[str]] = {}
    for entry in entities.entities.values():
        if not entry.device_id or entry.disabled_by or entry.hidden_by:
            continue
        if entry.entity_id.split(".")[0] not in MEMBER_DOMAINS or hass.states.get(entry.entity_id) is None:
            continue
        if _is_identify(hass, entry) or _is_power_on_behavior(entry):
            continue  # "Identify" only makes the device blink; "Power-on behavior" is a one-time setup choice
        by_device.setdefault(alias.get(entry.device_id, entry.device_id), []).append(entry.entity_id)
    for room in rooms.values():
        for dev in room["devices"]:
            members = [e for e in by_device.get(dev["device_id"] or "", []) if e != dev["id"]]
            # readings first (air quality, climate...), then controls
            dev["members"] = sorted(members, key=lambda e: (e.split(".")[0] not in ("sensor", "binary_sensor"), _rank(hass, e, entities.async_get(e))))

    # 4. Room metadata and ordering.
    floor_level = {}
    if floors:
        for f in floors.async_list_floors():
            floor_level[f.floor_id] = (f.level if f.level is not None else 0, f.name)
    order = {rid: i for i, rid in enumerate(settings.get("room_order", []))}
    hidden_rooms = set(settings.get("hidden_rooms", []))

    out = []
    for area_id, room in rooms.items():
        if not room["devices"] and not room["scenes"] and not room.get("entities"):
            continue
        area = areas.async_get_area(area_id) if area_id != "_none" else None
        name = area.name if area else "Outros"
        floor_id = getattr(area, "floor_id", None) if area else None
        room["devices"].sort(key=lambda d: (PRIMARY_RANK.get(d["id"].split(".")[0], 99), _fold(d["name"])))
        out.append({
            "id": area_id,
            "name": name,
            "icon": room_icon(name, getattr(area, "icon", None) if area else None),
            "picture": getattr(area, "picture", None) if area else None,
            "floor": floor_level.get(floor_id, (None, None))[1],
            "floor_level": floor_level.get(floor_id, (0, None))[0] if floor_id else 0,
            "devices": room["devices"],
            "temperature": room["temperature"],
            "humidity": room["humidity"],
            "scenes": room["scenes"],
            "entities": sorted(room.get("entities", []), key=lambda e: (not e["primary"], e["category"], _fold(e["name"]))),
            "hidden": area_id in hidden_rooms,
            "_sort": (
                order.get(area_id, 10_000),
                1 if area_id == "_none" else 0,
                floor_level.get(floor_id, (0, ""))[0],
                _fold(name),
            ),
        })
    out.sort(key=lambda r: r.pop("_sort"))

    return {
        "rooms": out,
        "scenes": [s for s in scenes if s not in hidden],
        "scripts": [s for s in scripts if s not in hidden],
        "weather": next((s.entity_id for s in hass.states.async_all("weather")), None),
        "persons": [s.entity_id for s in hass.states.async_all("person")],
        "settings": settings,
    }
