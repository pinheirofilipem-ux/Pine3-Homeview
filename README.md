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

## Planned faces
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

## Tests
```
pip install -r requirements_test.txt
pytest
```

## License
MIT (see `LICENSE`). The Outfit and Figtree fonts are under the SIL Open Font License 1.1 (see `NOTICE`).
