# Monero regtest harness

A local, deterministic **feedback-loop harness** for debugging the Monero (XMR) flow in Trezor
Suite. It stands up a private Monero chain (`monerod --regtest`) plus a funding wallet
(`monero-wallet-rpc`) and lets you mine blocks and fund any address on demand — so you can
exercise the real Monero code path in **seconds**, instead of the slow loop this was built to kill:

> edit → 15-minute desktop build → manual hardware send → wait for a mainnet confirmation → repeat

The private chain runs the **real consensus path** — hard fork v16, ring size 16, RingCT
BulletproofPlus + CLSAG — so a transaction built and signed against it behaves exactly like
mainnet, but instantly, reproducibly, and with no real coins or network.

This mirrors how [`trezor-user-env`](https://github.com/trezor/trezor-user-env) bootstraps
**bitcoin regtest** for the existing BTC E2E tests; the layout here is deliberately the same so the
work ports into trezor-user-env by moving files (see [Porting](#porting-to-trezor-user-env)).

## Quickstart

```bash
cd docker/monero-regtest
./setup-local.sh           # fetch monerod + monero-wallet-rpc into ./bin (once)
./control.sh up            # start node + funding wallet, bootstrap a spendable ring-16 chain
./examples/fund-and-verify.sh   # full loop: fund a fresh account -> scan -> assert  => PASS
```

`./control.sh up` prints the daemon RPC URL (`http://127.0.0.1:18381` locally) and the funding
balance. Point any Monero client (our connect `daemonRpc`, a wallet, a test) at that RPC.

## Commands (`control.sh`)

| command                  | what it does                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `up`                     | start `monerod --regtest` + `monero-wallet-rpc`, restore the deterministic funding wallet, mine the bootstrap (`MONERO_BOOTSTRAP_BLOCKS`, default 80) |
| `status`                 | chain height + funding wallet balance                                                                                                                 |
| `mine [n] [addr]`        | `generateblocks` — advance the chain (confirmations / more decoys)                                                                                    |
| `fund <addr> [piconero]` | transfer to `<addr>` (ring 16) and mine to confirm                                                                                                    |
| `down`                   | stop the daemons (chain data kept under `./data`)                                                                                                     |

All ports / paths / the funding seed / bootstrap depth are env-overridable (see the top of
`control.sh`). Local defaults use ports **18381/80/82/83** so they never clash with a mainnet
`monerod` on 18081; inside the trezor-user-env container the defaults become 18081/80/82/83.

## Why mining alone gives a spendable ring-16 chain

A RingCT spend needs a ring of 16 drawn from the `amount=0` output set. **Coinbase (miner-tx)
outputs are part of that set** — the wallet synthesizes the commitment `C = 1·G + a·H` for the
cleartext coinbase amount — so simply mining blocks seeds both the inputs and the decoys. Mining
`>= 73` blocks covers the 60-block coinbase-maturity window and the `>= 16` decoys a ring needs;
we mine 80 for headroom. (This is exactly what monero's own `tests/functional_tests/transfer.py`
does: mine 100 blocks, then `ring_size=16` transfer, no special decoy step.) The one fidelity gap
vs mainnet is that the decoys are pure coinbase rather than a realistic RingCT distribution — for
signing/correctness that is irrelevant; for mainnet-like ring statistics add a `sweep_all` pass
(see trezor-firmware's `rewind_blocks_with_decoys`).

## Gotcha: `--allow-mismatched-daemon-version`

A regtest chain reports **HF v16 at height 1**, which a mainnet-nettype wallet otherwise rejects as
`Unexpected hard fork version v16 at height 1` ([monero#8600](https://github.com/monero-project/monero/issues/8600)).
`monero-wallet-rpc` is therefore started with `--allow-mismatched-daemon-version` (already wired in
`control.sh`). Use a monerod **≥ 0.18.2** (v0.18.1.1 had a separate regtest regression); we pin
v0.18.5.0.

## Known limitation: monero-ts (the Suite worker) cannot scan regtest yet

The Suite scanning worker (`packages/blockchain-link/src/workers/monero`) uses **monero-ts**
(wallet2 in WASM). monero-ts does **not** expose `--allow-mismatched-daemon-version`, so once a
monero-ts wallet owns outputs on the regtest chain, `sync()` fails (it surfaces only as
`Exception in thread pool`). Empty wallets sync fine; the failure appears the moment there is an
owned output to process — the #8600 fork-version check with no escape hatch.

Consequences and the path forward:

- **The connect SEND path is unaffected.** It talks to the daemon through our own RPC client
  (`packages/connect/src/api/monero/tx/daemonRpc.ts`: `get_outs`, `get_output_distribution`,
  `send_raw_transaction`, `is_key_image_spent`) — not monero-ts — so it can be driven against this
  regtest chain today. That is where most of the hard bugs live (mask derivation, assembly,
  single-submit, CLSAG signature decryption).
- **For the worker scan path**, options (pick during the scan-path phase):
    1. expose `set_allow_mismatched_daemon_version` in monero-ts (small WASM-bridge patch, upstream
       or vendored) — the clean fix;
    2. use `monero-wallet-rpc` as a scan **oracle** in tests (assert balances/txs via it, as
       `examples/fund-and-verify.sh` does) while the worker's transform logic is unit-tested with
       mock `MoneroTxWallet` objects;
    3. investigate a monerod regtest option to report a mainnet-compatible fork schedule.

## Fidelity

Identical to mainnet: consensus rules (HF v16), ring size 16, RingCT BP+/CLSAG, the device signing
path, the address space. Not identical: instant fixed-difficulty mining (no PoW timing, fee market
or reorgs) and pure-coinbase decoy composition. Stagenet has realistic decoys + a real network but
is non-deterministic and slow — unusable for a fast loop or CI. Regtest is the only deterministic
option.

## Porting to trezor-user-env

The files here map onto trezor-user-env's two-plane split (controller image + a backend chain
image) the same way bitcoin regtest does:

| here                          | trezor-user-env                                                                                                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`, `entrypoint.sh` | `docker/monero-regtest/{Dockerfile,entrypoint.sh}` (sibling of `docker/bitcoin-regtest/`); add the service to `docker/compose.yml` exposing 18081                                                                                                                 |
| `control.sh` (the RPC ops)    | `src/monero_regtest/rpc.py` (`MoneroJsonRPC`) + a `run_monero_command()` handler in `controller.py`, routed by a `startswith("monero")` prefix. Commands map 1:1: `status`→`monero-regtest-status`, `mine`→`monero-generate-blocks`, `fund`→`monero-fund-address` |
| (Suite side)                  | `packages/trezor-user-env-link/src/api.ts`: thin `moneroGenerateBlocks` / `moneroFundAddress` next to `mineBlocks` / `sendToAddressAndMineBlock`                                                                                                                  |

What stays in Suite (no production change for the external-monerod E2E mode): the device emulator
(already has `Capability_Monero`), `@trezor/connect` signing, the blockchain-link worker; the
existing XMR coin in `coins.json` already points at `127.0.0.1:18081`, and regtest = mainnet
address space, so no new coin/network enum is needed.

**Phased plan:** (0) ✅ validate the bootstrap + a ring-16 send locally — done, see
`examples/fund-and-verify.sh`. (1) drive the connect SEND path against this chain (device via
emulator). (2) the trezor-user-env monero-regtest backend + WS handlers. (3) the
`trezor-user-env-link` client methods. (4) a full `suite/e2e/tests/wallet/monero-regtest.test.ts`
copying `send-form-regtest.test.ts`. The monero-ts scan limitation above gates how the worker
read-path is asserted (oracle vs unit test) but does not block the send-path E2E.
