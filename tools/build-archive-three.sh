#!/usr/bin/env bash
# Builds vendor/three/three.archive.min.js: only the Three.js classes archive/world.js uses,
# tree-shaken and minified. Re-run after world.js starts using a new THREE.* export.
set -euo pipefail
cd "$(dirname "$0")/.."
names=$(grep -oE 'THREE\.[A-Za-z0-9]+' archive/world.js | sed 's/THREE\.//' | sort -u | paste -sd, -)
entry=$(mktemp -d)/entry.js
echo "export { ${names} } from \"$PWD/vendor/three/three.module.js\";" > "$entry"
npx --yes esbuild@0.24.0 "$entry" --bundle --minify --format=esm --legal-comments=eof \
  --outfile=vendor/three/three.archive.min.js
