# D22-soso Portfolio — Design Language (Cursor Constitution)

## North star
A **documentary command archive** that feels like a video game: WebGL fog, Random race roll, 3D battle map, card physics. Not a neon resume. One strategist, many theaters.

## Shell
- BG `#0a0a0a`, surfaces `#0f0f0f` / `#121212`
- Accents: electric violet `#8b5cf6`, gold `#d4af37`, Protoss teal `#2dd4bf`
- Type: Inter (body), JetBrains Mono (data/hotkeys)
- Nav: minimap + command-card hotkeys
- Blockquotes = advisor transmissions; no raw URLs

## Signature systems (required)
1. Random race WebGL reveal → tri-race shell (GSAP spin/settle)  
2. WebGL fog-of-war scout + session persistence  
3. Themed Three.js background fleets (ScrollTrigger parallax)  
4. Lost Temple battle-report WebGL map  
5. Tab themes: starcraft | cnc | warcraft | mtg | hearthstone | poker | 2hh | badugi  
6. Click-to-cycle game panel dialects (3 variants per esports theater; keys `*-v2` / `*-v3`)  
7. 2HH 3D card-split (GSAP)  
8. Badugi 3D triad pick (GSAP)  
9. Rank plaques (engraved, max 3 proof objects / panel)  
10. `prefers-reduced-motion` static fallbacks (hide WebGL motion)  

## Tab dialects
| Theme | Material |
|-------|----------|
| starcraft | Sci-fi metal, violet/gold |
| cnc | CRT phosphor, military grid |
| warcraft | Warm stone/parchment, banner |
| mtg | Lacquer, card ratio modules |
| hearthstone | Ember amber, legend plate |
| poker | Felt green depth, lower-thirds |
| 2hh | Dual-hand cool/warm split |
| badugi | Ice lowball, triad geometry |

## Game panel variants (click to cycle)
Each esports `.game-panel` cycles `0 → 1 → 2 → 0`. Variants are **material dialects** (texture + atmosphere + panel treatment), not recolors. WebGL fleets map `*-v2` / `*-v3` back to the base key. No Blizzard/Westwood HUD theft.

| Theater | v0 | v1 | v2 |
|---------|----|----|----|
| starcraft | **Cosmic Violet** — `#8b5cf6`/`#d4af37` · championship archive | **Protoss Teal** — `#2dd4bf`/`#a8e6ff` · trophy archive | **Amber Dusk** — `#ea580c`/`#b45309` siege copper · PGL archive |
| cnc | **Phosphor CRT** — `#39ff14`/`#c4a35a` · Case’s Ladder | **Nod Crimson** — `#b42318`/`#7a868c` · IR crop | **GDI Brass** — `#c4a035`/`#7a8b99` · briefing crop |
| warcraft | **Parchment Night** — `#60a5fa`/`#fbbf24` · WC2 SoSOWAC | **Alliance Banner** — `#3b82f6`/`#d4af37` heraldic · WC2 image | **Horde Ember** — `#b91c1c`/`#84cc16` blood/fel |
| mtg | **Lacquer Magenta** — `#e879f9`/`#fbbf24` foil (not SC violet) | **Swamp Ink** — `#86efac`/`#a8a29e` | **Plains Gold** — `#f5f0e1`/`#eab308` |
| hearthstone | **Tavern Ember** — `#f59e0b`/`#fde68a` · Legend #35 | **Frost Legend** — `#67e8f9`/`#f0f9ff` ice cyan | **Midnight Inn** — `#94a3b8`/`#cbd5e1` slate pewter |

Panel materials use `.game-panel[data-theme="…"]` (scoped to that panel only). Hover/active change border only so material shadows stay intact.

## Anti-patterns
No Zerg-rush memes, RGB gamer chrome, Blizzard HUD theft, badge dumps, confidential $ / royalties, spreadsheet patents.

## Content
Only public tiers from `wayne-chiang-truth-document.md`. Photos from `drive-download-20260720T075014Z-1-001/`.
