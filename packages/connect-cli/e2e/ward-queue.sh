#!/usr/bin/env bash
#
# The WARD queue, end to end: queue a change, show it, back it up, discard it, put it back.
#
# BOTH VARIANTS LIVE HERE, and which one runs is decided by the binary rather than by a flag.
# Where a device gets WARD data from is a BUILD OPTION -- a CONNECT build asks its wallet host over
# the channel it is already answering on, a SERVICE build asks a daemon on a dedicated interface,
# and no firmware does both. The queue is supposed to be indifferent to that: it is the device's OWN
# store. So this script detects the build it is talking to and runs the identical arc either way.
#
# On a service build it then does two more things, which are opposites and only mean something
# together: it holds a daemon on the WARD interface for the whole run and asserts that the offline
# arc asked it NOTHING, and it then makes one ONLINE read and asserts that the same daemon served
# the sync and the fetch it takes. The first says the queue depends on no backend; the second says
# the separate channel actually works, and rules out a daemon nobody could reach.
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
# t3w1 rather than t3t1 because the multi-session parts of the WARD suite need THP, and --debug-link
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

(plain \`make build_unix\` binds no debug port; t3w1 rather than t3t1 because the multi-session parts
of the WARD suite need THP.)
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
DAEMON_PID=""

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
        --key-file "$DAEMON_KEY" >>"$DAEMON_LOG" 2>&1 &
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

if [ "$VARIANT" = service ]; then
    echo "0. this is a SERVICE build -- bind a daemon to the WARD interface (udp $WARD_PORT)"
    DAEMON_LOG="$(mktemp "${TMPDIR:-/tmp}/ward-service-daemon.XXXXXX.log")"
    DAEMON_KEY="$(mktemp -u "${TMPDIR:-/tmp}/ward-service-daemon.XXXXXX.key")"

    if ! start_daemon 1; then
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
    # NOT A WORKAROUND -- THE THING A REAL DAEMON MUST DO. THP keeps a bounded number of app-data
    # channels (MAX_CHANNELS_APPDATA in core/embed/rust/src/thp/mod.rs), and every CLI invocation
    # above opened one; roughly twenty of them displace the daemon's, after which the device finds
    # its bound channel gone and a fetch fails with "THP channel is no longer open". A wardd that
    # is up for days meets this constantly, and the answer is to come back -- as THE SAME daemon,
    # which is what --key-file is for: the device pinned that key in flash and refuses any other.
    stop_daemon
    if ! start_daemon 2; then
        echo "  FAIL the daemon did not come back:"
        sed 's/^/         /' "$DAEMON_LOG" | tail -8
        failures=$((failures + 1))
    else
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
    ONLINE="$(timeout 150 $CLI --method=ward_display --service --appid="$APPID" --ident="$IDENT" 2>&1)"
    check "the device performed the read" "onDevice: true" "$ONLINE"

    echo "24. the daemon's own log says what it was asked"
    SERVED_LOG="$(cat "$DAEMON_LOG")"
    # The sync comes first: on this build the device drives it itself when a WARD operation needs
    # one, rather than failing and telling the host to go and sync.
    check "the device synced with the daemon" "^SERVED [0-9]+ WardSyncRequest -> WardSyncResponse" "$SERVED_LOG"
    check "and fetched the entry over the service channel" "^SERVED [0-9]+ WardServiceFetch -> WardEntryAck" "$SERVED_LOG"

    echo "25. stop the daemon"
    stop_daemon
    check "it served the exchanges above and nothing was left hanging" "^STOPPED [1-9][0-9]*$" "$(cat "$DAEMON_LOG")"
    # Printed rather than only asserted: when this arc fails, WHICH exchange came back wrong is
    # the whole diagnosis, and it is one line.
    grep -E "^NOTE .* exchanges in order:" "$DAEMON_LOG" | sed 's/^/  /'
fi

echo
if [ "$VARIANT" = service ]; then
    echo "variant covered: SERVICE (queue never touched the daemon; the online read went through it)"
    echo "the other one needs a build without the interface:"
    echo "  xtask build firmware -e -d --pyopt false --model t3w1 --debug-link"
else
    echo "variant covered: CONNECT (WARD over the wallet channel)"
    echo "the other one needs a build with the interface:"
    echo "  xtask build firmware -e -d --pyopt false --model t3w1 --debug-link --ward-service-channel"
fi

echo
if [ "$failures" -eq 0 ]; then
    echo "ward queue e2e ($VARIANT): all checks passed"
else
    echo "ward queue e2e ($VARIANT): $failures check(s) FAILED"
    [ -n "$DAEMON_LOG" ] && echo "daemon log: $DAEMON_LOG"
fi
exit "$failures"
