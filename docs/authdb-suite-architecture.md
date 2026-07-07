# AuthDB — suite-side architecture (proposed)

Status: **design proposal** (not yet implemented). Describes the target module split
for the suite-side AuthDB code and the device-confirmed conflict-resolution protocol.
No behaviour changes are implied until the migration phases below are carried out.

## Why

Today the suite-side AuthDB logic is split unevenly:

- `@trezor/authdb` mixes proof/MPT logic (`merkleTree.ts`) with storage **contracts** and
  all shared DTO types (`provider.ts`); `merkleTree.ts` imports its types _from_
  `provider.ts`, so "proof" already depends on "storage-contracts".
- `@trezor/connect`'s `api/authDbMethods/api/` holds both thin wire wrappers and fat
  orchestrators — notably `authDbReplayQueue.ts` (drain + **pre-pass** conflict detection
    - rebase + batch apply + persist) and `authDbUpdateAddress.ts`.
- `connect-cli/authdb.ts` (`AuthLabelDb`, better-sqlite3) is the only concrete storage
  implementation.

Conflict handling is currently a **host-side pre-pass**: `authDbReplayQueue` builds a
conflict-free prefix (stops at the first `oldValue` mismatch) and does one
`AuthDbApplyOfflineOperations`. This design moves conflict resolution onto the **device**,
authorised by a proof-backed advice from the host.

## Module layout (inside `@trezor/authdb`)

The split is by **subpath modules** inside the existing `@trezor/authdb` package (via
`package.json` `"exports"` + tsconfig paths). The root `index.ts` stays a re-export barrel
for backward compatibility, so existing importers keep working during migration.

```
@trezor/authdb
  /types            DTOs only. Zero deps.
                    AuthLabelEntry, AuthLabelMetadata, TreeState, AuthLabelRow, MerkleProof,
                    OfflineQueueEntry, OfflineQueueConflict, AuthHistoryEntry,
                    ConflictProof, SignedConflictResolution.
  /proof            MPT / Merkle proof logic (today's merkleTree.ts).
                    computeLeafHash, computeMerkleRoot, generateMerkleProof,
                    generateNonMembershipProof, evaluateProof, entryToValueBytes,
                    valueHexToEntry.  deps: /types, @noble/hashes.
  /storage          Provider CONTRACTS + a pure in-memory reference impl.
                    deps: /types.
  /storage/sqlite   The better-sqlite3 AuthLabelDb adapter, moved from connect-cli.
                    deps: /types, better-sqlite3 (optional/peer — see below).
  /sync             Drain + rebase + replay + device-confirmed conflict resolution +
                    fast-forward, over an injected AuthDbDeviceClient.
                    deps: /types, /proof, /storage (contract only).
```

Dependency order is `types → proof → storage → sync`; there are no cycles (the current
`proof → provider` type coupling is resolved by `/types`).

```
types ─► proof ─┐
   │            ├─► sync ─► @trezor/connect (wire shells) ─► connect-cli
   └─► storage ─┘                    ▲
        └─ storage/sqlite ───────────┘  (adapter injected at init)
```

### Native-dependency containment

`@trezor/authdb` is imported broadly (connect, connect-common, `exports.ts`). To keep the
native `better-sqlite3` dependency out of connect's web/native bundles:

- The sqlite adapter lives behind its **own** subpath `@trezor/authdb/storage/sqlite`.
- `@trezor/authdb/storage` itself exports only contracts + a pure in-memory impl.
- `better-sqlite3` is an **optionalDependency / peerDependency**, resolved only by
  consumers that import the sqlite subpath (connect-cli).
- Importing `@trezor/authdb/proof` or `/sync` therefore never pulls sqlite.

### What stays outside `@trezor/authdb`

- `@trezor/connect` `api/authDbMethods/` remains the **wire shell** — the method classes
  extend `AbstractMethod` and cannot move. `authDbReplayQueue` / `authDbFastForwardRoot`
  shrink to: read the `settingsStore` provider, build an `AuthDbDeviceClient` from
  `cmd.typedCall`, and delegate to `@trezor/authdb/sync`. The raw wrappers
  (`authDbLookup`, `authDbUpdateLeaf`, …) are unchanged.
- `@trezor/protobuf` keeps the wire message definitions.
- `connect-cli` keeps CLI dispatch and consumes `@trezor/authdb/storage/sqlite`.

### `AuthDbDeviceClient` (transport abstraction)

`/sync` never depends on `@trezor/connect` (that would be a cycle). It talks to the device
through an injected interface, which connect implements over `cmd.typedCall`:

```ts
interface AuthDbDeviceClient {
    getOfflineOperations(): Promise<...>;
    resolveConflict(advice): Promise<SignedConflictResolution>;
    applyOfflineOperations(entriesWithOptionalResolution): Promise<...>;
    deleteOfflineOperations(): Promise<...>;
    fastForwardRoot(state): Promise<...>;
}
```

