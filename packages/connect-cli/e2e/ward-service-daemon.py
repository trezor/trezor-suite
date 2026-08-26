#!/usr/bin/env python3
"""A WARD service daemon for the e2e script beside it: a replica, a WM, and a log of both.

WHAT IT IS FOR. On a `--ward-service-channel` build the device does not ask the app that called it
for WARD data: it opens an interface of its own and asks a daemon. This is that daemon, held open for
the length of an e2e run, and it exists to make two OPPOSITE statements checkable from a shell:

  * the queue never touches it -- offline requests read the device's own store, so a run of them
    must leave this log without a single SERVED line;
  * the channel really works -- an online operation makes the device sync with this daemon, fetch a
    leaf from it and verify what came back against the root it just adopted, and a WRITE goes
    further: the device hands over a sealed mutation and moves its head only once the WM's
    attestation for that counter comes back. The log names every one of those exchanges as it
    happens, in order, which is the only place the write half is visible from outside the device.

A daemon that quietly answered nothing could support the first claim and not the second, which is
why this one serves for real rather than recording -- it stores what it is handed, has its WM attest
it, and proves it back.

WHAT IT IS NOT. The replica and the WM are the device tests' -- `tests.ward_trie.WardTrie` and
`tests.ward_wm.MockWM` -- and so is the protocol logic, taken from `tests.ward_service` rather than
restated here. That is deliberate: a second copy of "what does a fetch answer" is exactly how a
host and a firmware quietly stop agreeing, and the disagreement then surfaces as an unattributable
proof failure on the device. The channel, the handshake, the pairing and the responder loop are
`trezorlib.ward_service`'s -- the same client a real daemon uses.

THE WM SIGNS FRESHNESS, NEVER A ROOT MAC. The mac over (ward_id, counter, root) is derived from the
WALLET SEED, so only a device of that wallet can produce one -- and this daemon reproduces the
emulator's, because the e2e drives a default-setup device (the "all all ..." mnemonic, empty
passphrase). A daemon standing in front of any other wallet would be refused, correctly.

THE REPLICA OUTLIVES THE PROCESS, if `--state-file` says where to keep it. That is not a
convenience: THP holds a bounded number of channels (MAX_CHANNELS_APPDATA), every wallet-side call
opens one, and a daemon that has been displaced has to come back -- see `--key-file`. Coming back
with an EMPTY replica would be worse than not coming back at all, because the device has meanwhile
advanced its head: it would offer a wallet at genesis to a device that is past it, and every read
would fail for a reason that has nothing to do with what is being tested. A real wardd owns a
database; this pickles the same three things it would keep -- the trie, the WM's heads, and the
wallet the two are about.

Usage, under emu.py (the e2e starts it this way and needs no environment of its own -- emu.py
exports TREZOR_SRC, which names the checkout the running emulator was built from):

    python3 ward-service-daemon.py [--port 21324] [--verbose]

Standalone, where nothing has said which checkout to use:

    TREZOR_FIRMWARE=<path to trezor-firmware> python3 ward-service-daemon.py [--port 21324]

Prints one tagged line per event on stdout, flushed, so a shell can both wait on it and assert
against it afterwards:

    BOUND <hh:mm:ss.mmm>              the channel is up and announced; safe to talk to the device
    SERVED <n> <Request> -> <Reply>   one device-initiated exchange, with the fields that matter
    NOTE <text>                       anything worth reading that is not an exchange
    STOPPED <n>                       exit, having served n requests
"""

from __future__ import annotations

import argparse
import importlib
import logging
import os
import pickle
import signal
import sys
import time
import types


def _is_checkout(path: str | None) -> bool:
    """Whether `path` is a trezor-firmware checkout, judged by the file we actually need."""
    return bool(path) and os.path.isfile(os.path.join(str(path), "tests", "ward_trie.py"))


