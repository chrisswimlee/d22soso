#!/usr/bin/env bash
#
# Image optimization pipeline for d22soso.com
# ---------------------------------------------
# Generates responsive AVIF + WebP + JPG/PNG renditions of every image
# referenced by the site into assets/img/, plus compressed theme backgrounds.
#
# Requires (macOS): sips (built-in), cwebp + avifenc (brew install webp libavif).
#
# Re-run any time source photos change:
#   bash tools/optimize-images.sh
#
set -euo pipefail

export PATH="/opt/homebrew/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/photos"
THEMES="$ROOT/assets/themes"
OUT="$ROOT/assets/img"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT"

# Quality knobs (tuned for dark, overlaid imagery)
AVIF_Q=62
WEBP_Q=82
JPG_Q=82
AVIF_SPEED=6

# gen <slug> <source-file> <fallback:jpg|png> <width> [width...]
gen() {
  local slug="$1" src="$2" fmt="$3"; shift 3
  if [ ! -f "$src" ]; then
    echo "  ! MISSING source: $src" >&2
    return
  fi
  for w in "$@"; do
    local base="$TMP/${slug}-${w}.png"
    sips --resampleWidth "$w" "$src" --out "$base" >/dev/null 2>&1
    avifenc -q "$AVIF_Q" -s "$AVIF_SPEED" "$base" "$OUT/${slug}-${w}.avif" >/dev/null 2>&1
    cwebp -quiet -q "$WEBP_Q" "$base" -o "$OUT/${slug}-${w}.webp"
    if [ "$fmt" = "png" ]; then
      cp "$base" "$OUT/${slug}-${w}.png"
    else
      sips -s format jpeg -s formatOptions "$JPG_Q" "$base" --out "$OUT/${slug}-${w}.jpg" >/dev/null 2>&1
    fi
    printf "  %-22s w%-5s avif %5sK  webp %5sK\n" "$slug" "$w" \
      "$(( ($(stat -f%z "$OUT/${slug}-${w}.avif") + 512) / 1024 ))" \
      "$(( ($(stat -f%z "$OUT/${slug}-${w}.webp") + 512) / 1024 ))"
  done
}

echo "== Photos =="
gen champ-trophy   "$SRC/AAA Wayne Chiang Starcraft World Champ.JPG"                              jpg 640 1080
gen champ-pgl      "$SRC/AAA Wayne Chiang Starcraft World Champ and PGL 2nd.JPG"                  jpg 640 1080
gen champ-closeup  "$SRC/AAA Starcraft World Champ Close Up.JPG"                                  jpg 640 1080
gen wsop-boxer     "$SRC/Slayers Boxer D22-soso WSOP 2025.jpg"                                    jpg 720 1200
gen elky           "$SRC/D22-soso Elky.JPG"                                                       jpg 640 1080
gen garimto        "$SRC/Garimto D22-soso 2024.jpg"                                               jpg 640 1080
gen tastosis       "$SRC/Tastosis D22-soso 2024.jpg"                                              jpg 640 1080
gen sc-championship "$SRC/The First Official Blizzard StarCraft Brood War World Championships Won by D22-soso.jpg" jpg 900
gen weissman       "$SRC/wayne chiang brian weissman.jpg"                                         jpg 900
gen hearthstone-35 "$SRC/Heartsthone 35.jpg"                                                      jpg 720
gen latb-logo      "$SRC/live-at-the-bike-logo.jpg"                                               jpg 400
gen blackjack      "$SRC/how-to-play-blackjack-lead.jpg"                                          jpg 900
gen twohh-logo     "$SRC/2hh LOGO OFFICIAL TRADEMARK APPLIED.png"                                 png 500
gen badugi-play    "$SRC/Badugi Play 4.png"                                                       png 900

echo "== Theme backgrounds (resize + AVIF/WebP + compressed JPG) =="
# genbg <name> — reads themes/<name>.jpg, writes img/bg-<name>.{avif,webp,jpg}
genbg() {
  local name="$1" w=1920
  local src="$THEMES/${name}.jpg"
  if [ ! -f "$src" ]; then echo "  ! MISSING theme: $src" >&2; return; fi
  local base="$TMP/bg-${name}.png"
  sips --resampleWidth "$w" "$src" --out "$base" >/dev/null 2>&1
  avifenc -q 55 -s "$AVIF_SPEED" "$base" "$OUT/bg-${name}.avif" >/dev/null 2>&1
  cwebp -quiet -q 76 "$base" -o "$OUT/bg-${name}.webp"
  sips -s format jpeg -s formatOptions 74 "$base" --out "$OUT/bg-${name}.jpg" >/dev/null 2>&1
  printf "  %-18s avif %5sK  webp %5sK  jpg %5sK\n" "$name" \
    "$(( ($(stat -f%z "$OUT/bg-${name}.avif") + 512) / 1024 ))" \
    "$(( ($(stat -f%z "$OUT/bg-${name}.webp") + 512) / 1024 ))" \
    "$(( ($(stat -f%z "$OUT/bg-${name}.jpg") + 512) / 1024 ))"
}

for t in starcraft starcraft-v2 starcraft-v3 cnc cnc-v2 cnc-v3 \
         warcraft warcraft-v2 warcraft-v3 mtg mtg-v2 mtg-v3 \
         hearthstone hearthstone-v2 hearthstone-v3; do
  genbg "$t"
done

echo "Done. Output in $OUT"