Because the engine is transport-agnostic, the same `/sync` code can drive an
Evolu-mediated sync today or a BLE peer-to-peer relay later (the firmware sync proposal's
Part 2) simply by swapping the client implementation.

## Conflict resolution — device-confirmed, host-advised, signed

Conflict resolution is **authoritative on the Trezor**, not host policy. The host sends
proof-backed _advice_; the device verifies it, confirms with the user, and signs a
resolution record; the signed record then rides along with the operation during replay.

### Keys

A new SLIP-21 domain key `conflict_resolution` is derived alongside the existing
`root_mac` and `leaf_approval` keys (`_derive_mac_key(b"conflict_resolution")`).

### Data shapes (`/types`)

```ts
type ConflictProof = {
    old_root: string; // the canonical root the resolution is based on
    old_root_mac: string; // HMAC(root_mac_key, wallet_id‖counter‖old_root)
    //   — proves old_root is a genuine device-attested state
    membership_proof: MerkleProof; // proves the canonical leaf is in old_root
    canonical_value: string;
    canonical_counter: number;
};

type SignedConflictResolution = {
    address: string;
    resolved_old_value: string;
    resolved_old_counter: number;
    resolved_new_value: string;
    resolved_new_counter: number;
    mac: string; // HMAC(conflict_resolution_key, <resolving transition>)
};

// Each replayed offline-queue entry gains an OPTIONAL attached resolution:
//   conflict_resolution?: SignedConflictResolution

// The advice sent to AuthDbResolveConflict: the queued op's transition, the proposed
// resolved transition, and the proof backing the host's canonical-state claim.
type ConflictAdvice = {
    address: string;
    op_old_value: string;
    op_old_counter: number; // what the queued op assumed
    op_new_value: string;
    op_new_counter: number;
    resolved_new_value: string;
    resolved_new_counter: number; // proposed winner
    proof: ConflictProof;
};
```

The proof is what lets the device trust the host's claim about the current canonical
state **without holding any history itself**: `old_root_mac` proves the root is genuine,
and `membership_proof` proves the claimed current leaf is actually in that root.

Where these land in the (now-implemented) module layout:

- `ConflictProof`, `SignedConflictResolution` → **`src/types/index.ts`**.
- The per-entry optional resolution attaches to **`WireRebasedOperation`** in
  `src/sync/index.ts` (a new optional `conflict_resolution` field) and to the
  `AuthDbRebasedOperation` protobuf message on the wire.
- `membership_proof` is built with the existing **`generateMerkleProof`** from
  `src/proof`; `old_root` + `old_root_mac` come from the provider's `getTreeState`
  (`TreeState.root` / `TreeState.mac`) — no new proof primitive is needed.

### `AuthDbResolveConflict` (dedicated RPC)

- **Request (host advice):** the queued op's transition, the proposed resolved
  transition, and a `ConflictProof`.
- **Device:**
    1. verify `old_root_mac` with the `root_mac` key → `old_root` is genuine;
    2. verify `membership_proof` reconstructs `old_root` from the canonical leaf → the
       host's "current value" claim is real;
    3. **confirm on-screen** (the user approves the resolution);
    4. sign the resolving transition with the **`conflict_resolution` key**;
    5. return a `SignedConflictResolution`.

### Replay flow change in `src/sync/index.ts`

Today `replayQueue()` runs a **pre-pass**: it walks the queue and, on the first
`canonicalValue.get(op.address) !== op.oldValue` mismatch, pushes an `OfflineQueueConflict`
and `break`s — every op after a stale one is silently skipped. Phase 5 replaces that with
an **inline, per-op resolve step**:

1. Rebase the op against current canonical (fresh proof from `src/proof`).
2. No conflict (`currentValue === op.oldValue`) → build the candidate as today.
3. Conflict → obtain a `SignedConflictResolution` (see below) and attach it to the
   candidate as `conflict_resolution`, then **continue** with the next op instead of
   `break`ing. The candidate's rebased proof is computed against the _resolved_ new
   value/counter.
4. Submit the batch via `device.applyOfflineOperations(...)`; each `WireRebasedOperation`
   now carries its optional `conflict_resolution`.

Obtaining the resolution, per conflict:

- **Check `provider.getConflictResolution(...)` first** (dedup + resumability). If a record
  exists for this conflict identity, reuse it — no device prompt.
- Otherwise build the `ConflictProof` (`generateMerkleProof` + `getTreeState`'s
  `root`/`mac`), call `device.resolveConflict(advice)`, and `provider.putConflictResolution(...)`
  the returned record.

One confirmation per conflict; a retried replay re-attaches the stored record and
re-confirms nothing.

### `AuthDbDeviceClient` extension (`src/sync/index.ts`)

Add one method to the existing interface; connect's shells implement it with a
`cmd.typedCall`, exactly like the other four:

