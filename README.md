# D22-soso — Wayne Chiang Portfolio

Premium single-page portfolio for Wayne “D22-soso” Chiang: StarCraft: Brood War Season 1 World Champion (Random), Cube Draft pioneer, patented casino game inventor, WSOP Talent Manager.

## Run locally

ES modules + CDN imports require HTTP (not `file://`). From this folder:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Structure

| File | Role |
|------|------|
| `index.html` | Page structure, import map (Three.js + GSAP) |
| `style.css` | Brood War shell + per-tab themes |
| `script.js` | Tabs, hotkeys, theme orchestration, WebGL boot |
| `js/webgl-scene.js` | Shared WebGL fleets + fog-of-war scout |
| `js/webgl-interactives.js` | Race roll, Lost Temple battle, 2HH / Badugi cards |
| `wayne-chiang-truth-document.md` | Fact source of truth |
| `design-language.md` | Design constitution |
| `assets/photos` → photo archive | Imagery |

## Stack

- **Three.js** (WebGL) for background fleets, fog scout, and panel scenes
- **GSAP + ScrollTrigger** for theme crossfades, race/battle/card motion, scroll parallax
- Vanilla HTML/CSS orchestration (no build step; CDN ESM via import map)

## Game controls

- Pointer scouts fog of war (WebGL)
- Hotkeys `1`–`8` — command nav
- `R` or click race canvas — Random race roll
- Innovation canvases — click to split (2HH) or pick (Badugi)
- Play 2HH in-page at `#play` (embedded table) or [open the full desktop version](https://play2hh.herokuapp.com/)

## Privacy

`confidential-notes.md` is gitignored and must not be published.
