/**
 * @trezor/authdb/types — shared AuthDB DTOs.
 *
 * Pure data types with zero dependencies. Extracted so the /proof, /storage and /sync
 * modules can each depend only on the types they need, without a package-level cycle
 * (previously /proof imported its types from /storage's provider.ts).
 */

/**
 * Arbitrary metadata stored per Bitcoin address (an "auth label").
 * Serialized as JSON in the database (future: protobuf BLOB).
 */
export type AuthLabelMetadata = {
    label?: string;
    data?: unknown; // arbitrary JSON payload — not stored in device offline cache
    data_mac?: string; // MAC authorizing the data field — stored in device offline cache
};

/**
 * Merkle proof path: ordered array of sibling hashes from the leaf to the Merkle root.
 * Computed on-the-fly from the MPT built over all stored entries — never stored in the DB.
 */
export type MerkleProof = string[];

/**
 * A full auth-label entry as stored in the database.
 * counter tracks the version of this entry in the Merkle tree — incremented by the device
 * on each successful dbchange so stale updates can be rejected.
 * proof is NOT stored; it is generated from the MPT before each device interaction.
 */
export type AuthLabelEntry = {
    metadata: AuthLabelMetadata;
    counter: number;
};

/**
 * Merkle tree state checkpoint stored in the database, scoped per wallet.
 * root    — current Merkle root hash as maintained by the Trezor device.
 * counter — monotonically increasing version; incremented by the device on every tree mutation.
 * mac     — root-attestation token, if the provider has one: HMAC(mac_key, wallet_id||counter||root),
 *           as returned by AuthDbUpdateLeafResponse.mac / AuthDbApplyOfflineOperationsResponse.root_mac.
 *           Since mac_key is wallet-derived (not device-derived), this token is replayable via
 *           AuthDbFastForwardRoot on any physical device that has unlocked the same wallet.
 */
export type TreeState = {
    root: string;
    counter: number;
    mac?: string;
};

/** A single row returned for MPT construction, scoped to one wallet. */
export type AuthLabelRow = {
    address: string;
    networkSymbol: string;
    entry: AuthLabelEntry;
};

/**
 * A single mutation drained from a Trezor device's offline queue via AuthDbGetOfflineOperations
 * (wire type AuthDbOfflineOperation: sequence, address, old_value, new_value, mac). Hex-encoded
 * value fields, same convention as elsewhere: oldValue === '' means the address was absent when
 * queued (insert); newValue === '' means this entry deletes the address. `mac` is
 * HMAC(device_key, sequence||leaf_hash(address,old_value)||leaf_hash(address,new_value)) —
 * forwarded byte-for-byte when rebasing into AuthDbApplyOfflineOperations, never recomputed
 * host-side. deviceId is not part of the wire message (AuthDB has no distinct provenance id of
 * its own) — it's attached once persisted host-side, from the calling Device's ordinary
 * features.device_id.
 */
export type OfflineQueueEntry = {
    deviceId: string;
    walletId: string;
    mac: string;
    sequence: number;
    address: string;
    oldValue: string;
    newValue: string;
    /** Leaf counter of oldValue; absent/0 on INSERT. */
    oldCounter?: number;
    /** Leaf counter of newValue; 1 on INSERT, oldCounter+1 otherwise. */
    newCounter: number;
};

/** A queued entry that failed rebasing against the host's canonical stored state. */
export type OfflineQueueConflict = {
    entry: OfflineQueueEntry;
    reason: string;
};

/**
 * A single applied mutation, recorded for cross-device audit/conflict-display purposes.
 * The device itself retains no history — only current root/counter plus its own
 * not-yet-collected offline queue — so this log only ever exists host-side, built up as
 * authDbReplayQueue successfully applies operations.
 * oldCounter/newCounter are decoded from the existing entryToValueBytes value convention
 * (not a dedicated wire field — none exists yet); appliedAtRootCounter is the wallet's
 * root-level counter immediately after this specific operation was applied (the device
 * increments it by exactly one per applied operation).
 */
export type AuthHistoryEntry = {
    walletId: string;
    address: string;
    networkSymbol: string;
    deviceId: string;
    oldValue: string;
    newValue: string;
    oldCounter?: number;
    newCounter?: number;
    appliedAtRootCounter: number;
};

// ---------------------------------------------------------------------------
// Device-confirmed conflict resolution (phase 5 of docs/authdb-suite-architecture.md).
// These are wire-adjacent (they map 1:1 onto the AuthDbResolveConflict /
// AuthDbSignedConflictResolution protobuf messages and attach to AuthDbRebasedOperation),
// so they use snake_case field names and hex-encoded value/hash fields to match the wire
// boundary — unlike the camelCase domain DTOs above.
// ---------------------------------------------------------------------------

/**
 * Proof, sent to the device with a conflict-resolution advice, that backs the host's
 * claim about the CURRENT canonical state for one address — so the device can trust it
 * without holding any history of its own:
 *  - old_root_mac proves old_root is a genuine device-attested state
 *    (HMAC(root_mac_key, wallet_id||counter||old_root));
 *  - membership_proof proves the canonical leaf (canonical_value @ canonical_counter) is
 *    actually in old_root.
 */
export type ConflictProof = {
    old_root: string;
    old_root_mac: string;
    membership_proof: MerkleProof;
    canonical_value: string;
    canonical_counter: number;
};

/**
 * A device-signed record authorizing a single conflict-resolving leaf transition. Minted
 * by AuthDbResolveConflict and attached (optionally) to the rebased op during replay; the
 * device verifies `mac` with the conflict_resolution key instead of the op's original
 * leaf_approval mac. Hex-encoded value fields ('' = absent/delete), same convention as
 * OfflineQueueEntry.
 */
export type SignedConflictResolution = {
    address: string;
    resolved_old_value: string;
    resolved_old_counter: number;
    resolved_new_value: string;
    resolved_new_counter: number;
    mac: string;
};

/**
 * The advice the host sends to AuthDbResolveConflict: the queued op's (now-stale)
 * transition, the proposed resolved transition, and the ConflictProof backing the
 * host's canonical-state claim.
 */
export type ConflictAdvice = {
    address: string;
    op_old_value: string;
    op_old_counter: number;
    op_new_value: string;
    op_new_counter: number;
    resolved_new_value: string;
    resolved_new_counter: number;
    proof: ConflictProof;
};
