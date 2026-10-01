# wardd: the local WARD service

`wardd` runs on the machine the Trezor is plugged into.

- **It holds the replica:** the wallet's WARD tree, as an append-only log of transitions in its
  own Evolu instance.
- **It holds the WM client:** for now an in-process development WM speaking attestation v6, which
  only emulator and debug firmware trust.
- **It drives the device:** every sync, catch-up and flush, in the order the firmware requires.

Integrations don't implement any of this. Each one carries messages between wardd and the device
on the session it already holds, over the relay contract (`packages/ward-core/relay.md`):

| Integration     | Binding                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Connect         | the `wardRelay` method, plus `createWarddProvider` for the `wardProvider` setting |
| HWI             | `trezorlib.ward_relay` (trezor-firmware)                                          |
| BHWI, async-hwi | the `ward-relay` crate (trezor-firmware `rust/ward-relay`)                        |
| Lark            | `ward-relay` for Java (trezor-firmware `java/ward-relay`)                         |

## Running it

```text
yarn workspace @trezor/wardd start [--port 21329] [--data-dir ~/.trezor-ward] \
    [--token-file F] [--memory] [--relay <evolu relay url>] [--origin <allowed origin>]...
```

- **Listening:** wardd listens on `127.0.0.1` only.
- **Browser pages** must come from an allowed `--origin`. The default list is the Suite and Connect
  origins.
- **Every client** must present the pairing token. Without `--token-file`, a token is generated in
  `<data-dir>/token` with mode 0600, and the bindings read it from there by default.
- **`--memory`** keeps the replica and the development WM in memory, for tests. Otherwise:
    - the replica is SQLite under `--data-dir`;
    - the development WM's state is `<data-dir>/dev-wm.json`, so a restart isn't read as a WM swap;
    - `--relay` replicates the store through an Evolu relay.

`start` runs wardd as one `node` process (`node --import tsx src/cli.ts`), and SIGINT or SIGTERM
stops it cleanly. Supervise that process directly, not a wrapper such as `yarn` or the `tsx` binary:
those spawn a child `node`, and stopping the wrapper alone leaves wardd running.

## Serving a service build

On a service build the device doesn't ask the calling app for WARD data; it asks a daemon on its
own WARD interface. `wardd --service` is that daemon:

```text
node --import tsx src/cli.ts --service [--port 21324] [--state-file F]
```

- **`--port`** is the device's wire port; the interface is found at `+7`.
- **First,** wardd probes which transport the interface speaks, then binds with `WardServiceOpen`.
  From then on it only answers what the device asks: `WardSyncRequest`, `WardServiceFetch` and
  `WardPublish`. They're answered from the same replica, development WM and checks as the connect
  path.
- **A publish is staged, compare-and-swapped, then promoted:** its row is appended first, and it
  becomes the head only once the WM accepts it.
- **`--state-file`** holds the wallet, the replica's links and the WM, rewritten after every change,
  so a restart resumes.
- **`--key-file` and `--debug-port`** are accepted for compatibility with the Python daemon it
  replaces, and are unused: a codec interface has no identity to pin and no pairing screen.
- **Log lines** (`BOUND`, `SERVED <n> <Request> -> <Reply>`, `STOPPED <n>`) are the Python daemon's,
  which `connect-cli/e2e/ward-queue.sh` parses. That script uses wardd by default, or the Python
  daemon with `WARD_SERVICE_DAEMON=python`.

## End to end

`packages/connect-cli/e2e/ward-wardd.sh` runs the full arc on an emulator: Connect, then a second
emulator with the same seed driven through the Python and Rust bindings, then the Java binding
reading the result. The header of that script explains how to run it.

## Not yet

- **The production WM** (`trezor-suite-sync`) still speaks attestation v1. wardd uses the
  development WM behind `WmClient` until the production WM speaks v6.
- **Rollback:** a WM below the device is reported (`wm_behind`) but not repaired.
- **THP service interfaces:** `wardd --service` serves the codec interface, which every service
  build has by default. A `ward_service_thp` build still needs `ward-service-daemon.py`.
- **Suite desktop:** wardd isn't bundled with Suite desktop yet.
