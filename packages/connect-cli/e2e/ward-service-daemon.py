#!/usr/bin/env python3
"""A WARD service daemon for the e2e script beside it: a replica, a WM, and a log of both.

WHAT IT IS FOR. On a `--ward-service-channel` build the device does not ask its wallet host for
WARD data: it opens an interface of its own and asks a daemon. This is that daemon, held open for
the length of an e2e run, and it exists to make two OPPOSITE statements checkable from a shell:

  * the queue never touches it -- offline requests read the device's own store, so a run of them
    must leave this log without a single SERVED line;
  * the channel really works -- an online read makes the device sync with this daemon, fetch a
    leaf from it and verify what came back against the root it just adopted, and the log names
    every one of those exchanges as it happens.

A daemon that quietly answered nothing could support the first claim and not the second, which is
why this one serves for real rather than recording.

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
    WardServiceServer,
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


class Daemon(MockWardService):
    """`MockWardService`'s business logic, without its pytest fixture.

    `__init__` IS REPLACED RATHER THAN CALLED. The parent's takes a `TrezorTestContext` and pulls a
    transport and a button callback out of it, neither of which exists here -- but everything below
    `handle` reads only the plain attributes set here. Subclassing keeps the protocol logic
    (`_sync_response`, `_fetch_response`, `_publish_response`, `_commit`) in ONE place, shared with
    the device tests, which is the whole reason not to write a daemon from scratch in this file.
    """

    def __init__(self, transport, log, button_callback=None, static_privkey=None) -> None:
        self.service = WardServiceClient(
            transport,
            # THE IDENTITY THE DEVICE PINS. Passed in so a daemon that comes back is the SAME
            # daemon: the pin is in flash, and a fresh key is not merely unrecognised but locked
            # out. Left None on a first run, where the library picks one and the caller stores it.
            static_privkey=static_privkey,
            # `wardd-e2e`, not the wallet host's manifest: the device PINS the daemon's static key,
            # and borrowing the CLI's identity would make the two channels indistinguishable to it.
            # The BUTTON CALLBACK is the one thing worth borrowing from a test client: pairing puts
            # a screen in front of the user, and here the answer is "press it over debuglink".
            app=AppManifest(app_name="wardd-e2e", button_callback=button_callback),
        )
        self.server: WardServiceServer | None = None  # set by `open`, below
        self._log = log

        # What this daemon knows. An EMPTY replica is the honest starting point for the e2e: the
        # device has published nothing to it, so a read must come back "no such entry" -- and that
        # answer is a non-membership PROOF the device checks, not a word this daemon is trusted on.
        self.store = WardTrie()
        self.wm = MockWM()
        self.k_mac = DEFAULT_K_MAC
        self.ward_id = None
        self.timestamp_base = 1_700_000_000

        # The parent's failure-mode knobs. All off: this daemon is the honest case, and the e2e
        # asserts on what a working channel does.
        self.always_out_of_sync = False
        self.drop_publish_ack = False
        self.publish_ack_override = None

        self.error = None
        self._stop = False

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
    if args.key_file and static_privkey is None:
        with open(args.key_file, "w") as handle:
            handle.write(daemon.service.static_privkey.hex())
        log(f"NOTE stored the daemon key in {args.key_file}")

    log(f"BOUND {_now()}")
    log(f"NOTE serving an EMPTY replica at counter {daemon.store.counter}")
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
