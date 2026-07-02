# Monero (XMR)

Monero support in Suite follows the **monero-gui model**: a local `monerod` daemon provides the
blockchain, and a client-side view-key scan (via `monero-ts`, i.e. `wallet2` compiled to WASM)
finds the account's outputs. The private view key never leaves the device-derived in-process path.

Monero is registered as an **experimental network** (`isExperimentalOnlyNetwork: true`); it only
appears once the user enables _Experimental networks_ in settings.

## Architecture

```
┌── suite-desktop (Electron main) ───────────────────────────────┐
│  modules/monerod.ts  → MonerodProcess (child process)          │
│  downloads + runs a pruned monerod, exposes local RPC          │
│  127.0.0.1:18081, reports download/sync progress over IPC      │
└────────────────────────────────────────────────────────────────┘
            ▲ IPC (suite-desktop-api: monerod/*)        │ local RPC
            │                                            ▼
┌── renderer ──────────────┐        ┌── @trezor/connect ─────────────────────────┐
│ Settings ▸ Monerod.tsx   │        │ getAccountInfo (XMR):                       │
│ toggle + progress UI     │        │  • getAccountDescriptor → MoneroGetAddress  │
└──────────────────────────┘        │    (descriptor = primary address)          │
                                     │  • MoneroGetWatchKey → privateViewKey       │
                                     │    (passed in-process to the worker only)  │
                                     │  blockchain-link MoneroWorker (monero-ts):  │
                                     │   createWalletFull(view-only) + sync()      │
                                     │   → balance / unlocked / tx history         │
                                     └─────────────────────────────────────────────┘
```

### Confidential data

The private **view key** is fetched from the device (`MoneroGetWatchKey`) inside
`connect/getAccountInfo` and handed to the blockchain-link worker through the in-process
`AccountInfoParams.monero` channel. It is **never** persisted, logged, echoed back into a
response, or sent to any external sink — consistent with the repo-wide confidential-data policy.

Because the descriptor is the (public) primary address and is **not** sufficient to scan, the
view key has to be supplied to the worker. It is fetched once (at discovery / account add) and the
resulting view-only wallet is **cached for the session** in the worker; routine background syncs
reuse the cached wallet and do not re-prompt the device. After an app restart the worker cache is
empty and the account stays at its last-stored balance until the view key is re-armed (see
_Known limitations_).

## What works

- **Daemon lifecycle** — download (per-platform GitHub release + SHA256 verify), run as a managed
  pruned child process, sync-progress UI, stop on quit. (`--mock-monerod` switch for e2e.)
- **Network registration** — `xmr` / `networkType: 'monero'`, backend `monero`, explorer, fee unit
  (piconero), 12 decimals, all renderer `networkType` switch points.
- **Account discovery** — descriptor = primary address, balance + unlocked balance + tx history via
  the local node scan.
- **Receive** — single primary address (`getFirstFreshAddress` account-based path), on-device
  address confirmation via `moneroGetAddress`.

## Send — not implemented (and why)

Sending is intentionally gated off (`views/wallet/send` shows a receive-only banner;
`composeSendFormTransactionFeeLevelsThunk` rejects for `networkType === 'monero'`).

The device side already exists: `@trezor/connect`'s `moneroSignTransaction` is a fully implemented
8-step protocol (`Init → SetInput → InputVini → AllInputsSet → SetOutput → AllOutSet → SignInput →
Final`). The blocker is the **host side**, which must:

1. **Construct the unsigned transaction data** the device needs — `tsx_data`
   (`MoneroTransactionData`: outputs, range-proof `rsig_data` grouping, fee, change, unlock time…)
   and `inputs` (`MoneroTransactionSourceEntry[]`: real outputs to spend + decoy ring members
   pulled from the chain + masks). This is exactly `wallet2::create_transactions_2`.
2. **Drive the protocol** (connect already does this).
3. **Assemble the device responses** (CLSAG signatures, range proofs, `out_pk`/`ecdh_info`/`tx_out`,
   encryption keys) **back into a serialized Monero transaction** and relay it to `monerod`.

Steps 1 and 3 are the consensus-critical core of Monero transaction building (RingCT, Bulletproofs+,
CLSAG, key-image/derivation handling, varint serialization). In monero-gui/CLI this is done by
`wallet2` compiled **with** `src/device_trezor/`, which speaks this same protobuf protocol over USB.

