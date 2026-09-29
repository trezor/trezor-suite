# @suite/colibri-nonce-verifier

Verifies the on-chain nonce of an Ethereum mainnet account with the
[Colibri](https://github.com/corpus-core/colibri-stateless) stateless light-client verifier. Used by
the desktop `verified-nonce` module (`suite/desktop-app-main`), which runs it inside an Electron
utility process; the renderer only submits `{ requestId, chainId: '1', address }` and renders the
returned envelope (`@suite/desktop-app-api/src/verifiedNonce.ts`).

The claim a verified envelope makes is exactly: _for address A on chain 1, the account nonce in the
authenticated state at block H is N_, where H is the newest block the prover offered, authenticated by
a sync-committee signature chain from the configured checkpoint and no older than 60 s. It says
nothing about pending transactions and is not a finality claim.

## What is verified, and by whom

| Step                                         | Where                                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| Proof acquisition (POST to prover)           | `createNonceVerifier` → `createRpcCtx` with `PROOF_ONLY`   |
| Consensus proof from checkpoint, EL header   | Colibri C core (`verifyProof`), native addon               |
| Account trie proof under that header's root  | Colibri C core                                             |
| Address bound to the request                 | Colibri C core (`proof does not match the address`)        |
| Nonce = proven account value                 | Colibri C core (result), re-parsed as `bigint`             |
| Header hash/number/timestamp for the UI      | `extractAuthenticatedHeader` from the **same proof bytes** |
| 60 s freshness, +15 s skew, monotonic budget | Colibri (`min_latest_block_ts`) **and** `checkFreshness`   |

Strictness decisions that differ from Colibri's defaults:

- `C4Client` is not used. Its default strategy falls back to an unverified RPC read and its remote
  mode falls back to local proving when the prover errors. The adapter drives the runtime directly;
  the request router answers only `prover` requests while acquiring and only `beacon_api` /
  `checkpointz` requests while verifying. `eth_rpc` is never answered.
- `resetCaches()` runs before every acquisition so no `last_block_hash` is advertised and the prover
  must return the full `clProof` header variant. A `blockHash` (cached reference) variant would make
  the header metadata unattributable and is reported as `METADATA_UNAVAILABLE`.
- Only `kind === 'native'` is accepted in production; `C4_FORCE_NATIVE=1` is pinned and the
  `C4_NATIVE_ADDON` / `C4_DISABLE_NATIVE` overrides are cleared before the addon loads. The packaged
  app also excludes `c4w.js` / `c4w.wasm`, so no WASM fallback exists.
- Colibri's default Node storage writes `states_1` / `sync_1_*` relative to `cwd`; the verifier
  registers a file storage under `userData/colibri/chain-1/policy-<id>/schema-<n>/` instead. A new
  trust policy therefore always bootstraps from its own checkpoint.
- Per-response (16 MiB) and per-job (32 MiB) byte limits are enforced while streaming; a 60 s job
  deadline runs on the monotonic clock. A cold bootstrap that spends the freshness window may retry
  once, warm, inside the same deadline.

## Trust, but verify: the evidence block

A verified envelope carries an `evidence` block read from the exact bytes that verified, and the
account details panel shows it under "Show verification details" / exports it with "Copy
verification record". None of it asks the user to trust Suite:

| Fact                                                                   | How to check it independently                                                 |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Block number, hash, timestamp, parent hash, state root                 | Any block explorer or `eth_getBlockByNumber` on a node you trust              |
| The nonce at that block                                                | `eth_getTransactionCount(address, 0x<block number>)` on a node you trust      |
| Beacon slot of the block, the slot the sync committee signed, N of 512 | `/eth/v2/beacon/blocks/<slot>` on any beacon node or a beacon explorer        |
| Trust anchor (policy, checkpoint root and epoch)                       | `finality_checkpoints` on any beacon node / checkpointz server for that epoch |
| Proof SHA-256, size and the raw proof bytes                            | `yarn workspace @suite/colibri-nonce-verifier verify-record <record.json>`    |
| Which hosts served the proof and the consensus data, bytes, duration   | Informational                                                                 |

`verify-record` re-verifies the proof bytes from a copied record from scratch, with the native addon
(or the WASM build with `COLIBRI_TEST_RUNTIME=wasm`), starting from the record's own checkpoint,
and compares every stated fact with what the verifier reads from the bytes. It re-establishes the
signature chain and the account proof; it does not re-check freshness, because the record is a past
observation, and prints the block's current age instead.

## Trust configuration

`src/trustManifest.mainnet.json` names the checkpoint root, its epoch/slot/time, the sources it was
cross-checked against, the endpoints allowed per request type and a review expiry. The shipped
policy `mainnet-2026-09` was populated on 2026-09-25 from three checkpointz servers that agreed on
the finalized root of epoch 477970. A missing or expired checkpoint makes every verification fail
closed with `TRUST_CONFIG_INVALID`; refresh it with:

```sh
yarn workspace @suite/colibri-nonce-verifier trust-manifest:populate --policy-id mainnet-2026-10 --expires 2026-12-01
```

The script queries every configured checkpointz endpoint for the current finalized checkpoint,
requires all of them to agree, and writes root/epoch/slot/timestamp/sources/obtainedAt into the
manifest. Review the diff before committing it; the checkpoint is the trust anchor of the feature.

Trust dependencies beyond the manifest: the `beaconApi` endpoints serve the light-client bootstrap and
updates that the verifier checks against the checkpoint, and the `checkpointz` endpoints answer the
weak-subjectivity cross-check Colibri performs when the cached committee is older than the WSP. A
compromise of those anchors is outside the "dishonest account RPC" guarantee. The `prover` endpoints
are untrusted witnesses.

## Tests

- `yarn workspace @suite/colibri-nonce-verifier test:unit` — unit suites plus the fixture scenarios
  through the **native** addon (CI and machines with a matching prebuild).
- `COLIBRI_TEST_RUNTIME=wasm yarn workspace @suite/colibri-nonce-verifier test:fixtures` — the same
  scenarios through Colibri's WASM build of the same C core, for hosts without a loadable prebuild.
  Jest cannot load the WASM glue (an ES module) in its module VM, hence the separate runner.

- `yarn workspace @suite/colibri-nonce-verifier test:live [0x<address>]` — one real verification
  against the shipped manifest and the public endpoints from plain Node (no Electron, no Tor
  interceptor). Needs network and a populated manifest; never part of CI. Per-endpoint failures are
  logged as `<phase> <type> endpoint #<n>: <reason>` without URLs, bodies or addresses.

Colibri's Node runtime registers a default storage before it hands the runtime out, and its fs-backed
variant loads `node:fs` through a dynamic `import()` that jest's VM rejects even on the native path.
The scenarios therefore install a `localStorage`-shaped shim (`installMockLocalStorage`) so Colibri
picks its synchronous default; the verifier replaces the storage with its own immediately afterwards.

On a Linux aarch64 host whose `libstdc++` is older than the prebuild needs, point the test process at
a newer one (e.g. `libstdc++.so.6` and `libgcc_s.so.1` from an xPack GCC release):
`LD_LIBRARY_PATH=<dir> yarn workspace @suite/colibri-nonce-verifier test:unit`.

Fixtures under `mocks/mockColibriFixtures/` are recorded mainnet data from
`corpus-core/colibri-stateless` `test/data` (MIT, revision `35af9d9452641b7be552437cb1e043f27e87de34`);
the proofs were produced from those recordings by Colibri's local prover. The scenarios cover a valid
envelope, a cold bootstrap from the checkpoint, stale and future timestamps, wrong address, tampered
account leaf / header / signature / address, a header spliced from another block, plain JSON-RPC
instead of proof bytes, prover down with no RPC fallback, oversized bodies, an unpopulated manifest,
an implausible clock, request validation, cancellation and job serialization.

Not covered offline: a non-existent account (no recorded non-inclusion proof is available).

## Platform support

Prebuilds exist for darwin-arm64, darwin-x64, linux-x64, linux-arm64 and win32-x64. The linux-arm64
prebuild links `libstdc++` dynamically and needs `GLIBCXX_3.4.32` (GCC 13 era); older distributions
report `NATIVE_UNAVAILABLE`. linux-x64 only needs glibc ≥ 2.25.

## Validation summary (2026-09-25, Suite `c6f6ffd3cb`, Colibri 3.0.0)

Run on the development container (aarch64, Debian 12, Node 20) with the arm64 prebuild loaded against
`libstdc++` 6.0.34 from xPack GCC 15.2.0 via `LD_LIBRARY_PATH` (the system one is too old, see platform
support). No Ethereum endpoint is reachable there, so everything below is offline.

| Check                                                                     | Result                      |
| ------------------------------------------------------------------------- | --------------------------- |
| Fixture scenarios through the **native** addon (`test:unit`, jest)        | 19/19                       |
| Fixture scenarios through the native runtime (`test:fixtures`)            | 19/19                       |
| Fixture scenarios through the WASM build (`test:fixtures`)                | 19/19                       |
| Verifier unit suites (rlp, quantity, freshness, manifest, router, header) | 33 tests                    |
| Desktop controller (queue, coalescing, cancel, crash, envelope binding)   | 10 tests                    |
| Renderer slice + thunks                                                   | 9 tests                     |
| Electron bridge / channel tests                                           | 29 tests                    |
| `type-check` — verifier, desktop-app-main/api/api-electron, @trezor/suite | pass                        |
| `lint:js` (`ESLINT_RUN_EXPENSIVE_CHECKS=true`) on the same packages       | pass                        |
| `build:core` (main + `threads/colibri-nonce-verifier.js`, Colibri extern) | pass                        |
| project references, workspace resolutions, dedupe, requirements, depcheck | pass                        |
| translations (duplicates / unused), circular imports                      | pass                        |
| Fixture timings, native, in-container (fixture replay, no network)        | warm ≈ 5 ms, cold ≈ 90 ms   |
| Fixture timings, WASM, in-container                                       | warm ≈ 120 ms, cold ≈ 2.9 s |
| `test:live` on macOS arm64 (native, public endpoints, cold)               | verified, 427 ms, 30 KB     |

The live run (2026-09-25, policy `mainnet-2026-09`) produced a verified envelope for nonce 2047 at
block 26056717 in 2 requests. Still open: a packaged-app smoke test, the in-app verification path
under Suite's Tor interceptor (see the desktop module), the non-existent-account case, and the
in-app same-block RPC comparison from the spec (the record makes it a one-line manual check).

## Upstream observations (revision 35af9d94)

- `verify_account_proof` does not check the requested block tag against the authenticated header
  (`c4_eth_matches_blocknumber` is only used for block proofs); its comment refers to a non-existent
  `eth_verify_state_proof`. Only the `"latest"` freshness bound ties the proof to the present, which
  is why this integration extracts the header from the verified bytes itself.
- `BLOCK_HASH_CACHE` memoizes validated signing roots in-process, so a proof whose header was already
  validated is accepted even with a damaged signature (harmless, but surprising in tests).
- `initNodeRuntime` registers the fs-backed default storage through a dynamic `import("node:fs")` even
  when the native addon is used, so the Node runtime cannot initialise inside a CommonJS VM such as
  jest's without a `localStorage`/Cache shim; a `require` would do there.
- The linux-arm64 prebuild is not self-contained (see above); linux-x64 is.
