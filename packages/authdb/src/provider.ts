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
 * Required storage contract for auth-label entries. Every entry lives under a
 * walletId — the Merkle tree (and its root/counter checkpoint in TreeState) is
 * computed per wallet, so two wallets' addresses never mix into one root.
 * The only implementation today is AuthLabelDb (better-sqlite3, connect-cli dev/testing).
 * An Evolu-backed implementation for suite-desktop production is planned but not yet built.
 */
export type AuthLabelLookupProvider = {
    lookup(
        walletId: string,
        address: string,
        networkSymbol: string,
    ): AuthLabelEntry | null | Promise<AuthLabelEntry | null>;
    lookupOrCreate(
        walletId: string,
        address: string,
        networkSymbol: string,
    ): AuthLabelEntry | Promise<AuthLabelEntry>;
    upsert(
        walletId: string,
        address: string,
        networkSymbol: string,
        entry: AuthLabelEntry,
    ): void | Promise<void>;
    getAllEntries(walletId: string): AuthLabelRow[] | Promise<AuthLabelRow[]>;
    /** Each wallet keeps its own root checkpoint, identified by walletId. */
    getTreeState(walletId: string): TreeState | null | Promise<TreeState | null>;
    setTreeState(walletId: string, state: TreeState): void | Promise<void>;
    /** Releases any held resources (e.g. an open database handle). */
    dispose?(): void | Promise<void>;
};

/**
 * Optional MAC pre-approval extension. A provider implementing this alongside
 * AuthLabelLookupProvider lets high-level AuthDB methods skip a redundant device
 * confirmation when a valid prior approval already exists for an entry.
 */
export type AuthLabelApprovalProvider = {
    lookupApproval(
        walletId: string,
        address: string,
        networkSymbol: string,
    ): { mac: string; deviceId: string } | null | Promise<{ mac: string; deviceId: string } | null>;
    setApproval(
        walletId: string,
        address: string,
        networkSymbol: string,
        mac: string,
        deviceId: string,
    ): void | Promise<void>;
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
};

/** A queued entry that failed rebasing against the host's canonical stored state. */
export type OfflineQueueConflict = {
    entry: OfflineQueueEntry;
    reason: string;
};

/**
 * Optional extension for providers that persist a device's offline queue (EntryDB)
 * ahead of applying it to the Merkle tree — lets a device flush queued mutations in
 * one round-trip when it comes back online, and lets the host replay them in
 * `sequence` order before advancing the wallet's tree state.
 */
export type OfflineQueueProvider = {
    appendQueueEntries(entries: OfflineQueueEntry[]): void | Promise<void>;
    getQueueEntries(walletId: string): OfflineQueueEntry[] | Promise<OfflineQueueEntry[]>;
    /** Drops walletId's queue entries once applied, up to and including throughSequence. */
    clearQueueEntries(walletId: string, throughSequence: number): void | Promise<void>;
};

/** Combined provider type accepted by ConnectSettings — approval/queue support is optional. */
export type AuthLabelProvider = AuthLabelLookupProvider &
    Partial<AuthLabelApprovalProvider> &
    Partial<OfflineQueueProvider>;