`monero-ts` (the WASM `wallet2` used here for scanning) **does not** include `device_trezor` and
does not expose the `tsx_data`/`inputs` construction or the final-assembly hooks. Its only
cold-signing surface is the generic `exportOutputs` / `importKeyImages` / `createTxs` →
`signTxs(unsignedTxHex)` → `submitTxs` flow, which requires a **software** cold wallet holding the
**spend key** — something a Trezor never reveals. So bridging `monero-ts` WASM to connect's
`moneroSignTransaction` is not possible as-is.

Note: the **device** computes all the secret-dependent cryptography — key images, CLSAG
signatures, Bulletproofs+ range proofs, commitments, masks, output keys (see the return fields of
`moneroSignTransaction`). The host does **not** implement that crypto; its job is input + decoy
selection, marshaling into the protobuf shapes, **serializing** the device's returned pieces into a
consensus-valid tx, and relaying it.

### Chosen path: B — TypeScript host-side construction

The device does the crypto, so the TS host needs: (1) input + decoy selection (`get_outs` from the
local monerod + gamma decoy distribution), (2) marshal into `tsx_data` + `MoneroTransactionSourceEntry[]`,
(3) drive the protocol (connect already does this), (4) serialize the device output into the
canonical Monero tx binary, (5) relay via monerod. No WASM fork / maintenance burden, and it fits
Suite's split (connect = device, TS = construction). Path A (fork the monero WASM build to expose
`hw::device` over JS so `wallet2` drives connect as its device transport) remains the alternative —
correctness inherited from C++, but weeks of Emscripten/Embind work plus owning a monero fork.

### Reference implementations (there is no JS/TS one — these are the port targets)

A web search (June 2026) confirmed **no JavaScript/TypeScript host-side Monero+Trezor signer exists**.
The protocol is implemented only in:

- **C++ (production):** `monero-project/monero` → `src/device_trezor/` (used by Monero CLI/GUI). The
  authoritative, current reference for marshaling + assembly.
- **Python (PoC by the protocol author, Dusan Klinec / ph4r05):** [`ph4r05/monero-agent`](https://github.com/ph4r05/monero-agent)
  — the readable host-side agent (constructs tsx data, drives the protocol, serializes via
  `monero-serialize`). Best structural blueprint for the TS port, but predates the CLSAG/BP+
  production era in places, so cross-check against the current C++/firmware. Protocol spec:
  [`ph4r05/monero-trezor-doc`](https://github.com/ph4r05/monero-trezor-doc) + the paper
  _"Privacy-friendly Monero transaction signing on a hardware wallet"_ (Klinec & Matyáš).
- **Device side (current):** `trezor-firmware` → `core/src/apps/monero` (what our `client_version: 3`
  protocol talks to).

JS Monero tx builders exist but are **software-wallet only** (they hold/use the spend key) — none
bridge to a hardware device: `mymonero-core-js`, `CoinSpace/monero-core-js`, `woodser/monero-ts`.
They are still useful as references for the Monero crypto/serialization **primitives** (keccak,
ed25519, varint, RingCT serialization).

### De-risking assets we have

- The connect e2e fixture `packages/connect/e2e/__fixtures__/moneroSignTransaction.ts` — 7 real
  `tsx_data` + `inputs` vectors to drive the protocol without inventing inputs.
- The **local monerod** validates an assembled tx via `send_raw_transaction { do_not_relay: true }`
  — consensus feedback without risking funds.
- The Trezor emulator (trezor-user-env) signs Monero.

First spike (the riskiest part first): take a fixture vector → sign on the emulator → write the TS
serializer → validate the assembled blob against the local monerod. If monerod accepts it, the
serialization is correct and the rest (selection, fee, marshaling) is mechanical. Test only on
stagenet/testnet until proven.

## Known limitations

- **Cross-restart sync re-arm** — after an app restart the worker has no cached wallet and the
  account shows its last-stored balance until the view key is re-fetched. Automatic re-fetch is not
  wired because `MoneroGetWatchKey` requires an on-device confirmation and must not run on every
  background poll.
- **Single primary address** — subaddresses are not surfaced; receive shows the primary address.
- **Send** — see above.
- **Runtime** — the scan path requires a synced `monerod` and a Monero-capable device; it is not
  exercised by headless unit/e2e runs.
