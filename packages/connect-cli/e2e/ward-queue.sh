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

# The emulator has to be up AND built with debuglink before anything below can work: every step that
# shows a screen needs the debug port to confirm it. Checking here rather than letting the run
# produce a page of cascading failures, which is what happens when it is missing -- the wire port
# answers, so the first few calls look like device errors instead of a setup problem.
# WHAT COUNTS AS "an emulator is there": the UDP ports are BOUND. Not that they answer -- this
# firmware does not reply to the PINGPING liveness probe that trezorlib and connect's UdpTransport
# send, so a handshake check would reject a perfectly working emulator. Binding is what actually
# predicts whether the CLI can talk to it.
#
# If neither ss nor netstat exists we say so and carry on rather than guessing: a missing tool is not
# evidence of a missing device.
port_bound() {
    if command -v ss >/dev/null 2>&1; then
        ss -lun 2>/dev/null | grep -qE "127\.0\.0\.1:$1\b"
    elif command -v netstat >/dev/null 2>&1; then
        netstat -lun 2>/dev/null | grep -qE "127\.0\.0\.1:$1\b"
    else
        echo "  (no ss/netstat -- skipping the emulator preflight)" >&2

        return 0
    fi
}

if ! port_bound 21324; then
    cat >&2 <<'MSG'
No emulator is listening on udp 21324. Start one with the queue's own script wrapped around it:

  cd <trezor-firmware>/core
  python3 emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-queue.sh

(emu.py exits when its stdin closes, so it has to wrap the script rather than run beside it.)
MSG
    exit 1
fi

if ! port_bound 21325; then
    cat >&2 <<'MSG'
An emulator is running but it binds no DEBUGLINK port (udp 21325), so nothing can confirm the screens
this script walks through -- every step that shows one would fail. Rebuild it with debuglink:

  cd <trezor-firmware>/core
  xtask build firmware --emulator --pyopt=false --debug-link true --dbg-console none --model t3w1

(plain `make build_unix` binds no debug port; t3w1 rather than t3t1 because the multi-session parts
of the WARD suite need THP.)
MSG
    exit 1
fi

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
