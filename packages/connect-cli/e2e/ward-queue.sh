#!/usr/bin/env bash
#
# The WARD queue, end to end: queue a change, show it, back it up, discard it, put it back.
#
# ONE APP, PINNED. The device grants the WARD role to the first app that asks and refuses every
# other host from then on, so this script pairs once at step 0 and reuses that credential for every
# call -- the host static key is what the device pins, and it comes from the credential. Step 1b
# checks the other half by asking WITHOUT it. A run interrupted part way leaves the pin in place; the
# next run pairs afresh and would be refused, so wipe the emulator profile between runs (as this
# script already assumes) or clear the pin with `--method=ward_reset_app`.
#
# THIS SCRIPT STANDS IN FOR THE WARD APP, and `ward-service-daemon.py` beside it stands in for
# wardd. WARD has three parties: the app that invokes the user-facing operations -- over the WALLET
# channel, which is where they belong, since that app stands in for what a wallet will do itself --
# the device, and the replica owner behind the service channel. What the second channel keeps off the
# wallet connection is the replica traffic, not these calls. See `docs/core/misc/ward-channels.md` in
# trezor-firmware.
#
# BOTH VARIANTS LIVE HERE, and which one runs is decided by the binary rather than by a flag.
# Where a device gets WARD data from is a BUILD OPTION -- a CONNECT build asks the calling app over
# the channel it is already answering on, a SERVICE build asks a daemon on a dedicated interface,
# and no firmware does both. The queue is supposed to be indifferent to that: it is the device's OWN
# store. So this script detects the build it is talking to and runs the identical arc either way.
#
# On a service build it then does two more things, which are opposites and only mean something
# together: it holds a daemon on the WARD interface for the whole run and asserts that the offline
# arc asked it NOTHING, and it then goes ONLINE against that same daemon and asserts what it served.
# The first says the queue depends on no backend; the second says the separate channel actually
# works, and rules out a daemon nobody could reach.
#
# THE ONLINE HALF IS MOSTLY ABOUT WRITING, because that is what the dedicated channel is for and what
# no host can check for itself. A read that fails, fails on the device. A write is a conversation the
# calling app is not part of: the device pulls the current leaf from its daemon, seals a mutation,
# hands it over, and moves its head only when the WM's attestation for THAT counter comes back. From
# out here the only evidence is the daemon's log and what the NEXT operation no longer has to do, so
# both are asserted -- exchange by exchange, in order, and once inside a single session where the
# absence of a second sync is what proves the device adopted the head it published to.
#
# Run it against both builds to cover both; it says at the end which one it just covered and how to
# build the other.
#
# WHAT THIS PROVES that unit tests cannot. The blob is produced by the device and consumed by the
# device, and its MAC is what makes a restore acceptable -- so the only honest check of the pair is a
# real round trip against real firmware. It also pins the case sensitivity of --appid/--ident, which
# is silent when broken: a lowercased identifier derives a DIFFERENT entry_key, so the entry simply
# is not found and nothing says why.
#
# Run it with the emulator wrapped around it, because emu.py exits when its stdin closes:
#
#   cd <trezor-firmware>
#   xtask build firmware -e -d --pyopt false --model t3w1 --debug-link
#   python3 core/emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-queue.sh
#
# and for the SERVICE variant, the same with the interface built in:
#
#   xtask build firmware -e -d --pyopt false --model t3w1 --debug-link --ward-service-channel
#   python3 core/emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-queue.sh
#
# The service variant needs a trezorlib for the daemon beside this file, plus the device tests'
# WARD helpers from a checkout. Run under emu.py -- as above -- and both are found on their own:
# emu.py exports TREZOR_SRC, which names the checkout the emulator was built from. Only a run that
# does NOT go through emu.py has to say where the checkout is, with TREZOR_FIRMWARE.
#
# Either model works. t3w1 gives a THP wallet channel and t3t1 a codec one; the WARD interface
# speaks codec v1 on both, so the wallet protocol is a separate axis and this script probes it. What
# it changes is only pairing and the app pin, which are THP mechanisms. --debug-link either way,
# because every step here shows a screen that has to be confirmed.
#
# NOTE the CLI exits 1 on success (pre-existing behaviour: it prints the result and exits), so this
# script asserts on OUTPUT rather than exit codes, and cannot use `set -e`.

set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUITE="$(cd "$HERE/../../.." && pwd)"
cd "$SUITE" || exit 1

# The WARD interface is the wire port plus the offset trezorlib publishes (21324 + 7). Named here
# and looked up there, so if it ever moves the daemon fails to bind and says so, rather than this
# script quietly deciding it is talking to a connect build.
WIRE_PORT=21324
DEBUG_PORT=21325
WARD_PORT=21331

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

if ! port_bound "$WIRE_PORT"; then
    cat >&2 <<MSG
No emulator is listening on udp $WIRE_PORT. Start one with this script wrapped around it:

  cd <trezor-firmware>
  python3 core/emu.py -q -a -t -s -c bash <trezor-suite>/packages/connect-cli/e2e/ward-queue.sh

(emu.py exits when its stdin closes, so it has to wrap the script rather than run beside it.)
MSG
    exit 1
fi

if ! port_bound "$DEBUG_PORT"; then
    cat >&2 <<MSG
