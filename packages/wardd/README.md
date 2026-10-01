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

Run it as a single process (`node --import tsx src/cli.ts`, as `start` does). The `tsx` binary
spawns a child `node`, and stopping it would leave wardd running.

## End to end

`packages/connect-cli/e2e/ward-wardd.sh` runs the full arc on an emulator: Connect, then a second
emulator with the same seed driven through the Python and Rust bindings, then the Java binding
reading the result. The header of that script explains how to run it.

## Not yet

- **The production WM** (`trezor-suite-sync`) still speaks attestation v1. wardd uses the
  development WM behind `WmClient` until the production WM speaks v6.
- **Rollback:** a WM below the device is reported (`wm_behind`) but not repaired.
- **Service builds**, where the device talks to wardd directly over its WARD interface: that's
  Part 8 of the plan.
- **Suite desktop:** wardd isn't bundled with Suite desktop yet.
