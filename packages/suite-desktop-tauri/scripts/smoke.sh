#!/usr/bin/env bash
# Native boot smoke test for the Tauri shell.
#
# Launches the REAL Tauri window (WKWebView on macOS) and asserts — via the diagnostic reports the
# init script emits to the Rust log — that the desktop-mode Suite frontend actually boots inside the
# native webview: window.desktopApi is installed and the SPA mounts real content. This complements
# the Chromium-based e2e (which cannot drive WKWebView on macOS).
#
# Prerequisite: the Tauri frontend must be served on http://localhost:8000, e.g.
#   yarn workspace @trezor/suite-build run dev:tauri
#
# Usage: packages/suite-desktop-tauri/scripts/smoke.sh
set -uo pipefail

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$(mktemp -t tauri-smoke.XXXXXX.log)"
TIMEOUT="${SMOKE_TIMEOUT:-120}"

echo "[smoke] checking frontend on :8000 ..."
if ! curl -sf -m 5 -o /dev/null http://localhost:8000/; then
    echo "[smoke] FAIL: nothing serving http://localhost:8000 (run 'yarn workspace @trezor/suite-build run dev:tauri')"
    exit 1
fi

echo "[smoke] launching native Tauri app (log: $LOG) ..."
# Run the app in its own process group (setsid where available) so cleanup can kill the whole tree
# — the cli spawns cargo + the app binary + the webview, and killing only the shell orphans them.
if command -v setsid >/dev/null 2>&1; then
    setsid bash -c "cd '$PKG_DIR' && npx --yes @tauri-apps/cli@2 dev >'$LOG' 2>&1" &
else
    ( cd "$PKG_DIR" && npx --yes @tauri-apps/cli@2 dev >"$LOG" 2>&1 ) &
fi
APP_PID=$!

# invoked via `trap cleanup EXIT`, which shellcheck can't see (SC2317 unreachable body on the
# CI shellcheck, SC2329 never-invoked on newer versions)
# shellcheck disable=SC2317,SC2329
cleanup() {
    # kill the whole process group when we started one (negative PID targets the group)
    kill -9 -- "-$APP_PID" 2>/dev/null
    kill -9 "$APP_PID" 2>/dev/null
    # belt-and-suspenders: also match by binary name in case the group kill missed anything
    pkill -9 -f "tauri-apps/cli.*dev" 2>/dev/null
    pkill -9 -f "target/debug/trezor-suite-tauri" 2>/dev/null
}
trap cleanup EXIT

ok_preload=0
ok_render=0
for _ in $(seq 1 "$TIMEOUT"); do
    grep -q "window.desktopApi installed" "$LOG" && ok_preload=1
    # a heartbeat tick with a non-trivial mounted #app (SPA rendered real content)
    if grep -qE "TAURI_REPORT tick: .*appLen=[0-9]{4,}" "$LOG"; then ok_render=1; fi
    if [ "$ok_preload" = 1 ] && [ "$ok_render" = 1 ]; then break; fi
    grep -q "error while running tauri application" "$LOG" && break
    sleep 1
done

echo "----- last reports -----"
grep -E "TAURI_REPORT|error while running|panicked" "$LOG" | tail -12

if [ "$ok_preload" = 1 ] && [ "$ok_render" = 1 ]; then
    echo "[smoke] PASS: desktopApi installed and Suite frontend mounted in the native WKWebView"
    exit 0
fi

echo "[smoke] FAIL: preload=$ok_preload render=$ok_render (see $LOG)"
exit 1
