#!/usr/bin/env python3
"""The SECOND DEVICE for `ward-wardd.sh`: a trezorlib session on another emulator seeded like the
first (same wallet, same `ward_id`), driven through `trezorlib.ward_relay` -- the Python binding --
against the same wardd.

    ward-wardd-peer.py --port 21424 --wardd ws://127.0.0.1:21329 --token-file F <op> [...]

    ward-id   print the wallet's ward_id (from WardSync)
    sync      bring the device to the WM's head through wardd
    queue     hold a change on the device (--appid --ident --value), confirmed over debuglink
    flush     publish the queue through wardd (--batch N)
    status    wardd's replica head and the WM's

Prints one JSON object. Screens are confirmed over the emulator's debuglink (wire port + 1), the
way connect-cli's --debuglink confirms its own.

Needs a trezorlib with `ward_relay` on the path: run under emu.py, or set TREZOR_FIRMWARE.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def _import_paths() -> None:
    root = os.environ.get("TREZOR_FIRMWARE")
    if not root and os.environ.get("TREZOR_SRC"):
        root = str(Path(os.environ["TREZOR_SRC"]).resolve().parents[1])
    if root:
        sys.path.insert(0, str(Path(root) / "python" / "src"))


_import_paths()

from trezorlib import messages, ward, ward_relay  # noqa: E402
from trezorlib.client import get_default_client  # noqa: E402
from trezorlib.debuglink import DebugLink  # noqa: E402
from trezorlib.transport.udp import UdpTransport  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("op", choices=["ward-id", "sync", "queue", "flush", "status"])
    ap.add_argument("--port", type=int, default=21424)
    ap.add_argument("--wardd", default=ward_relay.WARDD_DEFAULT_URL)
    ap.add_argument("--token-file", type=Path, default=ward_relay.DEFAULT_TOKEN_FILE)
    ap.add_argument("--appid", default="peer_app")
    ap.add_argument("--ident")
    ap.add_argument("--value")
    ap.add_argument("--batch", type=int, default=1)
    args = ap.parse_args()

    debug = DebugLink(UdpTransport(f"127.0.0.1:{args.port + 1}"), auto_interact=True)
    debug.open()
    try:
        client = get_default_client(
            "ward-wardd-peer",
            UdpTransport(f"127.0.0.1:{args.port}"),
            button_callback=lambda _br: debug.press_yes(),
        )
        session = client.get_session(passphrase="")

        if args.op == "ward-id":
            ack = session.call(messages.WardSync(), expect=messages.WardSyncAck)
            assert ack.ward_id is not None
            out: dict = {"ward_id": ack.ward_id.hex(), "counter": ack.counter}
        elif args.op == "queue":
            if args.ident is None or args.value is None:
                ap.error("queue needs --ident and --value")
            ward.queue_set_entry(
                session, args.appid, args.ident.encode(), args.value.encode()
            )
            out = {"queued": True}
        else:
            token = args.token_file.read_text().strip()
            with ward_relay.WarddClient(token, args.wardd) as wardd:
                ward_relay.open_store(session, wardd)
                if args.op == "sync":
                    out = ward_relay.sync(session, wardd)
                elif args.op == "flush":
                    out = ward_relay.flush(session, wardd, max_batch=args.batch)
                else:
                    out = ward_relay.status(wardd)
    except ward_relay.WarddError as e:
        out = {"error": e.code, "message": str(e)}
    finally:
        debug.transport.close()

    print(json.dumps(out))
    return 0 if "error" not in out else 1


if __name__ == "__main__":
    sys.exit(main())
