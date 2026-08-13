# D22-soso Portfolio — Design Language (Cursor Constitution)

## North star
A **documentary command archive** that feels like a video game: WebGL fog, Random race roll, 3D battle map, card physics. Not a neon resume. One strategist, many theaters.

## Shell
- BG `#0a0a0a`, surfaces `#0f0f0f` / `#121212`
- Accents: electric violet `#8b5cf6`, gold `#d4af37`, Protoss teal `#2dd4bf`
- Type: Space Grotesk (brand + display) · IBM Plex Sans (body) · IBM Plex Mono (data/hotkeys)
- Nav: minimap + command-card hotkeys
- Blockquotes = advisor transmissions; no raw URLs
- Hero budget: brand lockup leads (D22-soso > name) + one proof line + three hairline pillars (Esports / WSOP / 2HH) + one CTA (“Enter archive”). No logo strip, no dual SCROLL cue. Championship photo is the dominant plane (`object-fit: cover`, near-full opacity, light scrim)
- First viewport uses executive restraint (`data-theme="hero"` gold chrome; no violet glow, glitch, rainbow progress, or floating section indicator)
- Trio pillars preview WSOP / 2HH in the mid-band between the proof line and the pillar hairlines (small fade + scale). Championship photo remains the default plane. No mid-page teleports from the hero (navigation is scroll + command nav)
- Chrome after hero: section indicator is the section name + hairline only (no “NOW VIEWING”, no pill, no glow pulse); scroll progress is a single muted gold hairline
- Phone chrome: header is brand + command nav. Socials live in Contact / footer below ~1100px
- StarCraft is two rooms: championship archive (`#esports`), then command systems (`#sc-command` — Lost Temple map + Random race roll)
- Poker press (“As heard on”) lives in a collapsed fold under the felt plane — not in the first poker viewport
- Motion: signature systems stay loud; chrome dots/pips are static (no infinite pulse)

## Frame discipline
Two tiers — most theaters are gallery rooms; one archive file remains.

**Gallery bleed (`.art-view`):** Hero champ plane, Poker photo plane, Book showcase, **and every esports theater** (StarCraft, C&C, Warcraft, MTG, Cube, Hearthstone). No enclosed panel chrome — material wash + a single accent rule so content sits on `#bg-stage`. Cube is a quieter MTG continuation (thinner left rule, softer wash), not a second full room.

**Dossier frame:** Innovation tabs only (`.tablist-wrap`). Patents belong in a file. Play iframe is cropped media (`--r-media`), not a panel. About prose uses a left hairline; the career timeline is a vertical spine of bottom rules — neither is a boxed card.

- Rank plaques, eyebrow labels, and theater tags are type + colour + a single rule, not chips.
- Proof groups (`.about-fact`, `.about-credentials`, `.about-book`, `.interview-cite`) use a left hairline.
- Row lists (`.stat-list`, `.career-timeline`, `.dossier-meta`) use bottom rules only.
- Material is a container cue on its own: felt, phosphor, and lacquer gradients replace a border rather than sit under one.
- Media (images, canvases, iframes) is cropped by radius, not outlined. Canvases keep one hairline because it reads as an affordance.
- Radius comes from `--r-panel` (8px) / `--r-media` (6px) / `--r-control` (3px). No fourth value.
- Never stack `0 0 0 Npx` rings on an element that already has a border — the ring duplicates the border line.
- Warcraft’s heraldic plate may keep a gold frame — it is the proof object, not a nested card inside a panel.

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
11. One-shot theater-enter dialects (`warp` / `scan` / `drop` / `deal` / `lid` / `float` / `page` / `chip`) — scout-in clip + unique second beat; mark `data-entered` so re-scroll is a quiet fade only

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

Panel materials use `.game-panel[data-theme="…"]` (scoped to that panel only). Hover/active change wash/rule intensity only so material stays intact — never a brighter box border. All esports `.art-view` theaters cycle dialects via wash/rule, matching StarCraft.

## Anti-patterns
No Zerg-rush memes, RGB gamer chrome, Blizzard HUD theft, badge dumps, confidential $ / royalties, spreadsheet patents.
No hero identity-card teleports that jump mid-page before the visitor orients.
No neon / violet-glow treatment on the first-viewport triptych.
No floating HUD pills or rainbow progress on the hero.
No box inside a box: if the parent is already framed, the child gets a rule or a tint.
No replaying loud theater enters (CRT boot / lid / deal / foil) on every scroll pass — one-shot only.

## Content
Only public tiers from `wayne-chiang-truth-document.md` (RTS King narrative sourced from `rts-king.md`; casino IP and author copy from `inventor-author.md`). Photos from `drive-download-20260720T075014Z-1-001/`.

## Page split
- **Main (`index.html`):** Hero, Poker, StarCraft championship theater, StarCraft command systems, Book, Innovation, Play, Locate, About, Contact. StarCraft command ends with a CTA into the Gaming Archive.
- **Gaming Archive (`gaming.html`):** C&C, Warcraft, MTG, Cube, Hearthstone theaters with the same art-view + one-shot enter dialects. Nav bridges back to the main portfolio.
