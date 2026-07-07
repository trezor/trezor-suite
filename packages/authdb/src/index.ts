// Backward-compatible barrel. The package is organized into modules — import a specific
// one (@trezor/authdb/proof, /storage, /storage/sqlite, /sync, /types) to keep bundles
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
} from './proof';

// Shared DTO types.
export type * from './types';

// Storage-provider contracts + the pure in-memory reference implementation.
// (The better-sqlite3 adapter is intentionally NOT re-exported here — import it from
// @trezor/authdb/storage/sqlite so the native module never reaches barrel consumers.)
export * from './storage';

// Offline-queue sync engine + the AuthDbDeviceClient transport interface.
export * from './sync';