```ts
interface AuthDbDeviceClient {
    // …existing…
    resolveConflict(advice: ConflictAdvice): Promise<SignedConflictResolution>;
}
```

`WireRebasedOperation` gains `conflict_resolution?: SignedConflictResolution`; the connect
adapter passes it straight through to the `AuthDbApplyOfflineOperations` typedCall (its
proto message gaining the same optional field).

### Storage additions (`src/storage`)

Extend the provider contract (and implement in both `InMemoryAuthLabelDb` and the sqlite
`AuthLabelDb`) with a conflict-resolution record store, keyed by conflict identity:

```ts
type AuthConflictResolutionProvider = {
    getConflictResolution(
        walletId: string, address: string, networkSymbol: string, sequence: number,
    ): SignedConflictResolution | null | Promise<…>;
    putConflictResolution(walletId: string, record: SignedConflictResolution): void | Promise<…>;
};
```

Add it as another `Partial<…>` arm of `AuthLabelProvider`. The sqlite adapter gets a new
`auth_conflict_resolution` table (columns mirroring `SignedConflictResolution` + the
identity key); `InMemoryAuthLabelDb` gets a `Map`. connect-cli gets a `dbresolutions`
inspection command (optional, matching `dbhistory`).

### connect wire shells

`authDbReplayQueue.ts`'s `AuthDbDeviceClient` literal gains a `resolveConflict` entry
(`cmd.typedCall('AuthDbResolveConflict', 'AuthDbResolveConflictResponse', advice)`); no
other shell change — the engine owns the new logic.

## Firmware surface required

This protocol spans firmware and suite. The suite side (`src/sync`) orchestrates; the
firmware follow-up must provide:

- `_derive_mac_key`: add the `conflict_resolution` domain
  (`_derive_mac_key(b"conflict_resolution")`), alongside `root_mac` / `leaf_approval`.
- New handler `apps/authdb/resolve_conflict.py` for `AuthDbResolveConflict` — verify
  `old_root_mac` (via the `root_mac` key) + `membership_proof` against `old_root`, confirm
  on-screen, sign the resolving transition with the `conflict_resolution` key, return
  `SignedConflictResolution`.
- Add an optional `conflict_resolution` field to `AuthDbRebasedOperation` in
  `common/protob/messages-authdb.proto`; `_replay.py` verifies it with the
  `conflict_resolution` key when present (its per-op MAC verification hook already exists).
- New `MessageType` wire IDs (2330+) for `AuthDbResolveConflict` / `…Response`, plus the
  matching regeneration on the suite side (`messages_pb.js` MessageType enum +
  `messages-authdb_pb.js` descriptor — the same regeneration the earlier wire-protocol
  fixes required).

The design deliberately reuses existing primitives (the per-address leaf counter, the
attestation-MAC scheme, and `_replay.py`'s per-op MAC verification), adding only one key,
one RPC, and one optional field.

## Migration (phased)

Phases 1–4 are **implemented** (module split + `/sync` extraction; the sqlite adapter
moved into `@trezor/authdb/storage/sqlite`; connect's replay/fast-forward reduced to
shells over `AuthDbDeviceClient`; `@trezor/authdb`'s root `index.ts` remains a
compatibility barrel; behaviour unchanged — still the host-side pre-pass). Verified by the
package's own type-check + unit tests and the connect `authDbMethods` test suite.

Phase 5 (device-confirmed conflict resolution) is the remaining work, in this order:

5a. **Types** (`src/types`): add `ConflictProof`, `SignedConflictResolution`, `ConflictAdvice`.
5b. **Storage** (`src/storage`): add `AuthConflictResolutionProvider` to the contract +
`AuthLabelProvider`; implement in `InMemoryAuthLabelDb` and the sqlite `AuthLabelDb`
(new `auth_conflict_resolution` table).
5c. **Firmware + protobuf**: `conflict_resolution` key, `AuthDbResolveConflict` handler,
the optional `conflict_resolution` field on `AuthDbRebasedOperation`, new wire IDs;
regenerate the suite protobuf descriptors.
5d. **Sync** (`src/sync`): extend `AuthDbDeviceClient` with `resolveConflict`, add the
optional field to `WireRebasedOperation`, and replace `replayQueue`'s pre-pass with the
inline resolve loop (with storage-backed dedup).
5e. **connect shell**: add the `resolveConflict` typedCall to the `AuthDbDeviceClient`
literal; optional connect-cli `dbresolutions` command.
5f. Update `synchronization.dot` (already drawn as PROPOSED — flip to implemented) and
unit-test the resolve loop with a mocked `AuthDbDeviceClient` + `InMemoryAuthLabelDb`.

Because the engine is transport-agnostic and the resolution is device-signed, the same
`resolveConflict` + apply flow also serves the Part-2 BLE peer-sync case (no additional
suite surface beyond a different `AuthDbDeviceClient`).
