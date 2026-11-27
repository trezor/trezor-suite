#!/usr/bin/env bash
#
# WARD STORAGE ON SUITE SYNC, end to end, on a CONNECT build: the relay admits the WARD owner only
# once the Quota Manager funds it, and refuses writes beyond what it was given -- as production does.
# connect-cli holds the device's delegated Suite Sync key and funds the owner when wardd says so.
#
# THE ARC (one emulator, two wardd hosts of the same wallet, one WM, one relay + Quota Manager):
#   1. host A syncs: its WARD owner is unregistered, so connect-cli funds it from the device's quota
#   2. two changes are flushed through A; host B, opened on the same wallet, receives them
#   3. the owner's storage is cut to what it holds; two more changes are flushed through A -- the
#      writes succeed, A reports `quota_full` with records waiting, B stays behind
#   4. A's status with funding: connect-cli allocates more, A resynchronizes, B receives everything
#
# The Quota Manager is wardd's local stand-in (`relay --quota-manager-port`, suiteSyncDev.ts): the
# same admission and quota rules and the same signed allocation as Suite Sync, but devices are given
# quota instead of registering with an authenticity certificate, and step 3 sets the limit through
# its test control.
#
# Run it with the emulator wrapped around it, because emu.py exits when its stdin closes:
#
#   cd <trezor-firmware>
#   xtask build firmware -e -d --pyopt false --model t3t1 --debug-link
#   python3 core/emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-suite-sync.sh
#
# NOTE the CLI exits 1 on success (it prints the result and exits), so this script asserts on
# OUTPUT rather than exit codes, and cannot use `set -e`.

set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE="$(cd "$HERE/../../.." && pwd)"
cd "$SUITE" || exit 1

WIRE_PORT=21324
DEBUG_PORT=21325
WARD_PORT=21331
BASE_PORT="${WARD_SUITE_SYNC_BASE_PORT:-21350}"
RELAY_PORT=$BASE_PORT
QM_PORT=$((BASE_PORT + 1))
WM_PORT=$((BASE_PORT + 2))
WARDD_A_PORT=$((BASE_PORT + 3))
WARDD_B_PORT=$((BASE_PORT + 4))
QM_URL="http://127.0.0.1:$QM_PORT/"

port_bound() {
    if command -v ss >/dev/null 2>&1; then
        ss -lun 2>/dev/null | grep -qE "127\.0\.0\.1:$1\b"
    elif command -v netstat >/dev/null 2>&1; then
        netstat -lun 2>/dev/null | grep -qE "127\.0\.0\.1:$1\b"
    else
        return 0
    fi
}

if ! port_bound "$WIRE_PORT" || ! port_bound "$DEBUG_PORT"; then
    cat >&2 <<MSG
No debuglink emulator on udp $WIRE_PORT/$DEBUG_PORT. Start one with this script wrapped around it:

  xtask build firmware -e -d --pyopt false --model t3t1 --debug-link
  python3 core/emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-suite-sync.sh
MSG
    exit 1
fi
if port_bound "$WARD_PORT"; then
    echo "This is a SERVICE build (udp $WARD_PORT is bound): build without" >&2
    echo "--enable-ward-service-channel for this script." >&2
    exit 1
fi

failures=0
check() {
    local label="$1" expected="$2" got="$3"
    if grep -qE "$expected" <<<"$got"; then
        echo "  ok   $label"
    else
        echo "  FAIL $label -- expected /$expected/, got:"
        grep -vE "^\s*at |^\s*$" <<<"$got" | tail -12 | sed 's/^/         /'
        failures=$((failures + 1))
    fi
}

WORK="$(mktemp -d "${TMPDIR:-/tmp}/ward-suite-sync.XXXXXX")"
TOKEN_FILE="$WORK/token"
head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > "$TOKEN_FILE"
PIDS=()
cleanup() {
    for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null && wait "$pid" 2>/dev/null; done
    if [ "$failures" -gt 0 ]; then
        echo "logs kept in $WORK"
    else
        rm -rf "$WORK"
    fi
}
trap cleanup EXIT

# `node --import tsx`, not the tsx binary: that one spawns a child node, and stopping it would leave
# the daemon running with the port bound.
start() {
    local name="$1" ready="$2"
    shift 2
    node --import tsx "$@" > "$WORK/$name.log" 2>&1 &
    PIDS+=($!)
    for _ in $(seq 1 150); do
        grep -q "$ready" "$WORK/$name.log" 2>/dev/null && return 0
        sleep 0.1
    done
    echo "$name did not start:" >&2
    cat "$WORK/$name.log" >&2
    exit 1
}

echo "starting the relay and Quota Manager, the WM, and wardd hosts A and B"
start relay "quota manager on" packages/wardd/src/relayCli.ts --port "$RELAY_PORT" \
    --data-dir "$WORK/relay" --quota-manager-port "$QM_PORT"
