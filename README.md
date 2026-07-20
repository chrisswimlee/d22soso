# D22-soso — Wayne Chiang Portfolio

Premium single-page portfolio for Wayne “D22-soso” Chiang: StarCraft: Brood War Season 1 World Champion (Random), Cube Draft pioneer, patented casino game inventor, WSOP Talent Manager.

## Run locally

Open `index.html` in a browser, or from this folder:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Structure

| File | Role |
|------|------|
| `index.html` | Page structure, sections, tabs |
| `style.css` | Brood War shell + per-tab themes |
| `script.js` | Tabs, hotkeys, theme orchestration |
| `js/physics.js` | Springs / particles |
| `js/game-canvas.js` | Fog, minimap, race roll, battle map, card demos |
| `wayne-chiang-truth-document.md` | Fact source of truth |
| `design-language.md` | Design constitution |
| `assets/photos` → photo archive | Imagery |

## Game controls

- Pointer scouts fog of war
- Corner minimap — click blips to jump sections
- Hotkeys `1`–`6` — command nav (includes Play 2HH)
- `R` or click race canvas — Random race roll
- Innovation canvases — click to split (2HH) or pick (Badugi)
- [Play 2 Hand Hold’em on desktop](http://play2hh.herokuapp.com/)

## Privacy

`confidential-notes.md` is gitignored and must not be published.
