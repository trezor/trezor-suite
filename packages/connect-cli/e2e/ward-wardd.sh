#!/usr/bin/env bash
#
# WARD THROUGH wardd, end to end, on a CONNECT build: the local WARD service holds the replica and
# drives the device, and every binding only carries messages on the session it already holds.
#
# THE ARC:
#   A. emulator A through connect-cli --wardd (Connect's wardRelay):
#      sync at genesis -> queue two changes -> flush them one per transition -> status -> sync again
#      from a new session -> queue three -> flush them as ONE batched transition
#   B. a SECOND emulator, seeded like the first -- the same wallet, a second writer:
#      the Python binding (trezorlib.ward_relay) catches it up along the chain -> the Rust binding
#      (ward-relay's emulator example) syncs it -> it queues and flushes two changes of its own
#   C. back on A: it catches up along the chain across B's writes, and the Java binding opens the
#      same store and sees the head both devices left
#
# Part A runs on either wallet protocol. B and C need a CODEC (v1) wallet channel -- a t3t1 build --
# because the Rust pipe speaks codec v1 and trezorlib would need a THP pairing of its own; on a
# t3w1 they are skipped and the script says so.
#
# Run it with the emulator wrapped around it, because emu.py exits when its stdin closes:
#
#   cd <trezor-firmware>
#   xtask build firmware -e -d --pyopt false --model t3t1 --debug-link
#   python3 core/emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-wardd.sh
#
# -s matters: emulator B is started with the same SLIP-14 seed, which is what makes it the same
# wallet. Not a service build (--ward-service-channel): there the device talks to its own daemon and
# wardd's relay has nothing to carry -- `ward-queue.sh` covers that build.
#
# wardd runs with --memory (a fresh replica and dev WM per run); its Evolu store is covered by its
# unit tests. Run from a trezor-suite checkout with `yarn` done; needs node, python3, cargo and a
# JDK 17+ for parts B and C.
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
PEER_PORT=21424
WARDD_PORT="${WARDD_PORT:-21339}"
WARDD_URL="ws://127.0.0.1:$WARDD_PORT"

# The firmware checkout: emu.py exports TREZOR_SRC (its core/src); otherwise say it.
if [ -z "${TREZOR_FIRMWARE:-}" ] && [ -n "${TREZOR_SRC:-}" ]; then
    TREZOR_FIRMWARE="$(cd "$TREZOR_SRC/../.." && pwd)"
fi
if [ -z "${TREZOR_FIRMWARE:-}" ] || [ ! -d "$TREZOR_FIRMWARE/python/src/trezorlib" ]; then
    echo "Run under emu.py, or set TREZOR_FIRMWARE to the trezor-firmware checkout." >&2
    exit 1
fi
export TREZOR_FIRMWARE

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
  python3 core/emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-wardd.sh
MSG
    exit 1
fi
if port_bound "$WARD_PORT"; then
    echo "This is a SERVICE build (udp $WARD_PORT is bound): the device has its own daemon, so there" >&2
    echo "is nothing for wardd's relay to carry. Use ward-queue.sh for it, or build without" >&2
    echo "--ward-service-channel for this script." >&2
    exit 1
fi

# Which protocol the wallet interface speaks -- see ward-queue.sh for why the FAILURE CODE, not the
# framing, is the answer.
wallet_protocol() {
    python3 - "$WIRE_PORT" <<'PROBE'
import socket, struct, sys
header = b"?##" + struct.pack(">HL", 0xFEFE, 0)
report = header + b"\x00" * (64 - len(header))
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.settimeout(1.0)
sock.connect(("127.0.0.1", int(sys.argv[1])))
answer = "unknown"
for _ in range(3):
    try:
        sock.send(report)
        reply = sock.recv(64)
    except OSError:
        continue
    if len(reply) < 9 or reply[:3] != b"?##":
        continue
    _t, n = struct.unpack(">HL", reply[3:9])
    payload = reply[9 : 9 + n]
    if len(payload) < 2 or payload[0] != 0x08:
        continue
    answer = "thp" if payload[1] == 17 else "v1"
    break
print(answer)
PROBE
}
WALLET="$(wallet_protocol)"
if [ "$WALLET" = unknown ]; then
    echo "The wallet interface on udp $WIRE_PORT did not say which protocol it speaks; try again." >&2
    exit 1
fi

failures=0
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

