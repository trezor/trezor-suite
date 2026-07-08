# AuthDB — suite-side architecture

Status: **implemented**. Describes the suite-side AuthDB code after the teardown to a
minimal device surface. Earlier revisions of this document described an offline-queue /
device-confirmed conflict-resolution design; that surface was removed. The Quota Manager
survives only as the counter authority consulted by `AuthDbInit` (below).

## Device surface (four wire interfaces)

The firmware exposes four request/response pairs:

- **`AuthDbInit`** — bootstrap the device's trusted state from untrusted host storage. The
  host relays (1) the Quota-Manager-signed latest counter — the device verifies the Ed25519
  signature over `b"AUTHDB QM v1" ‖ wallet_id ‖ counter(4B BE)` against its provisioned QM
  public key and stores it as `qm_last_counter` (anti-rollback ceiling) — and (2) the latest
  root from Evolu with its `root_mac`, which is installed only if `counter == qm_last_counter`
  and `root_mac` is one this device produced. A fresh wallet supplies no root and only sets
  the ceiling.
- **`AuthDbLookup`** — prove membership / non-membership of an address against the device's
  attested root. Read-only; echoes the device's `wallet_id`.
- **`AuthDbSetRoot`** — install a root (+ MAC) on the device (initial cross-device sync).
- **`AuthDbUpdateLeaf`** — apply a single leaf change; the device recomputes and re-attests
  the root, increments the global counter, and returns `(counter, new_root, wallet_id, mac)`.

Everything else (approvals, offline queue, cache, device-id, fast-forward, replay/conflict
resolution) was removed.

### Global-counter model

There is a single **global root counter** per wallet, not a per-address counter:

- `AuthDbUpdateLeaf` requires `new_counter == current_root_counter + 1`. The device stamps
  the changed leaf with that new global counter, bumps the root counter, and re-attests.
- The root-attestation MAC is `HMAC(root_mac_key, wallet_id ‖ counter ‖ new_root)`, with
  `root_mac_key` derived via SLIP-21 `_derive_mac_key(b"root_mac")`.
- `AuthDbUpdateLeafResponse` returns the new `counter`, `new_root`, `wallet_id`, and `mac`.
  The host persists `(root, counter, mac)` in its `tree_state` so it can later re-install
  the attested root on another device via `AuthDbSetRoot`.

## Module layout (inside `@trezor/authdb`)

The package is split into **subpath modules** (via `package.json` `"exports"` + tsconfig
paths). The root `index.ts` re-exports them as a barrel.

```
@trezor/authdb
  /types            DTOs only. Zero deps.
                    AuthLabelEntry, AuthLabelMetadata, TreeState, AuthLabelRow, MerkleProof.
  /proof            MPT / Merkle proof logic.
                    computeLeafHash, computeMerkleRoot, generateMerkleProof,
                    generateNonMembershipProof, evaluateProof, entryToValueBytes,
                    valueHexToEntry.  deps: /types, @noble/hashes.
  /storage          Provider CONTRACT + a pure in-memory reference impl.
                    AuthLabelLookupProvider (== AuthLabelProvider), InMemoryAuthLabelDb.
                    deps: /types.
  /storage/sqlite   The better-sqlite3 AuthLabelDb adapter (addresses + tree_state tables).
                    deps: /types, better-sqlite3 (optionalDependency — see below).
```

Dependency order is `types → proof → storage`; there are no cycles.

### Native-dependency containment

`@trezor/authdb` is imported broadly (connect, connect-common). To keep the native
`better-sqlite3` dependency out of connect's web/native bundles:

- The sqlite adapter lives behind its **own** subpath `@trezor/authdb/storage/sqlite`.
- `@trezor/authdb/storage` itself exports only the contract + the pure in-memory impl.
- `better-sqlite3` is an **optionalDependency**, resolved only by consumers that import the
  sqlite subpath (connect-cli).
- Importing `@trezor/authdb/proof` or `/storage` therefore never pulls sqlite.

### Storage contract

The provider is lookup-only — it caches the leaf set plus the attested root checkpoint:

```ts
interface AuthLabelLookupProvider {
    lookup(walletId, address, networkSymbol): AuthLabelEntry | null | Promise<…>;
    lookupOrCreate(walletId, address, networkSymbol): AuthLabelEntry | Promise<…>;
    upsert(walletId, address, networkSymbol, entry): void | Promise<…>;
    getAllEntries(walletId): AuthLabelRow[] | Promise<…>;
    getTreeState(walletId): TreeState | null | Promise<…>;   // { root, counter, mac? }
    setTreeState(walletId, state): void | Promise<…>;
}
```

## connect: wire shells + two orchestrators

`@trezor/connect`'s `api/authDbMethods/` holds:

- **Raw wire shells** produced by `createRawAuthDbMethod`: `authDbInit`, `authDbLookup`,
  `authDbSetRoot`, `authDbUpdateLeaf` — thin passthroughs to one proto request/response pair
  each.
- **Two high-level orchestrators** that compute Merkle proofs (from `@trezor/authdb/proof`)
  and read/write the provider (from `settingsStore`):
    - `authDbUpdateAddress` (CLI `dbchange`) — builds the leaf transition + proof, stamps the
      new leaf with `getTreeState().counter + 1`, calls `AuthDbUpdateLeaf`, then persists the
      device-attested `(root, counter, mac)` to `tree_state`. On an offline call (no device)
      it recomputes the root locally instead.
    - `authDbVerifyAddress` (CLI `dblookup`) — builds a membership / non-membership proof and
      calls `AuthDbLookup` (or, offline, checks local root consistency).

Both orchestrators reject a `wallet_id` mismatch: the device's echoed `wallet_id` must equal
the caller-supplied `walletId` (defence in depth — only the device proves which seed +
passphrase was unlocked).

`@trezor/protobuf` keeps the wire message definitions; `connect-cli` keeps CLI dispatch and
consumes `@trezor/authdb/storage/sqlite`.

## connect-cli

`connect-cli` exposes five DB commands: `dbinit`, `dblookup`, `dbchange`, `dbsetroot`,
`dblistroots`.
Because the high-level methods reject a `wallet_id` mismatch, the CLI first resolves the
device's real `wallet_id` with a throwaway **low-level `AuthDbLookup` probe** (the low-level
call echoes `wallet_id` without the mismatch rejection), unless `--wallet-id` is pinned.