An emulator is running but it binds no DEBUGLINK port (udp $DEBUG_PORT), so nothing can confirm the
screens this script walks through -- every step that shows one would fail. Rebuild it with debuglink:

  xtask build firmware -e -d --pyopt false --model t3w1 --debug-link

(plain \`make build_unix\` binds no debug port. Either model works: t3w1 gives a THP wallet channel
and t3t1 a codec one, and this script probes which it got -- see \`wallet_protocol\`.)
MSG
    exit 1
fi

# WHICH VARIANT IS IN FRONT OF US, PROBED RATHER THAN ASKED. The device does not report which
# transport it serves WARD over, deliberately -- a host that had to be told could be lied to about
# it. A bound interface is the only honest evidence, and it is the same evidence
# `tests/ward_service.py` uses.
if port_bound "$WARD_PORT"; then
    VARIANT=service
else
    VARIANT=connect
fi

# WHICH PROTOCOL THE WALLET INTERFACE SPEAKS, which is a SEPARATE AXIS from the variant above and
# has to be asked separately now that it is. The WARD interface speaks codec v1 on every build, so
# "this is a service build" says nothing about the wallet side: a t3w1 has a THP wallet channel and
# a codec service endpoint, and a t3t1 has codec on both.
#
# What the answer decides is only whether this run has a HOST IDENTITY to keep. Pairing and the app
# pin are THP mechanisms; on v1 the device cannot tell one connected application from another at
# all, and asks the user per operation instead.
#
# THE FRAMING OF THE REPLY IS NOT THE ANSWER, which is the trap here. A THP device answers
# protocol-v1 framing with a protocol-v1 `Failure(InvalidProtocol)` on purpose -- that is how it
# tells a v1 host what it is -- so both kinds of device answer with `?##`. The failure CODE is what
# separates them.
wallet_protocol() {
    python3 - "$WIRE_PORT" <<'PROBE'
import socket
import struct
import sys

_INVALID_PROTOCOL = 17  # FailureType.InvalidProtocol
_REPORT_LEN = 64

header = b"?##" + struct.pack(">HL", 0xFEFE, 0)  # a wire type registered nowhere
report = header + b"\x00" * (_REPORT_LEN - len(header))

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.settimeout(1.0)
sock.connect(("127.0.0.1", int(sys.argv[1])))

answer = "unknown"
for _attempt in range(3):
    try:
        sock.send(report)
        reply = sock.recv(_REPORT_LEN)
    except OSError:
        continue
    if len(reply) < 9 or reply[:3] != b"?##":
        continue
    _mtype, msize = struct.unpack(">HL", reply[3:9])
    payload = reply[9 : 9 + msize]
    # A `Failure` puts `code` in field 1, so the payload begins with the varint key 0x08. Every
    # code involved here is a single byte.
    if len(payload) < 2 or payload[0] != 0x08:
        continue
    answer = "thp" if payload[1] == _INVALID_PROTOCOL else "v1"
    break

print(answer)
PROBE
}

WALLET="$(wallet_protocol)"
# Only for the hints printed at the end: suggest a model that keeps the wallet side as it is, so
# switching variant does not silently switch protocol too.
if [ "$WALLET" = v1 ]; then
    MODEL_HINT=t3t1
else
    MODEL_HINT=t3w1
fi
if [ "$WALLET" = unknown ]; then
    cat >&2 <<MSG
The wallet interface on udp $WIRE_PORT answered nothing that says which protocol it speaks, so this
run cannot tell whether to pair. That is a setup problem rather than a device one -- try again, and
if it persists check that nothing else is talking to the emulator.
MSG
    exit 1
fi

# Mixed case on purpose: these two are hashed into the entry_key and must survive verbatim.
APPID="btc_app"
IDENT="Addr1"
VALUE="queued_secret"
# The online arcs write their own entries rather than reusing the one the offline arc moves around:
# a step that published over a key the queue steps also touch would leave "which store answered
# this?" ambiguous exactly where the two stores have to stay distinguishable.
IDENT2="Addr2"
VALUE2="published_secret"
FIDENT1="Flush1"
FVALUE1="flushed_first"
FIDENT2="Flush2"
FVALUE2="flushed_second"

# ONE IDENTITY FOR THE WHOLE RUN, and it is not optional any more. The device PINS the first app to
# send it a WARD message and refuses every other host from then on (apps/ward/app_role.py) -- so a
# script whose every invocation presented a fresh key would grant the role to step 1 and be refused
# by step 2.
#
# THE PIN FOLLOWS THE HOST STATIC KEY, and that key comes from a stored credential: connect uses
# `credentials.host_static_key` when it has one and `randomBytes(32)` when it does not (see
# `handleHandshakeInit` in packages/protocol). So the run pairs ONCE below, keeps the credential in
# `src/thp-state.dat`, and passes --autoconnect everywhere -- which is also what a real app does.
#
# --pairing=skip STAYS, and it is not in conflict: it decides how a channel PAIRS, while the static
# key is chosen before that from whatever credential was loaded. Skipping keeps the run headless
# after the one real pairing below.
CLI="yarn workspace @trezor/connect-cli cli --udp --debuglink --debuglink-delay=5000ms --pairing=skip --autoconnect"
# The pairing run itself, which cannot skip -- skipped pairing issues no credential.
CLI_PAIR="yarn workspace @trezor/connect-cli cli --udp --debuglink --debuglink-delay=5000ms --pairing=code"
# Where connect-cli keeps what it is told to remember. Wiped before pairing, because a credential
# from a previous emulator names a Trezor static key this one does not have: the handshake would not
# match it, would fall back to a random host key, and the pin would refuse the second call in.
CLI_STATE="$SUITE/packages/connect-cli/src/thp-state.dat"
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

# The other direction: some checks are about what must NOT be in the output. Same whole-output grep,
# because the thing being ruled out could appear anywhere in it.
check_not() {
    local label="$1" forbidden="$2" got="$3"
    if grep -qE "$forbidden" <<<"$got"; then
        echo "  FAIL $label -- /$forbidden/ must not appear, but did:"
        grep -E "$forbidden" <<<"$got" | head -3 | sed 's/^/         /'
        failures=$((failures + 1))
    else
        echo "  ok   $label"
    fi
}

# --- the service variant's extra apparatus ----------------------------------------------------
#
# ON A SERVICE BUILD ONLY, and it is set up BEFORE the arc rather than after, because one of the
# assertions it exists for is about the arc: with a daemon bound and listening the whole time,
# nothing offline may reach it. Binding matters as much as listening -- an UNBOUND interface is a
# different state, one where every WARD read fails for want of a daemon, so a queue read passing
# against it would be passing for the wrong reason. The online read at the end is the other
# assertion, and it needs this same daemon to answer for real.
DAEMON_LOG=""
DAEMON_KEY=""
DAEMON_STATE=""
DAEMON_PID=""
# How many times the daemon has bound, because `start_daemon` waits for a COUNT of BOUND lines in an
# appended log and every restart raises it. Tracked here rather than passed in at each call site: the
# number is a property of the run, and a hardcoded one at the third restart is a hang.
BINDS=0

# The daemon holds the interface for as long as it runs, and a stray one would keep the NEXT run
# from binding -- the device tracks one channel per interface. So it is torn down on every exit
# path, not just the happy one.
stop_daemon() {
    if [ -n "$DAEMON_PID" ] && kill -0 "$DAEMON_PID" 2>/dev/null; then
        kill -TERM "$DAEMON_PID" 2>/dev/null
        wait "$DAEMON_PID" 2>/dev/null
    fi
    DAEMON_PID=""
}
# The key file is the daemon's identity for the length of this run only; the device pinned it, and
# the next run gets a fresh emulator profile and pins whatever the next daemon presents.
cleanup() {
    stop_daemon
    [ -n "$DAEMON_KEY" ] && rm -f "$DAEMON_KEY"
    [ -n "$DAEMON_STATE" ] && rm -f "$DAEMON_STATE"
}
trap cleanup EXIT

# APPENDS to the log, because this is called more than once -- see step 22 -- and the offline
# arc's evidence must not be erased by the restart that follows it.
#
# --debug-port as well as --port: the daemon has ONE screen of its own, the pairing confirmation,
# and it presses it over debuglink the same way the CLI presses its own. Both ports come from this
# script so the two hosts cannot end up aiming at different emulators. --key-file is what makes a
# restart possible at all: the device pins the daemon's static key in flash, so a daemon that comes
# back with a fresh one is refused rather than merely unrecognised.
start_daemon() {
    python3 "$HERE/ward-service-daemon.py" --port "$WIRE_PORT" --debug-port "$DEBUG_PORT" \
        --key-file "$DAEMON_KEY" --state-file "$DAEMON_STATE" \
        > >(tee -a "$DAEMON_LOG") 2>&1 &
    DAEMON_PID=$!

    # Waited for rather than slept on: the handshake, the pairing and the announce take an
    # unpredictable moment, and a fixed sleep would either waste it or race it. The count of BOUND
    # lines is what is waited for, so a second bind is not satisfied by the first one's line.
    local want="$1"
    for _ in $(seq 1 60); do
        if [ "$(grep -c '^BOUND ' "$DAEMON_LOG" 2>/dev/null)" -ge "$want" ]; then
            return 0
        fi
        if ! kill -0 "$DAEMON_PID" 2>/dev/null; then
            break
        fi
        sleep 0.5
    done

    return 1
}

# STOP AND COME BACK, as the same daemon, with the same replica. Called between the online arcs
# below and NOT as a repair: THP keeps ten app-data channels (MAX_CHANNELS_APPDATA in
# core/embed/rust/src/thp/mod.rs) and every CLI invocation here opens one, so a daemon that stays
# bound for a dozen of them is displaced part way through an arc -- and the failure lands on whatever
# step was unlucky rather than on the cause. Restarting on purpose, at boundaries this script
# chooses, keeps each arc inside the budget.
#
# WHAT MAKES IT LEGITIMATE is the state file: --key-file brings back the same IDENTITY (the device
# pinned that key) and --state-file brings back the same REPLICA and the same WM heads. A daemon that
# came back empty would be offering a wallet at genesis to a device that has published, which is not
# a restart but a different daemon wearing the same key.
refresh_daemon() {
    stop_daemon
    BINDS=$((BINDS + 1))
    if start_daemon "$BINDS"; then
        return 0
    fi

    echo "  FAIL the daemon did not come back:"
    sed 's/^/         /' "$DAEMON_LOG" | tail -8
    failures=$((failures + 1))

    return 1
}

# WHERE THE LOG IS NOW, so an arc can assert on ITS OWN exchanges. The log is appended to across
# restarts on purpose -- step 21 needs the whole offline arc's evidence -- which means a bare grep
# from here on would also match everything before it, and "the write did a sync" would pass on a
# sync some earlier step performed.
mark_log() {
    grep -c "" "$DAEMON_LOG" 2>/dev/null || echo 0
}

# The exchanges served since a mark, as `Request -> Reply` joined by commas: one line, so a whole
# sequence can be asserted EXACTLY rather than by checking that each part appears somewhere. Order
# and count are half of what these arcs are about -- "it fetched once" and "it fetched twice" are
# different claims, and only an exact match separates them.
served_since() {
    tail -n +"$(($1 + 1))" "$DAEMON_LOG" |
        sed -nE 's/^SERVED [0-9?]+ ([A-Za-z]+) -> ([A-Za-z]+).*/\1 -> \2/p' |
        paste -sd, -
}

if [ "$WALLET" = thp ]; then
    echo "0. pair once, so every call below is the SAME app to the device"
    # THE ROLE IS GRANTED ONCE AND HELD FOR THE RUN. The first WARD request pins this app after a
    # held confirmation (--debuglink presses it), and every later request is silent -- so nothing
    # below has to know the pin exists. What would go wrong without this step is not subtle: step 2
    # would be refused as "another application".
    rm -f "$CLI_STATE"
    PAIRED="$(timeout 150 $CLI_PAIR --method=get-credentials 2>&1)"
    if [ ! -s "$CLI_STATE" ]; then
        cat >&2 <<MSG
Pairing produced no credential, so every invocation below would present a different host key and the
device would refuse all but the first. Its output:

$(grep -vE "^\s*at |^\s*$" <<<"$PAIRED" | tail -8 | sed 's/^/  /')
MSG
        exit 1
    fi
    echo "  ok   credential stored in src/thp-state.dat -- the run is one app from here on"
else
    # NOTHING TO PAIR, AND NOTHING TO PIN. A codec transport carries no handshake, so the device
    # cannot tell one connected application from another by any means -- not weakly, not at all --
    # and the app pin does not exist here. What replaces it is what v1 has always used instead of
    # identity: the user, per operation, on the device's own screen. Every step below that shows a
    # screen is therefore unchanged; only this one and 1b have nothing to assert.
    echo "0. no pairing on a v1 wallet channel -- there is no host identity to keep"
fi

if [ "$VARIANT" = service ]; then
    echo "0b. this is a SERVICE build -- bind a daemon to the WARD interface (udp $WARD_PORT)"
    DAEMON_LOG="$(mktemp "${TMPDIR:-/tmp}/ward-service-daemon.XXXXXX.log")"
    DAEMON_KEY="$(mktemp -u "${TMPDIR:-/tmp}/ward-service-daemon.XXXXXX.key")"
    DAEMON_STATE="$(mktemp -u "${TMPDIR:-/tmp}/ward-service-daemon.XXXXXX.state")"

    BINDS=1
    if ! start_daemon "$BINDS"; then
        cat >&2 <<MSG
The daemon never bound the WARD interface, so the service variant cannot be checked. Its log:

$(sed 's/^/  /' "$DAEMON_LOG")

Under emu.py it finds trezorlib and the WARD helpers itself (emu.py exports TREZOR_SRC). Outside
it, set TREZOR_FIRMWARE to a trezor-firmware checkout.
MSG
        exit 1
    fi
    echo "  ok   daemon bound -- the offline arc below must not reach it, step 23 must"
fi

echo "1. queue a change"
check "queued" "queued: true" \
    "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="$IDENT" --value="$VALUE" 2>&1)"

if [ "$WALLET" = thp ]; then
echo "1b. a DIFFERENT app is refused, now that this one holds the role"
# THE PIN, SEEN FROM THE OUTSIDE, and it needs step 1 to have happened first: the role is granted on
# the first WARD request, so before that a credential-less caller would simply be granted it. Run
# without --autoconnect the CLI has no credential to take a static key from and generates a fresh
# one, which is exactly what another application looks like to the device.
#
# REFUSED, NOT ASKED. If the device offered a takeover screen here, any host could summon it by
# asking -- so what is asserted is a failure naming the role, and no queued change appearing behind
# our back.
OTHER="$(timeout 150 yarn workspace @trezor/connect-cli cli --udp --debuglink --pairing=skip --method=ward_display --queue --appid="$APPID" --ident="$IDENT" 2>&1)"
check "the other app was refused by name" "another application holds the WARD app role" "$OTHER"
check_not "and it read nothing" "displayed: true" "$OTHER"
else
    # SKIPPED RATHER THAN INVERTED. There is no second app to be, because there is no first: the
    # device pins nobody on v1, so a caller with a fresh key is not "another application" but the
    # same anonymous one. Asserting the opposite here would pin behaviour this build does not have.
    echo "1b. no app pin on a v1 wallet channel -- every caller is equally anonymous"
fi

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

echo "11. the compact form: a hash of the identity instead of the identity"
# The device keeps ~47 bytes less per record and gives up being able to say whose the record is. The
# property worth checking from out here is that NOTHING ELSE CHANGES: it reads, it backs up, and the
# blob it backs up to is byte-for-byte what the full form produces -- the identity in it comes from
# the request either way, and the MAC covers the same fields.
check "queued compactly" "queued: true" \
    "$(timeout 150 $CLI --method=ward_add --queue --compact --appid="$APPID" --ident=Compact1 --value=compact_secret 2>&1)"

eval "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident=Compact1 --target=CBLOB 2>/dev/null | grep -E '^CBLOB=0x[0-9a-f]+$')"
check "a compact record still backs up" "^0x[0-9a-f]{40,}$" "${CBLOB:-}"

echo "12. the same entry stored FULL backs up to the same bytes"
check "queued fully" "queued: true" \
    "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident=Compact1 --value=compact_secret 2>&1)"
eval "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident=Compact1 --target=FBLOB 2>/dev/null | grep -E '^FBLOB=0x[0-9a-f]+$')"
check "the blob does not reveal which form the record was in" "^${CBLOB:-x}$" "${FBLOB:-y}"

echo "13. restoring compactly, from the blob alone"
check "restored" "restored: true" \
    "$(timeout 150 $CLI --method=ward_restore --queue --compact --entry="${CBLOB:-none}" 2>&1)"
check "and it reads back" "^0x[0-9a-f]{40,}$" \
    "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident=Compact1 --target=AFTER 2>/dev/null | grep -oE '0x[0-9a-f]+')"

echo "14. a compact record is discarded like any other"
check "discarded" "discarded: true" \
    "$(timeout 150 $CLI --method=ward_delete --queue --appid="$APPID" --ident=Compact1 2>&1)"
check "gone" "missing: true" \
    "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident=Compact1 2>&1)"

# ---------------------------------------------------------------------------------------------
# ward_display: the same store, read for a PERSON rather than for a backup.
#
# WHY IT IS HERE AND NOT IN A FILE OF ITS OWN. Display and backup are the same wire request --
# WardQueueGetEntry -- and differ only in what the host does with the ack, so the way to show that
# the display is honest is to run it against the queue this script has already been moving around:
# it must say "pending" for a change nobody has published, "missing" the moment that change is
# discarded, and the same value again once the backup is restored. Read on its own it could show
# a stale value and nothing would notice.
#
# The device screen is confirmed over debuglink like every other step; --debuglink resolves it.
DIDENT="Display1"
DVALUE="display_secret"

echo "15. display what the device holds for a queued change"
check "queued" "queued: true" \
    "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="$DIDENT" --value="$DVALUE" 2>&1)"
DSHOWN="$(timeout 150 $CLI --method=ward_display --queue --appid="$APPID" --ident="$DIDENT" 2>&1)"
check "displayed" "displayed: true" "$DSHOWN"
check "the value it shows is the value that was queued" "value: '$DVALUE'" "$DSHOWN"
# The distinction the device makes on screen, reported rather than flattened: this is what THIS
# device believes and no host has taken, not something WARD holds.
check "reported as still pending" "pending: true" "$DSHOWN"

echo "16. a display is not an export"
# The ack carries the restore MAC -- the request is the same one ward_backup makes -- and the whole
# point of the separate command is that it does not hand it back. Asserted rather than assumed,
# because the day it starts printing one, every look at an entry silently becomes an export.
check_not "no MAC" "mac:" "$DSHOWN"
check_not "no restorable blob" "0x[0-9a-f]{40,}" "$DSHOWN"

echo "17. back the displayed change up, discard it, and the display says so"
eval "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident="$DIDENT" --target=DBLOB 2>/dev/null | grep -E '^DBLOB=0x[0-9a-f]+$')"
check "blob captured" "^0x[0-9a-f]{40,}$" "${DBLOB:-}"
check "discarded" "discarded: true" \
    "$(timeout 150 $CLI --method=ward_delete --queue --appid="$APPID" --ident="$DIDENT" 2>&1)"
check "nothing left to display" "missing: true" \
    "$(timeout 150 $CLI --method=ward_display --queue --appid="$APPID" --ident="$DIDENT" 2>&1)"

echo "18. restore it, and the SAME value is on screen again"
# What the round trip is actually for. Step 8 proved the restored change can be backed up again,
# which is a statement about bytes; this is the statement about the value -- the device shows the
# user what it showed before, from a blob and a MAC alone.
check "restored" "restored: true" \
    "$(timeout 150 $CLI --method=ward_restore --queue --entry="${DBLOB:-none}" 2>&1)"
DAGAIN="$(timeout 150 $CLI --method=ward_display --queue --appid="$APPID" --ident="$DIDENT" 2>&1)"
check "the value survived the round trip" "value: '$DVALUE'" "$DAGAIN"
check "and it is pending again" "pending: true" "$DAGAIN"

echo "19. without --queue it refuses instead of quietly reading the local copy"
# The security property `apps.ward.get_entry` is built around, seen from the host: an ONLINE read
# is pulled from the host and checked against a synced session, and there is no path by which
# failing to have one turns into "here is the device's copy". The CLI says which read it cannot do.
check "online read refused" "not wired yet" \
    "$(timeout 150 $CLI --method=ward_display --appid="$APPID" --ident="$DIDENT" 2>&1)"

echo "20. tidy up after the display arc"
check "discarded" "discarded: true" \
    "$(timeout 150 $CLI --method=ward_delete --queue --appid="$APPID" --ident="$DIDENT" 2>&1)"

if [ "$VARIANT" = service ]; then
    echo "21. nothing above went anywhere near the daemon"
    # THE FIRST HALF OF WHAT THIS BUILD IS FOR. Every step so far read or wrote the device's own
    # store, so a request on the service channel would mean the queue had started depending on a
    # backend -- silently, since the CLI's output would look exactly the same. Checked before the
    # reconnect below, so it is the log of the daemon that was up THROUGHOUT the arc.
    check_not "the offline arc asked the daemon nothing" "^SERVED " "$(cat "$DAEMON_LOG")"

    echo "22. reconnect the daemon, whose channel the arc has displaced by now"
    # NOT A WORKAROUND -- THE THING A REAL DAEMON MUST DO. THP keeps TEN app-data channels
    # (MAX_CHANNELS_APPDATA in core/embed/rust/src/thp/mod.rs) and every CLI invocation above opened
    # one, so the arc has displaced the daemon's several times over, after which the device finds its
    # bound channel gone and a fetch fails with "THP channel is no longer open". A wardd that is up
    # for days meets this constantly, and the answer is to come back -- as THE SAME daemon, which is
    # what --key-file is for: the device pinned that key in flash and refuses any other.
    if refresh_daemon; then
        echo "  ok   rebound with the same pinned key"
    fi

    echo "23. and now an ONLINE read, which must go through the daemon"
    # THE OTHER HALF, and the only step here that is not offline. --service says what the device
    # cannot be asked: that WARD is served over its own interface, so the read needs no host store
    # -- the device syncs with the daemon, fetches the leaf and verifies what came back against the
    # root it just adopted. All of that happens out of this host's sight, which is why the daemon's
    # log is the evidence and the CLI's "displayed" is only the receipt.
    #
    # THE REPLICA IS EMPTY, so the honest answer is "no such entry" -- and that answer is a
    # NON-MEMBERSHIP PROOF the device checks against the root, not a word the daemon is trusted
    # on. A broken channel, a daemon of the wrong wallet or a forged proof all fail here.
    MARK="$(mark_log)"
    ONLINE="$(timeout 150 $CLI --method=ward_display --service --appid="$APPID" --ident="$IDENT" 2>&1)"
    check "the device performed the read" "onDevice: true" "$ONLINE"

    echo "24. the daemon's own log says what it was asked, and in what order"
    # THE SEQUENCE, NOT A SET. The sync comes FIRST because on this build the device drives it itself
    # when a WARD operation needs one, rather than failing and telling the host to go and sync -- and
    # asserting the whole line at once is what makes that an assertion about order. Two exchanges and
    # no more: a read is one fetch, and a second one would mean the first came back unusable.
    check "sync, then fetch, and nothing else" \
        "^WardSyncRequest -> WardSyncResponse,WardServiceFetch -> WardEntryAck$" \
        "$(served_since "$MARK")"

    # ---------------------------------------------------------------------------------------------
    # PUBLICATION. Everything above this line reads -- the device's own store, or the daemon's
    # replica -- and reading is the half of the service channel that cannot go wrong quietly: a
    # broken proof fails on the device. What follows WRITES, which is the behaviour the dedicated
    # channel exists for and the one no host can check for itself, because the whole exchange happens
    # out of this host's sight: the device pulls the current leaf from its daemon, seals a mutation,
    # hands it over, and moves its head only when the WM's attestation for THAT counter comes back.
    #
    # Each arc restarts the daemon first. See `refresh_daemon`: the channel budget is ten and this
    # script spends one per CLI invocation, so the restarts are how each arc gets a channel that
    # survives it. The replica and the WM heads carry over in the state file, which is what makes a
    # restart a restart rather than a new daemon.

    echo "25. an ONLINE WRITE: the device publishes to the daemon and waits to hear it stuck"
    refresh_daemon
    MARK="$(mark_log)"
    WROTE="$(timeout 150 $CLI --method=ward_add --service --appid="$APPID" --ident="$IDENT" --value="$VALUE" 2>&1)"
    check "the device applied it" "applied: true" "$WROTE"
    # COUNTER 1, from a device that has published nothing before: the head moves exactly once per
    # publication, and it moves because the WM attested this counter -- not because the daemon
    # acknowledged receipt. A fresh emulator profile is what makes the number itself checkable, and
    # this script assumes one throughout.
    check "the head moved to 1" "counter: 1" "$WROTE"
    # NO LEAF CAME BACK, and this is the assertion the message split exists for: on this build the
    # calling app does not own the replica, so a leaf here would be a second copy going stale from
    # the next write on -- and `apply` reads an absent content body as a DELETION, so an emptied
    # WardLeafAck would have erased the entry it just wrote.
    check_not "and handed back no leaf to store" "identity:|content:|mac:" "$WROTE"
    check "sync, fetch the current leaf, publish -- exactly that" \
        "^WardSyncRequest -> WardSyncResponse,WardServiceFetch -> WardEntryAck,WardPublish -> WardPublishAck$" \
        "$(served_since "$MARK")"

    echo "26. write, then read the entry just written -- back to back, one daemon"
    # THE PAIR THAT MATTERS: a value published to the daemon is immediately readable through it, and
    # the read verifies the leaf against the root the write established. Nothing but a real
    # publication makes that proof exist.
    #
    # WHY THIS DOES NOT ASSERT "NO SECOND SYNC". The device's online latch is SESSION state
    # (APP_WARD_ONLINE, in the THP session cache), so a second operation in the same session needs no
    # sync -- and the firmware proves exactly that, in
    # `tests/device_tests/thp/test_ward_service_publish.py::test_a_write_is_published_and_adopted`,
    # which pins the sequence Sync/Fetch/Publish/Fetch with no fourth round trip.
    #
    # IT CANNOT BE OBSERVED FROM HERE, because @trezor/connect opens a NEW device session per method
    # call -- `ThpCreateNewSession` goes out before each one, measured with --debug -- so even inside
    # a single process the second operation starts from an empty session cache. `--then` still buys
    # the back-to-back pair against one daemon and one channel; the sequence below is what that
    # actually produces, and the sync it contains says `from counter=2`, which is step 27's subject.
    refresh_daemon
    MARK="$(mark_log)"
    PAIR="$(timeout 200 $CLI --method=ward_add --service --appid="$APPID" --ident="$IDENT2" --value="$VALUE2" --then=ward_display 2>&1)"
    check "the write applied" "applied: true" "$PAIR"
    check "the head moved again" "counter: 2" "$PAIR"
    # The read is the device's, and it verified what came back against the root it had just adopted.
    # A daemon serving the entry it was handed a moment ago is the only way this proof exists at all.
    check "and the read that followed it went through" "onDevice: true" "$PAIR"
    check "sync, fetch, publish -- then the read, which syncs again because its session is new" \
        "^WardSyncRequest -> WardSyncResponse,WardServiceFetch -> WardEntryAck,WardPublish -> WardPublishAck,WardSyncRequest -> WardSyncResponse,WardServiceFetch -> WardEntryAck$" \
        "$(served_since "$MARK")"

    echo "27. a LATER session syncs again -- from the head the device kept"
    # THE OTHER HALF OF ADOPTION, and the one that is about flash rather than about a session cache.
    # A fresh session must sync, and what it says is where it is asking FROM: a device that adopted
    # both publications above asks from counter 2, and the daemon answers with no links because there
    # is nothing to fold. A device that had merely reported success and kept its old head would ask
    # from 0, and this is the only step that would notice.
    refresh_daemon
    MARK="$(mark_log)"
    LATER="$(timeout 150 $CLI --method=ward_display --service --appid="$APPID" --ident="$IDENT2" 2>&1)"
    check "the read went through" "onDevice: true" "$LATER"
    check "and the device asked from the head it had published to" \
        "^SERVED [0-9]+ WardSyncRequest -> WardSyncResponse.* from counter=2$" \
        "$(tail -n +"$((MARK + 1))" "$DAEMON_LOG")"

    echo "28. the queue, published: what was held offline reaches the tree"
    # THE ARC THE OTHER TWO CANNOT COVER. Steps 1-20 proved the queue is the device's own store and
    # depends on no backend; step 25 proved a write can reach the daemon. This is the join: a change
    # made with no backend at all, published later, one round trip at a time.
    #
    # A QUEUED CHANGE IS NOT A REPLAYED REQUEST. It has no path, no proof material and no root -- it
    # is an intent, and an intent formed while the tree was at one state is not applicable at
    # another. The device re-derives it against current state on the way out, which is why each flush
    # below costs a fetch as well as a publish.
    #
    # NOTHING BELOW ASSERTS WHICH OF THE TWO GOES FIRST, deliberately. An unnamed flush takes the
    # oldest un-offered record, and "oldest" is a slot order the device reuses as records are
    # discarded -- so an order asserted from out here would be pinning an implementation detail. What
    # is asserted is what a draining host actually depends on: one change per round trip, the counter
    # advancing by one each time, and `remaining` counting down to zero.
    #
    # First the leftover: step 7 restored a queued change for this very key and nothing since has
    # discarded it. An unnamed flush would take THAT one, and every count below would be off by one.
    check "the leftover queued change is cleared out first" "discarded: true|missing: true" \
        "$(timeout 150 $CLI --method=ward_delete --queue --appid="$APPID" --ident="$IDENT" 2>&1)"
    check "queue A" "queued: true" \
        "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="$FIDENT1" --value="$FVALUE1" 2>&1)"
    check "queue B" "queued: true" \
        "$(timeout 150 $CLI --method=ward_add --queue --appid="$APPID" --ident="$FIDENT2" --value="$FVALUE2" 2>&1)"

    refresh_daemon
    MARK="$(mark_log)"
    FLUSH1="$(timeout 150 $CLI --method=ward_flush --service 2>&1)"
    check "the first queued change was published" "published: true" "$FLUSH1"
    check "at the next counter" "counter: 3" "$FLUSH1"
    # `remaining` IS THE LOOP, and the reason it is asserted rather than glanced at: a host drains
    # its queue by flushing while this is non-zero, so a value dropped in transit would strand every
    # queued change after the first -- silently, since the first one really was published.
    check "and one is still waiting" "remaining: 1" "$FLUSH1"
    check "re-derived against current state, then published" \
        "^WardSyncRequest -> WardSyncResponse,WardServiceFetch -> WardEntryAck,WardPublish -> WardPublishAck$" \
        "$(served_since "$MARK")"

    MARK="$(mark_log)"
    FLUSH2="$(timeout 150 $CLI --method=ward_flush --service 2>&1)"
    check "the second was published too" "published: true" "$FLUSH2"
    check "at the counter after that" "counter: 4" "$FLUSH2"
    check "and the queue is drained" "remaining: 0" "$FLUSH2"
    check "the same three exchanges again -- one change per round trip" \
        "^WardSyncRequest -> WardSyncResponse,WardServiceFetch -> WardEntryAck,WardPublish -> WardPublishAck$" \
        "$(served_since "$MARK")"

    refresh_daemon
    MARK="$(mark_log)"
    # AN EMPTY DRAIN PUBLISHES NOTHING, and says so rather than failing: there is no transition, so
    # no claim and nothing to settle. The device still syncs, because it cannot know the queue is
    # empty without being able to publish -- so the log shows the sync and nothing after it, which is
    # the sharpest available statement that no phantom fetch or publish happened.
    check "an empty queue is an answer" "empty: true" \
        "$(timeout 150 $CLI --method=ward_flush --service 2>&1)"
    check "and it touched neither the replica nor the WM" \
        "^WardSyncRequest -> WardSyncResponse$" "$(served_since "$MARK")"

    echo "29. the published records were SETTLED, not deleted"
    # WHERE A QUEUE INTEGRATION QUIETLY BREAKS. Publication does not remove the record -- nothing in
    # WARD deletes one except the user saying so -- it stops being PENDING and stays as the device's
    # cached copy of the value now in the tree. So the check is not "it is gone" but "it is no longer
    # a change waiting to happen": a record still marked pending would be offered again by the next
    # flush and published twice, and one reported missing would mean settlement threw the value away.
    SETTLED="$(timeout 150 $CLI --method=ward_display --queue --appid="$APPID" --ident="$FIDENT1" 2>&1)"
    check "the record is still there" "displayed: true" "$SETTLED"
    check "with the value that was published" "value: '$FVALUE1'" "$SETTLED"
    check "and it is no longer pending" "pending: false" "$SETTLED"
    check "there is nothing left to restore, because there is no intent left" "restorable: false" \
        "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident="$FIDENT1" 2>&1)"

    echo "30. stop the daemon"
    stop_daemon
    check "it served the exchanges above and nothing was left hanging" "^STOPPED [1-9][0-9]*$" "$(cat "$DAEMON_LOG")"
    # Printed rather than only asserted: when an arc fails, WHICH exchange came back wrong is the
    # whole diagnosis, and it is one line per life of the daemon.
    grep -E "^NOTE .* exchanges in order:" "$DAEMON_LOG" | sed 's/^/  /'
else
    echo "21. --service against a CONNECT build must FAIL, not quietly do something else"
    # THE ASSERTION THE FLAG IS, SEEN FROM THE OTHER SIDE. `--service` is the caller stating that
    # this firmware serves WARD over an interface of its own, and the device does not report whether
    # that is true -- so the only way the claim can be wrong is here, and what must happen is
    # nothing. Both directions, because they fail for different reasons and both reasons matter: the
    # read pulls from a host store this CLI does not have, and the write additionally would have been
    # handed a leaf with nowhere to keep it.
    READ_FAIL="$(timeout 150 $CLI --method=ward_display --service --appid="$APPID" --ident="$IDENT" 2>&1)"
    check_not "the read did not report success" "displayed: true|onDevice: true" "$READ_FAIL"
    # IDENT2, which nothing in this script has queued: the point of the next check is that a refused
    # write left NOTHING behind, and asking about a key the offline arc has been moving around would
    # find that arc's queued change and report it as a fallback that never happened.
    WRITE_FAIL="$(timeout 150 $CLI --method=ward_add --service --appid="$APPID" --ident="$IDENT2" --value="$VALUE2" 2>&1)"
    check_not "the write did not report success" "applied: true" "$WRITE_FAIL"
    # FAILED CLOSED means the entry is not in the tree AND is not in the queue either: a fallback
    # that quietly held the change would look like a success from a user's point of view and would
    # leave a change nobody asked to queue.
    check "and it queued nothing behind our back" "missing: true" \
        "$(timeout 150 $CLI --method=ward_backup --queue --appid="$APPID" --ident="$IDENT2" 2>&1)"
fi

echo
if [ "$VARIANT" = service ]; then
    echo "variant covered: SERVICE (queue never touched the daemon; reads, writes and flushes did)"
    echo "the other one needs a build without the interface:"
    echo "  xtask build firmware -e -d --pyopt false --model $MODEL_HINT --debug-link"
else
    echo "variant covered: CONNECT (WARD over the wallet channel; --service fails closed)"
    echo "the other one needs a build with the interface:"
    echo "  xtask build firmware -e -d --pyopt false --model $MODEL_HINT --debug-link --ward-service-channel"
fi

echo
if [ "$failures" -eq 0 ]; then
    echo "ward queue e2e ($VARIANT, $WALLET wallet): all checks passed"
else
    echo "ward queue e2e ($VARIANT, $WALLET wallet): $failures check(s) FAILED"
    [ -n "$DAEMON_LOG" ] && echo "daemon log: $DAEMON_LOG"
fi
exit "$failures"