def _find_checkout() -> str | None:
    """Locate a trezor-firmware checkout, without insisting on being told where one is.

    THREE SOURCES, MOST EXPLICIT FIRST:

      TREZOR_FIRMWARE  what a caller running this daemon by hand sets.

      TREZOR_SRC       what `emu.py` exports into the command it wraps -- `<checkout>/core/src`.
                       This is the normal path for the e2e, since the emulator has to wrap the
                       script anyway, and requiring the caller to ALSO name the checkout the
                       emulator was built from is asking for the two to disagree.

      the working tree the script was launched from, walked upwards -- the last resort for a
      caller who is simply standing in the checkout.

    Each candidate is confirmed by looking for `tests/ward_trie.py` rather than trusted, so a
    variable left over from something else is ignored instead of producing a puzzling import error
    several frames later.
    """
    named = os.environ.get("TREZOR_FIRMWARE")
    if _is_checkout(named):
        return named

    # `<checkout>/core/src` -> `<checkout>`. Derived rather than pattern-matched, so a differently
    # laid out tree simply fails the check below instead of being mangled into a wrong path.
    src = os.environ.get("TREZOR_SRC")
    if src:
        candidate = os.path.dirname(os.path.dirname(os.path.abspath(src)))
        if _is_checkout(candidate):
            return candidate

    path = os.path.abspath(os.getcwd())
    while True:
        if _is_checkout(path):
            return path
        parent = os.path.dirname(path)
        if parent == path:
            break
        path = parent

    # Named but wrong is worth saying out loud: silently falling through to "not found" would hide
    # a typo in the one variable the caller thought they had set correctly.
    if named:
        print(
            f"NOTE TREZOR_FIRMWARE={named} is not a trezor-firmware checkout "
            "(no tests/ward_trie.py there)",
            flush=True,
        )

    return None


def _import_paths() -> None:
    """Make `trezorlib` and the device tests' WARD helpers importable.

    TWO DIFFERENT ROOTS, and both are needed: the library lives in `python/src`, while `ward_trie`,
    `ward_wm` and `ward_service` are modules of the `tests` package at the checkout root. An
    installed trezorlib is preferred for the first -- it means this script never shadows the
    library the rest of the environment is using -- but the second has no packaged form, so a
    checkout is required either way.

    `tests` IS A NAME OTHER PROJECTS USE, which is why the checkout goes to the FRONT of the path
    and any already-imported `tests` is dropped first. Without that, an unrelated `tests` package
    that happened to be installed wins the name, and the failure reads as "no module named
    tests.ward_trie" -- which is true, and says nothing about what actually went wrong.
    """
    root = _find_checkout()

    try:
        import trezorlib.ward_service  # noqa: F401
    except ImportError:
        if not root:
            sys.exit(
                "no trezorlib and no trezor-firmware checkout found -- install trezorlib, or set "
                "TREZOR_FIRMWARE (it is found automatically under emu.py, which exports TREZOR_SRC)"
            )
        sys.path.insert(0, os.path.join(root, "python", "src"))

    if not root:
        sys.exit(
            "no trezor-firmware checkout found: the WARD helpers (tests/ward_trie.py) have no "
            "packaged form, so the daemon needs one. Set TREZOR_FIRMWARE, or run this under "
            "emu.py, which exports TREZOR_SRC and is how the e2e starts it."
        )

    sys.path.insert(0, root)
    for name in [n for n in sys.modules if n == "tests" or n.startswith("tests.")]:
        del sys.modules[name]
    importlib.invalidate_caches()

    try:
        import tests.ward_trie
    except ImportError as exc:
        sys.exit(f"the WARD helpers in {root} are not importable: {exc}")

    # Resolved, not assumed: if some other `tests` still won the name, say so here rather than
    # failing later on an attribute that looks like a version mismatch.
    if not os.path.realpath(tests.ward_trie.__file__).startswith(
        os.path.realpath(root) + os.sep
    ):
        sys.exit(
            f"`tests` resolved to {tests.ward_trie.__file__}, which is not in {root} -- another "
            "package owns that name in this environment"
        )


def _stub_pytest_if_absent() -> None:
    """`tests.ward_service` imports pytest for one skip that this script never reaches.

    Stubbed rather than depended on: a daemon has no business requiring a test runner to be
    installed, and the alternative -- restating the protocol logic here -- is the duplication this
    file exists to avoid. A REAL pytest is always preferred; this only fills a hole.
    """
    try:
        import pytest  # noqa: F401
    except ImportError:
        stub = types.ModuleType("pytest")

        def _skip(reason: str = "") -> None:
            raise RuntimeError(f"pytest.skip called outside pytest: {reason}")

        stub.skip = _skip  # type: ignore[attr-defined]
        sys.modules["pytest"] = stub


