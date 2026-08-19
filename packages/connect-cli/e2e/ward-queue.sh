#!/usr/bin/env bash
#
# The WARD queue, end to end: queue a change, back it up, discard it, put it back.
#
# WHAT THIS PROVES that unit tests cannot. The blob is produced by the device and consumed by the
# device, and its MAC is what makes a restore acceptable -- so the only honest check of the pair is a
# real round trip against real firmware. It also pins the case sensitivity of --appid/--ident, which
# is silent when broken: a lowercased identifier derives a DIFFERENT entry_key, so the entry simply
# is not found and nothing says why.
#
# Run it with the emulator wrapped around it, because emu.py exits when its stdin closes:
#
#   cd <trezor-firmware>/core
#   python3 emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-queue.sh
#
# Needs a debuglink-capable T3W1 emulator build:
#   xtask build firmware --emulator --pyopt=false --debug-link true --dbg-console none --model t3w1
#
# NOTE the CLI exits 1 on success (pre-existing behaviour: it prints the result and exits), so this
# script asserts on OUTPUT rather than exit codes, and cannot use `set -e`.

set -u

SUITE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$SUITE" || exit 1

# Mixed case on purpose: these two are hashed into the entry_key and must survive verbatim.
APPID="Example.COM"
IDENT="Addr1"
VALUE="queued_secret"

CLI="yarn workspace @trezor/connect-cli cli --udp --debuglink --pairing=skip"
failures=0

# Greps the WHOLE output and only trims for display: a thrown error puts its message above Node's
# stack trace, so checking just the tail reports a pass or fail for the wrong reason.
check() {
    local label="$1" expected="$2" got="$3"
    if grep -qE "$expected" <<<"$got"; then
        echo "  ok   $label"
    else
        echo "  FAIL $label -- expected /$expected/, got:"
        grep -vE "^\s*at |^\s*$" <<<"$got" | tail -6 | sed 's/^/         /'
        failures=$((failures + 1))
    fi
}

echo "1. queue a change"
check "queued" "queued: true" \
    "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="$IDENT" --value="$VALUE" 2>&1)"

echo "2. back it up into a variable"
# --target prints `BLOB=0x...` on stdout, which is exactly what makes it capturable -- but the CLI
# logs to stdout too, so the assignment is grepped out before eval rather than eval'ing the lot.
eval "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident="$IDENT" --target=BLOB 2>/dev/null | grep -E '^BLOB=0x[0-9a-f]+$')"
check "blob captured" "^0x[0-9a-f]{40,}$" "${BLOB:-}"

echo "3. a lowercased spelling must NOT find it"
check "case is significant" "missing: true" \
    "$(timeout 150 $CLI --method=ward_backup --queue --appid="${APPID,,}" --ident="${IDENT,,}" 2>&1)"

echo "4. discard it"
check "discarded" "discarded: true" \
    "$(timeout 150 $CLI --method=ward_delete --queue --appid="$APPID" --ident="$IDENT" 2>&1)"

echo "5. and it is really gone"
check "gone" "missing: true" \
    "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident="$IDENT" 2>&1)"

echo "6. discarding nothing is an answer, not an error"
check "missing reported" "missing: true" \
    "$(timeout 150 $CLI --method=ward_delete --queue --appid="$APPID" --ident="$IDENT" 2>&1)"

echo "7. restore it from the backup alone"
check "restored" "restored: true" \
    "$(timeout 150 $CLI --method=ward_restore --queue --entry="${BLOB:-none}" 2>&1)"

echo "8. it is queued again, and still backupable"
check "back" "^AGAIN=0x[0-9a-f]{40,}$" \
    "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident="$IDENT" --target=AGAIN 2>/dev/null | grep -E '^AGAIN=')"

echo "9. a tampered blob is refused by the DEVICE, not by us"
# One flipped byte at the end -- inside the MAC itself, so the device recomputes and disagrees.
TAMPERED="${BLOB:-0x00}"
TAMPERED="${TAMPERED%??}ff"
check "tamper refused" "not authenticated by this wallet" \
    "$(timeout 150 $CLI --method=ward_restore --queue --entry="$TAMPERED" 2>&1)"

echo "10. a malformed blob is refused by US, before the device is bothered"
check "garbage refused" "not a ward_backup blob" \
    "$(timeout 150 $CLI --method=ward_restore --queue --entry=0xdeadbeef 2>&1)"

echo
if [ "$failures" -eq 0 ]; then
    echo "ward queue e2e: all checks passed"
else
    echo "ward queue e2e: $failures check(s) FAILED"
fi
exit "$failures"
