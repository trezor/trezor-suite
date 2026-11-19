#!/bin/bash
# Prepares an iOS simulator for capture flows that start outside the app (see the start_states
# with `prepare` in parts/capture-flows.json). Runs on the Mac that hosts the simulator.
#
#   prepare-start-state.sh fresh-install <simulator-udid> <TrezorSuiteDebug.app>
#   prepare-start-state.sh keychain-unavailable <simulator-udid> <TrezorSuiteDebug.app>
#
# fresh-install: uninstall the app, reset the simulator keychain and install the app again.
# keychain-unavailable: the same, but installs a copy of the app whose entitlements are removed.
# Keychain access then fails (errSecMissingEntitlement), so the app cannot read or create its
# storage encryption key and shows the "Unable to load app data" startup alert.
#
# Do not launch the app here: the replay's launch step does that. Only use disposable simulators.
set -euo pipefail

state="${1:?usage: prepare-start-state.sh <fresh-install|keychain-unavailable> <udid> <app>}"
udid="${2:?simulator udid required}"
app="${3:?path to the simulator .app required}"
bundle_id='io.trezor.suite.debug'

case "$state" in
    fresh-install)
        install_app="$app"
        ;;
    keychain-unavailable)
        work="$(mktemp -d -t trezor-noentitlements)"
        trap 'rm -rf "$work"' EXIT
        install_app="$work/$(basename "$app")"
        ditto "$app" "$install_app"
        printf '%s\n' '<?xml version="1.0" encoding="UTF-8"?>' \
            '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' \
            '<plist version="1.0"><dict/></plist>' >"$work/empty.plist"
        executable="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$install_app/Info.plist")"
        # Simulator builds embed entitlements in __TEXT,__entitlements and __ents_der sections,
        # which re-signing does not replace. Zero and rename them, keeping all offsets.
        python3 - "$install_app/$executable" <<'PY'
import pathlib, struct, sys

path = pathlib.Path(sys.argv[1])
data = bytearray(path.read_bytes())
if struct.unpack_from('<I', data)[0] != 0xFEEDFACF:
    raise SystemExit('expected a thin little-endian 64-bit Mach-O')
position = 32
changes = []
for _ in range(struct.unpack_from('<I', data, 16)[0]):
    command, length = struct.unpack_from('<II', data, position)
    if command == 0x19:  # LC_SEGMENT_64
        for index in range(struct.unpack_from('<I', data, position + 64)[0]):
            section = position + 72 + index * 80
            name = bytes(data[section : section + 16]).rstrip(b'\0')
            if name in (b'__entitlements', b'__ents_der'):
                size = struct.unpack_from('<Q', data, section + 40)[0]
                offset = struct.unpack_from('<I', data, section + 48)[0]
                if offset + size > len(data):
                    raise SystemExit('invalid entitlement section bounds')
                replacement = b'__disabled_ent' if name == b'__entitlements' else b'__disabled_der'
                data[section : section + 16] = replacement.ljust(16, b'\0')
                data[offset : offset + size] = b'\0' * size
                changes.append(name.decode())
    position += length
if changes:
    path.write_bytes(data)
print('embedded entitlements disabled:', ', '.join(changes) or 'none found')
PY
        codesign -f -s - --entitlements "$work/empty.plist" "$install_app"
        ;;
    *)
        printf 'unknown start state %s\n' "$state" >&2
        exit 2
        ;;
esac

# simctl needs CoreSimulatorService; run outside any sandbox that blocks its XPC connection.
xcrun simctl terminate "$udid" "$bundle_id" 2>/dev/null || true
xcrun simctl uninstall "$udid" "$bundle_id"
xcrun simctl keychain "$udid" reset
xcrun simctl install "$udid" "$install_app"
printf '%s prepared on %s\n' "$state" "$udid"