_import_paths()
_stub_pytest_if_absent()

from tests.ward_service import DEFAULT_K_MAC, MockWardService  # noqa: E402
from tests.ward_trie import WardTrie  # noqa: E402
from tests.ward_wm import MockWM  # noqa: E402
from trezorlib.client import AppManifest  # noqa: E402
from trezorlib.debuglink import DebugLink  # noqa: E402
from trezorlib.transport.udp import UdpTransport  # noqa: E402
from trezorlib.ward_service import (  # noqa: E402
    WARD_PORT_OFFSET,
    WardServiceClient,
    WardServiceClientV1,
    WardServiceServer,
    service_speaks_codec,
)


class Confirmer:
    """Answers the screens the DAEMON's own channel raises, over debuglink.

    PAIRING RAISES ONE, and nothing else here does. `trezorlib` acknowledges a `ButtonRequest`
    whether or not a callback is set, so without this the bind still SUCCEEDS -- and leaves the
    confirmation dialog standing on the device, where it blocks the wallet-channel workflow that
    the e2e runs next. The symptom is a daemon that reports itself bound and a CLI call that then
    goes nowhere, which is why this is not optional.

    `press_yes` -- `DebugLinkDecision(button=YES)` -- rather than a model-aware layout walk. It is
    exactly what connect-cli's own `--debuglink` sends (`debugLinkDecision` in `src/transport.ts`),
    so the two hosts confirm the same way, and it needs no knowledge of which model is running.

    HELD ONLY FOR THE BIND. The debug interface is one socket and the CLI wants it for every
    screen of the arc that follows, so this is closed the moment the channel is up.
    """

    def __init__(self, port: int, log) -> None:
        self._log = log
        self._port = port
        self._debug: DebugLink | None = None

    def open(self) -> None:
        # Failure is logged, not fatal: an emulator without debuglink cannot confirm anything, but
        # saying so here is more useful than dying before the bind is even attempted -- the bind
        # may well be all this run needs.
        try:
            self._debug = DebugLink(UdpTransport(f"127.0.0.1:{self._port}"), auto_interact=True)
        except Exception as exc:  # noqa: B902
            self._log(f"NOTE no debuglink on udp {self._port} ({exc!r}); screens will wait for a person")

    def press(self, br) -> None:
        name = getattr(br, "name", None) or getattr(br, "code", "?")
        if self._debug is None:
            self._log(f"NOTE {name} needs confirming and there is no debuglink to do it")

            return

        self._log(f"NOTE confirming {name} over debuglink")
        self._debug.press_yes()

    def close(self) -> None:
        if self._debug is not None:
            self._debug.transport.close()
            self._debug = None


def _now() -> str:
    return time.strftime("%H:%M:%S", time.localtime()) + f".{int(time.time() * 1000) % 1000:03d}"


def _hexlead(value: object, length: int = 8) -> str:
    """The first few bytes of a blob, for a log line that has to stay one line.

    Enough to tell two roots or two entry_keys apart at a glance, which is all a log needs; the
    full values are the device's business and are checked there.
    """
    if not isinstance(value, (bytes, bytearray)):
        return "-"

    return bytes(value)[:length].hex() + ("…" if len(value) > length else "")