WORK="$(mktemp -d "${TMPDIR:-/tmp}/ward-wardd.XXXXXX")"
TOKEN_FILE="$WORK/token"
head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > "$TOKEN_FILE"
WARDD_PID=""
PEER_PID=""
cleanup() {
    [ -n "$WARDD_PID" ] && kill "$WARDD_PID" 2>/dev/null && wait "$WARDD_PID" 2>/dev/null
    # emulator B runs in its own process group, so the emulator goes with emu.py
    [ -n "$PEER_PID" ] && kill -TERM -- "-$PEER_PID" 2>/dev/null && wait "$PEER_PID" 2>/dev/null
    rm -rf "$WORK"
}
trap cleanup EXIT

# `node --import tsx`, not the tsx binary: that one spawns a child node, and stopping it would leave
# the daemon running with the port bound.
echo "starting wardd on $WARDD_URL (in memory)"
node --import tsx packages/wardd/src/cli.ts --memory --port "$WARDD_PORT" \
    --data-dir "$WORK" --token-file "$TOKEN_FILE" > "$WORK/wardd.log" 2>&1 &
WARDD_PID=$!
for _ in $(seq 1 100); do
    grep -q "listening" "$WORK/wardd.log" 2>/dev/null && break
    sleep 0.1
done
if ! grep -q "listening" "$WORK/wardd.log"; then
    echo "wardd did not start:" >&2
    cat "$WORK/wardd.log" >&2
    exit 1
fi

CLI_BASE="yarn workspace @trezor/connect-cli cli --udp --debuglink --debuglink-delay=5000ms"
if [ "$WALLET" = thp ]; then
    CLI="$CLI_BASE --pairing=skip --autoconnect"
else
    CLI="$CLI_BASE"
fi
WARDD="--wardd=$WARDD_URL --wardd-token-file=$TOKEN_FILE"
CLI_STATE="$SUITE/packages/connect-cli/src/thp-state.dat"
APPID="wardd_app"

echo
echo "== A. emulator A through connect-cli --wardd ($WALLET wallet channel)"

if [ "$WALLET" = thp ]; then
    echo "A0. pair once, so every call below is the SAME app to the device (the WARD app pin)"
    rm -f "$CLI_STATE"
    PAIRED="$(timeout 150 $CLI_BASE --pairing=code --method=get-credentials 2>&1)"
    if [ ! -s "$CLI_STATE" ]; then
        echo "Pairing produced no credential:" >&2
        grep -vE "^\s*at |^\s*$" <<<"$PAIRED" | tail -8 >&2
        exit 1
    fi
    echo "  ok   paired"
fi

echo "A1. sync at genesis: wardd enrols the wallet with its dev WM and the device reconciles"
check "a fresh wallet reconciles at counter 0" "counter: 0" \
    "$(timeout 150 $CLI --method=ward_sync $WARDD 2>&1)"

echo "A2. queue two changes on the device"
for i in 1 2; do
    check "queued A$i" "queued: true" \
        "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="A$i" --value="a$i" 2>&1)"
done

echo "A3. flush through wardd: one change per transition, each stored, published and synced"
FLUSH="$(timeout 300 $CLI --method=ward_flush $WARDD 2>&1)"
check "both published" "published: 2" "$FLUSH"
check "the head is at counter 2" "counter: 2" "$FLUSH"
check "nothing left queued" "remaining: 0" "$FLUSH"

echo "A4. status: the replica and the WM agree"
STATUS="$(timeout 150 $CLI --method=ward_status $WARDD 2>&1)"
check "replica at 2" "counter: 2" "$STATUS"
check "WM at 2" "wmCounter: 2" "$STATUS"

echo "A5. sync again, from a new session: the device is already at the head"
check "a second session reconciles at 2" "how: 'reconcile'" \
    "$(timeout 150 $CLI --method=ward_sync $WARDD 2>&1)"

echo "A6. queue three, flush them as ONE batched transition"
for i in 3 4 5; do
    check "queued A$i" "queued: true" \
        "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="A$i" --value="a$i" 2>&1)"
done
BATCH="$(timeout 300 $CLI --method=ward_flush $WARDD --batch=8 2>&1)"
check "one transition published" "published: 1" "$BATCH"
check "carrying three changes: counter 2 -> 5" "counter: 5" "$BATCH"

if [ "$WALLET" != v1 ]; then
    echo
    echo "B/C skipped: they need a codec (v1) wallet channel -- build --model t3t1 for them."