start wm "listening" packages/wardd/src/wmCli.ts --port "$WM_PORT" --memory
for host in A B; do
    port=$WARDD_A_PORT
    [ "$host" = B ] && port=$WARDD_B_PORT
    start "wardd-$host" "listening" packages/wardd/src/cli.ts --port "$port" \
        --data-dir "$WORK/wardd-$host" --token-file "$TOKEN_FILE" --wm "http://127.0.0.1:$WM_PORT" \
        --relay "ws://127.0.0.1:$RELAY_PORT" --quota-manager "$QM_URL" --verbose
done

CLI="yarn workspace @trezor/connect-cli cli --udp --debuglink --debuglink-delay=5000ms"
A="--wardd=ws://127.0.0.1:$WARDD_A_PORT --wardd-token-file=$TOKEN_FILE"
B="--wardd=ws://127.0.0.1:$WARDD_B_PORT --wardd-token-file=$TOKEN_FILE"
FUND="--quota-manager=$QM_URL"
APPID="suite_sync_app"

# B's counter, asked until it reaches $1 (the relay carries A's records to B in the background).
# Further arguments go to the CLI: the first call passes $FUND, which hands wardd B the WARD owner
# secret to open its store with; later calls find the store open.
b_reaches() {
    local want="$1" out=""
    shift
    for _ in $(seq 1 10); do
        out="$(timeout 150 $CLI --method=ward_status $B "$@" 2>&1)"
        grep -qE "^\s*counter: $want," <<<"$out" && break
        sleep 2
    done
    printf '%s' "$out"
}

echo
echo "1. host A syncs; its unregistered WARD owner is funded from the device's quota"
SYNC="$(timeout 150 $CLI --method=ward_sync $A $FUND 2>&1)"
check "a fresh wallet reconciles at counter 0" "counter: 0" "$SYNC"
check "the owner was funded" "kind: 'allocated'" "$SYNC"
check "with one increment" "ownerTotalSpace: 65536" "$SYNC"
check "and the records replicate" "state: 'replicating'" "$SYNC"

echo "2. two changes through A reach host B"
for i in 1 2; do
    check "queued S$i" "queued: true" \
        "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="S$i" --value="s$i" 2>&1)"
done
FLUSH="$(timeout 300 $CLI --method=ward_flush $A $FUND 2>&1)"
check "both published, at counter 2" "counter: 2" "$FLUSH"
check "nothing waits" "waiting: 0" "$FLUSH"
OWNER="$(grep -oE "ownerId: '[^']+'" <<<"$FLUSH" | head -1 | cut -d"'" -f2)"
STORED="$(grep -oE "storedBytes: [0-9]+" <<<"$FLUSH" | head -1 | grep -oE "[0-9]+")"
check "B, the same wallet's second host, has them" "counter: 2," "$(b_reaches 2 $FUND)"

echo "3. storage used up: A's writes succeed and wait; B stays behind"
curl -s -X POST -H 'content-type: application/json' \
    -d "{\"ownerId\":\"$OWNER\",\"limit\":$((STORED + 300))}" "${QM_URL}dev/owner-limit" > /dev/null
for i in 3 4; do
    check "queued S$i" "queued: true" \
        "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="S$i" --value="s$i" 2>&1)"
done
# No funding on these calls, A's or B's: the point is what wardd reports while the owner is short.
FULL_FLUSH="$(timeout 300 $CLI --method=ward_flush $A 2>&1)"
check "both published anyway, at counter 4" "counter: 4" "$FULL_FLUSH"
FULL=""
for _ in $(seq 1 10); do
    FULL="$(timeout 150 $CLI --method=ward_status $A 2>&1)"
    grep -q "quota_full" <<<"$FULL" && break
    sleep 1
done
check "A reports the quota full" "reason: 'quota_full'" "$FULL"
check "with records waiting" "waiting: [1-9]" "$FULL"
check "and asks for storage" "needBytes: [1-9]" "$FULL"
check "B is still at 2" "counter: 2," "$(timeout 150 $CLI --method=ward_status $B 2>&1)"

echo "4. funded again: A resynchronizes and B receives everything"
FUNDED="$(timeout 150 $CLI --method=ward_status $A $FUND 2>&1)"
check "the owner was funded again" "kind: 'allocated'" "$FUNDED"
check "B reaches 4" "counter: 4," "$(b_reaches 4)"
AFTER="$(timeout 150 $CLI --method=ward_status $A 2>&1)"
check "nothing waits on A" "waiting: 0" "$AFTER"
check "A replicates" "state: 'replicating'" "$AFTER"

echo
if [ "$failures" -eq 0 ]; then
    echo "ALL OK"
else
    echo "$failures check(s) failed"
fi
exit "$failures"