def _proof_bit(key: object, bit: int) -> str | int:
    if not isinstance(key, (bytes, bytearray)) or len(key) != 32:
        return "-"

    return (key[bit // 8] >> (7 - (bit % 8))) & 1


class Daemon(MockWardService):
    """`MockWardService`'s business logic, without its pytest fixture.

    `__init__` IS REPLACED RATHER THAN CALLED. The parent's takes a `TrezorTestContext` and pulls a
    transport and a button callback out of it, neither of which exists here -- but everything below
    `handle` reads only the plain attributes set here. Subclassing keeps the protocol logic
    (`_sync_response`, `_fetch_response`, `_publish_response`, `_commit`) in ONE place, shared with
    the device tests, which is the whole reason not to write a daemon from scratch in this file.
    """

    def __init__(
        self,
        transport,
        log,
        button_callback=None,
        static_privkey=None,
        state_file=None,
        verbose=False,
    ) -> None:
        # WHICH CLIENT COMES FROM THE ENDPOINT, not from the wallet connection. The service
        # interface speaks codec v1 on every build by default and THP only behind
        # `USE_WARD_SERVICE_THP`, so a THP-wallet device normally has a CODEC service endpoint --
        # and pointing a THP client at one fails deep inside the framing with "Payload too short",
        # a long way from the cause. `service_speaks_codec` asks the endpoint the one question
        # only it can answer; see its docstring for why the FRAMING of the reply is not the answer.
        transport.open()
        try:
            speaks_codec = service_speaks_codec(transport)
        finally:
            transport.close()

        if speaks_codec is None:
            raise RuntimeError(
                "could not tell which transport the WARD service interface speaks; "
                "is the emulator a --ward-service-channel build?"
            )

        if speaks_codec:
            # NO IDENTITY, AND NOTHING TO PERSIST. A codec transport carries no handshake, so the
            # device pins nobody and `static_privkey`/`app` have nothing to describe. A daemon that
            # comes back is simply heard again -- see `bind_codec`.
            log(f"NOTE {_now()} the service interface speaks codec v1")
            self.service = WardServiceClientV1(transport)
        else:
            log(f"NOTE {_now()} the service interface speaks THP")
            self.service = WardServiceClient(
                transport,
                # THE IDENTITY THE DEVICE PINS. Passed in so a daemon that comes back is the SAME
                # daemon: the pin is in flash, and a fresh key is not merely unrecognised but
                # locked out. Left None on a first run, where the library picks one and the caller
                # stores it.
                static_privkey=static_privkey,
                # `wardd-e2e`, not the calling app's manifest: the device PINS the daemon's static
                # key, and borrowing the CLI's identity would make the two channels
                # indistinguishable to it. The BUTTON CALLBACK is the one thing worth borrowing
                # from a test client: pairing puts a screen in front of the user, and here the
                # answer is "press it over debuglink".
                app=AppManifest(
                    app_name="wardd-e2e", button_callback=button_callback
                ),
            )
        self.server: WardServiceServer | None = None  # set by `open`, below
        self._log = log
        self._verbose = verbose

        # What this daemon knows. An EMPTY replica is the honest starting point for the e2e: the
        # device has published nothing to it, so a read must come back "no such entry" -- and that
        # answer is a non-membership PROOF the device checks, not a word this daemon is trusted on.
        #
        # UNLESS A PREVIOUS LIFE LEFT SOMETHING BEHIND. Once the device has published, empty stops
        # being honest and becomes wrong: the device's head has moved, and a daemon claiming genesis
        # is claiming a state that no longer exists. See `_load_state`.
        self.store = WardTrie()
        self.wm = MockWM()
        self.k_mac = DEFAULT_K_MAC
        self.ward_id = None
        self.timestamp_base = 1_700_000_000
        self._state_file = state_file
        self._load_state()

        # The parent's failure-mode knobs. All off: this daemon is the honest case, and the e2e
        # asserts on what a working channel does.
        self.always_out_of_sync = False
        self.drop_publish_ack = False
        self.publish_ack_override = None

        self.error = None
        self._stop = False

    def _fetch_response(self, request):
        entry_key = request.entry_key

        if self._verbose:
            root = self.store.root()
            self._log(
                "PROOF build"
                f" entry_key={entry_key.hex()}"
                f" present={entry_key in self.store}"
                f" entries={len(self.store.blobs)}"
                f" counter={self.store.counter}"
                f" root={root.hex() if root else 'EMPTY'}"
            )

        reply = super()._fetch_response(request)

        if not self._verbose or type(reply).__name__ != "WardEntryAck":
            return reply

        proof = reply.proof or []
        witness_key = reply.witness_entry_key
        witness_commit = reply.witness_commit

        if entry_key in self.store:
            kind = "membership"
            path_key = entry_key
        elif witness_key is not None:
            kind = "non-membership"
            path_key = witness_key
        else:
            kind = "empty-tree"
            path_key = entry_key

        self._log(
            "PROOF send"
            f" kind={kind}"
            f" elements={len(proof)}"
            f" bytes={sum(len(element) for element in proof)}"
            f" witness_entry_key={witness_key.hex() if witness_key else '-'}"
            f" witness_commit={witness_commit.hex() if witness_commit else '-'}"
        )

        for index, element in enumerate(proof):
            split_bit = int.from_bytes(element[:2], "big")
            sibling = element[2:]

            self._log(
                f"PROOF   [{index}]"
                f" split_bit={split_bit}"
                f" path_bit={_proof_bit(path_key, split_bit)}"
                f" target_bit={_proof_bit(entry_key, split_bit)}"
                f" sibling={sibling.hex()}"
            )

        return reply

    def _load_state(self) -> None:
        """Resume the replica, the WM's heads and the wallet they are about, if any were kept.

        THE THREE TOGETHER OR NOT AT ALL. A trie without the WM's head describes a state nothing
        attests; a WM head without the trie attests a state nothing can be proved against. Restoring
        one and not the other would produce a daemon that fails in a way no test could attribute, so
        this is one file and one decision.

        A MISSING FILE IS THE FIRST RUN, and is silent. An UNREADABLE one is not: it means state was
        kept and then lost, which is exactly the situation where starting from genesis is wrong, so
        it says so and carries on from genesis anyway -- the run will fail, and it will fail with a
        line saying why.
        """
        if not self._state_file or not os.path.isfile(self._state_file):
            return

        try:
            with open(self._state_file, "rb") as handle:
                state = pickle.load(handle)
            self.store = state["store"]
            self.wm = state["wm"]
            self.ward_id = state["ward_id"]
        except Exception as exc:  # noqa: B902
            self._log(
                f"NOTE could not resume the replica from {self._state_file} ({exc!r}); "
                "starting from genesis, which the device will disagree with if it has published"
            )

            return

        self._log(
            f"NOTE resumed the replica at counter {self.store.counter} "
            f"({len(self.store.blobs)} entr{'y' if len(self.store.blobs) == 1 else 'ies'})"
        )

    def _save_state(self) -> None:
        """Persist after every exchange, rather than after the ones that look like they matter.

        A publication moves the trie AND the WM's head AND, on a first write, settles which wallet
        this daemon is serving; a sync can mint the WM's first head from what the device supplied.
        Deciding per message which of those happened is a judgement that only has to be wrong once,
        and the state is three dicts -- so this writes unconditionally and keeps the judgement out.
        """
        if not self._state_file:
            return

        try:
            with open(self._state_file, "wb") as handle:
                pickle.dump(
                    {"store": self.store, "wm": self.wm, "ward_id": self.ward_id}, handle
                )
        except Exception as exc:  # noqa: B902
            # Logged, not raised: the exchange itself succeeded and the device has been answered.
            # Turning a bookkeeping failure into a refused request would break the run at a point
            # that has nothing to do with the cause.
            self._log(f"NOTE could not save the replica to {self._state_file}: {exc!r}")

    def handle(self, request):
        """One device request in, one reply out -- logged on the way through.

        The reply comes from the parent, so what is logged is what was actually sent, not a
        description of it written alongside.
        """
        name = type(request).__name__
        detail = ""
        if name == "WardServiceFetch":
            detail = (
                f" entry_key={_hexlead(getattr(request, 'entry_key', None))}"
                f" at counter={getattr(request, 'current_counter', None)}"
                f" root={_hexlead(getattr(request, 'current_root', None))}"
            )
        elif name == "WardSyncRequest":
            detail = (
                f" ward_id={_hexlead(getattr(request, 'ward_id', None))}"
                f" from counter={getattr(request, 'current_counter', None)}"
            )
        elif name == "WardPublish":
            detail = (
                f" entry_key={_hexlead(getattr(request, 'entry_key', None))}"
                f" to counter={getattr(request, 'counter', None)}"
            )

        try:
            reply = super().handle(request)
        except Exception as exc:  # noqa: B902
            # LOGGED BEFORE IT PROPAGATES, because the responder loop records the failure and the
            # device meanwhile sees only silence -- and "the daemon could not answer" and "the
            # daemon was never asked" must not look the same from the shell.
            self._log(f"SERVED ? {name} -> FAILED {exc!r}{detail}")
            raise

        served = len(self.server.served) if self.server is not None else 0
        self._log(f"SERVED {served} {name} -> {type(reply).__name__}{detail}")
        self._save_state()

        return reply


def main() -> int:
    parser = argparse.ArgumentParser(
        description="a WARD service daemon for the connect-cli e2e"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=21324,
        help="the emulator's WIRE port; the WARD interface is that plus the library's offset",
    )
    parser.add_argument(
        "--debug-port",
        type=int,
        default=None,
        help="debuglink port used to confirm the pairing screen (default: wire port + 1)",
    )
    parser.add_argument(
        "--key-file",
        default=None,
        help=(
            "where to keep this daemon's static key. Read if it exists, written after the first "
            "bind -- the device PINS the key, so a restart without it is refused"
        ),
    )
    parser.add_argument(
        "--state-file",
        default=None,
        help=(
            "where to keep the replica, the WM's heads and the wallet id. Without it the daemon "
            "serves an empty replica every time it starts, which is only correct before the device "
            "has published anything"
        ),
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="also log trezorlib's own DEBUG output (channel, handshake, framing)",
    )
    args = parser.parse_args()

    def log(line: str) -> None:
        print(line, flush=True)

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG, stream=sys.stdout, format="LOG %(name)s %(message)s")

    # The offset comes from the library rather than from this script, so a daemon and the firmware
    # cannot end up disagreeing about where the interface is.
    ward_port = args.port + WARD_PORT_OFFSET
    log(f"NOTE {_now()} binding the WARD interface on udp {ward_port} (wire {args.port})")

    # The pairing screen is confirmed over debuglink, exactly as connect-cli confirms its own --
    # see `Confirmer`. Opened before the bind because that is the only thing it is needed for.
    confirmer = Confirmer(args.debug_port or (args.port + 1), log)
    confirmer.open()

    # THE DURABLE IDENTITY, and this is where a mock stops being a mock. The device pins the
    # daemon's static key in FLASH, so "the same daemon came back" is a statement about the key and
    # nothing else -- a restart with a fresh one is refused, and recovering from that is an
    # ownership migration with a user decision in it. A real wardd persists the credential it gets
    # from pairing; this keeps the bare key, which is the same claim with less machinery.
    static_privkey = None
    if args.key_file and os.path.isfile(args.key_file):
        with open(args.key_file) as handle:
            static_privkey = bytes.fromhex(handle.read().strip())
        log(f"NOTE reusing the pinned daemon key from {args.key_file}")

    daemon = Daemon(
        UdpTransport(f"127.0.0.1:{ward_port}"),
        log,
        button_callback=confirmer.press,
        static_privkey=static_privkey,
        state_file=args.state_file,
        verbose=args.verbose,
    )

    stopping = False

    def stop(*_args: object) -> None:
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)

    try:
        # skip_pairing: the debug-build shortcut, the same one the CLI takes with --pairing=skip.
        # A real daemon runs a pairing flow and persists the credential it gets.
        daemon.server = daemon.service.open(daemon.handle, skip_pairing=True)
    except Exception as exc:  # noqa: B902
        log(f"BIND-FAILED {exc!r}")
        confirmer.close()

        return 1

    # Handed back before anything else happens on the wire: the CLI runs next and wants the debug
    # interface for every screen of the arc.
    confirmer.close()

    # Written AFTER the bind rather than before: a key that never got as far as being pinned is not
    # an identity to come back with, and storing one would make the next run claim to be a daemon
    # this device has never seen.
    # Only a THP daemon has a key to come back with; a codec one is authorised by the interface
    # alone, so there is nothing to store and nothing the next run would be missing without it.
    daemon_key = getattr(daemon.service, "static_privkey", None)
    if args.key_file and static_privkey is None and daemon_key is not None:
        with open(args.key_file, "w") as handle:
            handle.write(daemon_key.hex())
        log(f"NOTE stored the daemon key in {args.key_file}")

    log(f"BOUND {_now()}")
    log(
        f"NOTE serving a replica at counter {daemon.store.counter} "
        f"with {len(daemon.store.blobs)} entries"
    )
    try:
        daemon.server.serve_forever(stop=lambda: stopping)
    except Exception as exc:  # noqa: B902
        log(f"NOTE the responder died: {exc!r}")
    finally:
        served = daemon.server.served
        log(f"NOTE {_now()} exchanges in order: {', '.join(served) if served else '(none)'}")
        log(f"STOPPED {len(served)}")
        # Guarded: by the time a long run ends, the channel may already have been displaced by
        # THP's bounded channel table, and closing a channel that is gone must not turn a clean
        # exit into a traceback that reads like a daemon failure.
        try:
            daemon.service.close()
        except Exception as exc:  # noqa: B902
            log(f"NOTE closing the channel failed: {exc!r}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
