<p align="center"><b>English</b> · <a href="README.pt.md">Português</a></p>

# Pine3 Homeview

A wall-tablet dashboard for Home Assistant. It brings the "faces" idea of a home display
(swipe between full-screen faces that each have one job, readable from across the room)
to the [Pine3 View](https://github.com/pinheirofilipem-ux/pine3-view) base: the home builds itself
from Home Assistant's areas, devices and entities, with full device cards and a 3D view of the house.
Original code, built from scratch.

Main target: a Samsung Galaxy Tab A7 in landscape on the wall, running
[Pine3 Wallpanel](https://github.com/pinheirofilipem-ux/wallpanel-android).

> **Status: early development (0.1.x).** Today it is the Pine3 View panel under a new name, so it can be
> installed next to Pine3 View. The faces arrive in the next phases. The plan, with mock-ups, is in
> [`docs/plano.html`](docs/plano.html) (Portuguese).

## Faces
Swipe sideways on the home screen to change face (or use the dots above the dock, or the arrow keys).
The tablet opens on the start face (Painel) and goes back to it when you tap Home in the dock. After a while
without touches (5 min by default) it shows the ambient face, dimmed and without the dock; a touch wakes it.
Choose the faces, their order, the start face and the ambient face in **Settings → Home**.

Available now:
- **Painel**: the clock and home status on the left; status chips (Climate, Lights, Security, Vacuum, Now playing), Favourites, scenes and rooms on the right. Add or remove a Favourite with the star on a device's detail sheet, or in edit mode (✎).
- **Mosaico**: a 4×3 grid of large tiles (S 1×1, M 2×1, L 2×2) that fills itself until you edit it. In edit mode you drag, remove (−), resize (S/M/L) and add devices, the digital or analog clock and the weather. A tap toggles; a long press opens the details.
- **Relógio**: large time, date, weather and lights on.

- **Mosaico+**: the Mosaico engine, starting with the weather (and IPMA warnings), today's calendar, what's playing, scenes and favourites.
- **Relógio e agenda** (clock and calendar): weekday and month, the whole month with the days that have events, today's events and reminders, what's playing, an analog clock, sunrise and sunset and the weather. It can also be the ambient face.

The calendar reads Home Assistant's `calendar.*` and `todo.*` entities. iCloud calendars come in through the **CalDAV** integration (with an app-specific password); iCloud Reminders are usually not available over CalDAV, so a local Home Assistant list works instead. Choose the calendars and the list in **Settings → Home → Calendar**.

Fluxo arrives in a later phase.

### Planned
- **Painel** (start face): the Pine3 home screen with status chips and Favourites.
- **Mosaico**: a 4×3 grid of large tiles (S 1×1, M 2×1, L 2×2).
- **Mosaico+**: weather with IPMA warnings, today's calendar, what's playing, scenes.
- **Relógio e agenda**: date, month, sunrise and weather, made to be read from far away.
- **Fluxo**: an ambient animated face.

## Install with HACS
1. **HACS** → **⋮** → **Custom repositories**: `https://github.com/pinheirofilipem-ux/Pine3-Homeview`, type **Integration**.
2. Download **Pine3 Homeview** and restart Home Assistant.
3. **Settings → Devices & services → Add integration → Pine3 Homeview**.
4. Open **Pine3 Homeview** in the sidebar (`/pine3-homeview`; add `?kiosk` to hide the sidebar).

Requires Home Assistant 2024.7 or newer. It uses its own domain (`pine3_homeview`), settings and
per-device options, so it does not interfere with an installed Pine3 View.

## Code layout
`custom_components/pine3_homeview/frontend/`:
- `pine3-homeview-panel.js`: the panel element (life cycle, data, rendering).
- `model.js`: rooms and per-entity helpers. `util.js`: shared helpers.
- `views/`: home, rooms, settings and forecast screens. `ui/`: tiles, detail sheet, dock, edit mode, device options, events.
- `tokens.js`: colour tokens for the dark and light appearances (`theme.js` adds the light set on light themes).
- `styles.js`, `house3d.js`, `plan2d.js`, `housecanvas.js`, `weather.js`, `i18n.js`, `const.js`: as in Pine3 View.

On tablets with up to 4 GB of memory (such as the Galaxy Tab A7) the panel uses "light glass" by
default: no blur, with a denser fill and a stronger sheen. It can be changed per device in Settings.

## Tests
```
pip install -r requirements_test.txt
pytest
```

## License
MIT (see `LICENSE`). The Outfit and Figtree fonts are under the SIL Open Font License 1.1 (see `NOTICE`).
