# D22-soso — Wayne Chiang Portfolio

Premium single-page portfolio for Wayne “D22-soso” Chiang: StarCraft: Brood War Season 1 World Champion (Random), Cube Draft pioneer, patented casino game inventor, WSOP Talent Manager.

## Run locally

ES modules + vendored imports require HTTP (not `file://`). From this folder:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Structure

| File | Role |
|------|------|
| `index.html` | Main portfolio — hero, poker, StarCraft, book, IP, play, locate, about |
| `gaming.html` | Gaming Archive — C&C, Warcraft, MTG, Cube, Hearthstone |
| `app/privacy/` | 2 Hand Hold'em iOS Privacy Policy (`https://d22soso.com/app/privacy/`) |
| `app/terms/` | 2 Hand Hold'em iOS Terms of Service (`https://d22soso.com/app/terms/`) |
| `app/terms.pdf` | Official TOS PDF (September 4, 2026) |
| `vendor/` | Self-hosted ESM builds of Three.js + GSAP |
| `style.css` | Brood War shell + per-tab themes |
| `script.js` | Thin boot — chrome, motion, widgets, flair, intro; WebGL deferred |
| `js/pref.js` | Shared motion / pointer prefs |
| `js/theme-nav.js` | Tabs, hotkeys, theme, bg crossfade, command nav |
| `js/motion.js` | Scroll progress, one-shot theater enters |
| `js/widgets.js` | Hero preview, about fold, poker gallery, 2HH embed, feedback |
| `js/flair.js` | Quiet chrome — ripples, APM, suit motes |
| `js/intro.js` | One-shot homepage constellation intro |
| `js/sky-sample.js` | Constellation / silhouette sampler for WebGL sky |
| `js/webgl-boot.js` | Idle / on-viewport Three.js loader |
| `js/webgl-scene.js` | Shared WebGL fleets + fog-of-war scout |
| `js/webgl-interactives.js` | 2HH / Badugi cards |
| `wayne-chiang-truth-document.md` | Fact source of truth |
| `design-language.md` | Design constitution |
| `sources/` | Editorial source PDFs (not linked from the live site) |
| `assets/img/` | Optimized imagery served by the site |
| `tools/optimize-images.sh` | Regenerates `assets/img/` from the local photo dump + `assets/themes/` |

The original photo dump (`drive-download-…`) is local-only (gitignored). `assets/photos` is a symlink to that folder for the image pipeline.

## Stack

- **Three.js** (WebGL) for background fleets, fog scout, and panel scenes — loaded after first paint, panel canvases only when near the viewport
- **GSAP** for theater enters and card motion
- Vanilla HTML/CSS orchestration (no build step; vendored ESM via import map)

## Game controls

- Pointer scouts fog of war (WebGL)
- Hotkeys `1`–`5` on the main page; `1`–`6` on the Gaming Archive
- Innovation canvases — click to split (2HH) or pick (Badugi)
- Play 2HH in-page at `#play` (embedded table) or [open the full desktop version](https://play2hh.herokuapp.com/)

## Privacy

`confidential-notes.md` is gitignored and must not be published.
