// Backward-compatible barrel. The package is organized into modules — import a specific
// one (@trezor/ward/proof, /storage, /storage/sqlite, /types) to keep bundles
// tight, or the barrel for everything except the native sqlite adapter.

// Proof (Merkle / MPT) primitives.
export {
    computeLeafHash,
    entryToValueBytes,
    valueHexToEntry,
    generateMerkleProof,
    computeMerkleRoot,
    generateNonMembershipProof,
    evaluateProof,
    // keyed / encrypted-leaf model (serve proofs by the device's entry_key)
    commitOf,
    leafFromCommit,
    computeRootFromBlobs,
    proofByKey,
    nonMembershipByKey,
} from './proof';
export type { BlobRow } from './proof';

// Shared DTO types.
export type * from './types';

// Storage-provider contracts + the pure in-memory reference implementation.
// (The better-sqlite3 adapter is intentionally NOT re-exported here — import it from
// @trezor/ward/storage/sqlite so the native module never reaches barrel consumers.)
export * from './storage';

// Application layer — pure host-side resolve/prepare/persist helpers (transport-free).
export * from './app';
