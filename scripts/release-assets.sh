#!/usr/bin/env bash
#
# Collect the built desktop artifacts into dist/ for upload to the rolling
# "continuous" GitHub Release. Artifact names are versionless (set in
# electron-builder-config), so the same file serves both the website download
# links and the electron-updater feed.
#
# For Windows/Linux we also collect the electron-updater metadata (latest*.yml)
# and blockmaps so auto-update works. macOS ships installers only (auto-update is
# disabled on macOS — unsigned build).
#
# Usage: scripts/release-assets.sh <mac|linux|win>
#
# Env overrides:
#   WORK   checkout directory (default: <repo>/work) — must match scripts/prepare.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${WORK:-$ROOT/work}"
BE="$WORK/packages/suite-desktop/build-electron"
TARGET="${1:?usage: release-assets.sh <mac|linux|win>}"
DIST="$ROOT/dist"
mkdir -p "$DIST"

# copy every glob argument that exists into dist/, preserving the (versionless) name
take() {
    local found=0 f
    for f in "$@"; do
        [ -f "$f" ] || continue
        echo "  + $(basename "$f")"
        cp "$f" "$DIST/"
        found=1
    done
    return $((found ? 0 : 1))
}

case "$TARGET" in
    mac)
        take "$BE"/*-mac-arm64.dmg || { echo "!! no mac arm64 dmg in $BE" >&2; ls -la "$BE" >&2; exit 1; }
        take "$BE"/*-mac-x64.dmg   || { echo "!! no mac x64 dmg in $BE" >&2; exit 1; }
        # macOS auto-update feed (present only when the build is signed): latest-mac.yml
        # + the update .zip(s) it references. Absent on ad-hoc builds — that's fine.
        take "$BE"/latest-mac.yml       || true
        take "$BE"/*-mac-*.zip          || true
        take "$BE"/*-mac-*.zip.blockmap || true
        ;;
    win)
        take "$BE"/*-win-*.exe          || { echo "!! no win installer in $BE" >&2; ls -la "$BE" >&2; exit 1; }
        take "$BE"/latest.yml           || { echo "!! no latest.yml (updater feed) in $BE" >&2; exit 1; }
        take "$BE"/*-win-*.exe.blockmap || true
        ;;
    linux)
        take "$BE"/*.AppImage           || { echo "!! no AppImage in $BE" >&2; ls -la "$BE" >&2; exit 1; }
        take "$BE"/latest-linux.yml     || { echo "!! no latest-linux.yml (updater feed) in $BE" >&2; exit 1; }
        take "$BE"/*.AppImage.blockmap  || true
        ;;
    *)
        echo "unknown target: $TARGET (use mac|linux|win)" >&2
        exit 1
        ;;
esac

echo "==> dist ready:"
ls -la "$DIST"
