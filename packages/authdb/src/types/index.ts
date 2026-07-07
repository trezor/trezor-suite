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