else
    echo
    echo "== B. a second emulator, the SAME wallet (SLIP-14), through the Python and Rust bindings"
    # setsid: emulator B gets its own process group, so cleanup stops emu.py AND the emulator
    env -u TREZOR_PROFILE_DIR -u TREZOR_UDP_PORT setsid python3 "$TREZOR_FIRMWARE/core/emu.py" -q -a -t -s -P "$PEER_PORT" -c -- sleep 100000 \
        > "$WORK/peer-emu.log" 2>&1 < /dev/null &
    PEER_PID=$!
    for _ in $(seq 1 150); do
        port_bound "$PEER_PORT" && port_bound "$((PEER_PORT + 1))" && break
        sleep 0.2
    done
    PY="python3"
    [ -x "$TREZOR_FIRMWARE/.venv/bin/python" ] && PY="$TREZOR_FIRMWARE/.venv/bin/python"
    PEER="$PY $HERE/ward-wardd-peer.py --port $PEER_PORT --wardd $WARDD_URL --token-file $TOKEN_FILE"

    WARD_ID_OUT="$(timeout 150 $PEER ward-id 2>&1)"
    check "emulator B is a fresh device of the same wallet" '"counter": 0' "$WARD_ID_OUT"
    WARD_ID="$(sed -nE 's/.*"ward_id": "([0-9a-f]+)".*/\1/p' <<<"$WARD_ID_OUT")"

    echo "B1. Python binding: B catches up from 0 to 5 by walking A's chain back"
    SYNC_B="$(timeout 150 $PEER sync 2>&1)"
    check "verified along the chain" '"how": "verifyChain"' "$SYNC_B"
    check "and adopted counter 5" '"counter": 5' "$SYNC_B"

    echo "B2. Rust binding: the same device, a new session, reconciles at 5"
    cargo build -q --manifest-path "$TREZOR_FIRMWARE/rust/ward-relay/Cargo.toml" --features codec \
        --example emulator 2>"$WORK/cargo.log" || cat "$WORK/cargo.log"
    RUST_B="$(timeout 150 cargo run -q --manifest-path "$TREZOR_FIRMWARE/rust/ward-relay/Cargo.toml" \
        --features codec --example emulator -- sync --wardd "$WARDD_URL" --token-file "$TOKEN_FILE" \
        --emulator "127.0.0.1:$PEER_PORT" 2>&1)"
    check "reconciled at 5" '"counter":5' "$RUST_B"

    echo "B3. B writes: queue two, flush through wardd -- a second writer on the same history"
    for i in 1 2; do
        check "B queued P$i" '"queued": true' \
            "$(timeout 150 $PEER queue --appid peer_app --ident "P$i" --value "p$i" 2>&1)"
    done
    FLUSH_B="$(timeout 300 $PEER flush 2>&1)"
    check "B published two" '"published": 2' "$FLUSH_B"
    check "the head is at 7" '"counter": 7' "$FLUSH_B"

    echo
    echo "== C. back on A, which last saw counter 5"
    SYNC_A="$(timeout 150 $CLI --method=ward_sync $WARDD 2>&1)"
    check "A walks the chain across B's writes" "how: 'verifyChain'" "$SYNC_A"
    check "and adopts 7" "counter: 7" "$SYNC_A"

    echo "C1. Java binding: the same store, the same head"
    JR="$TREZOR_FIRMWARE/java/ward-relay"
    if "$JR/build.sh" > "$WORK/java-build.log" 2>&1; then
        JCP="$(ls "$JR"/.deps/*.jar | grep -v junit | paste -sd:):$JR/out/main"
        JAVA_OUT="$(timeout 60 java -cp "$JCP" "$HERE/WarddSmoke.java" "$WARDD_URL" "$TOKEN_FILE" "$WARD_ID" 2>&1)"
        check "Java sees counter 7" '"counter":7' "$JAVA_OUT"
        check "and the WM at 7" '"wmCounter":7' "$JAVA_OUT"
    else
        echo "  FAIL the Java binding did not build:"
        tail -10 "$WORK/java-build.log" | sed 's/^/         /'
        failures=$((failures + 1))
    fi
fi

echo
if [ "$failures" -eq 0 ]; then
    echo "ward wardd e2e ($WALLET wallet): all checks passed"
else
    echo "ward wardd e2e ($WALLET wallet): $failures check(s) FAILED"
    echo "wardd log:"
    sed 's/^/  /' "$WORK/wardd.log" | tail -20
fi
exit "$failures"
