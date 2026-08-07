/**
 * @trezor/ward/types — shared AuthDB DTOs.
 *
 * Pure data types with zero dependencies. Extracted so the /proof, /storage and /sync
 * modules can each depend only on the types they need, without a package-level cycle
 * (previously /proof imported its types from /storage's provider.ts).
 */

/**
 * Arbitrary metadata stored per Bitcoin address (an "auth label").
 * Serialized as JSON in the database (future: protobuf BLOB).
 */
export type WardLabel = {
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
/**
 * The device-produced encrypted leaf blob (ward-design.md §2.1), all hex. The host
 * is NOT the encryptor and cannot compute it — it stores exactly what the device
 * returned in WARDPerformUpdateAck, keyed by the device-supplied `entryKey`, and
 * uses it to build proofs BY entry_key (commit = sha256(0x02||nonce||tag||len32(ct)||ct)).
 */
export type WardLeafBlob = {
    entryKey: string;
    entryType: string;
    nonce: string;
    tag: string;
    ct: string;
};

export type WardEntry = {
    metadata: WardLabel;
    counter: number;
    /** Present once the entry has been written via a device round (needed for proofs). */
    blob?: WardLeafBlob;
};

/**
 * Merkle tree state checkpoint stored in the database, scoped per wallet.
 * root    — current Merkle root hash as maintained by the Trezor device.
 * counter — monotonically increasing version; incremented by the device on every tree mutation.
 * mac     — root-attestation token, if the provider has one: HMAC(mac_key, wallet_id||counter||root),
 *           as returned by WARDConfirmCommitAck.root_mac (formerly WardUpdateLeafResponse.mac).
 *           Since mac_key is wallet-derived (not device-derived), this token is replayable via
 *           WardFastForwardRoot on any physical device that has unlocked the same wallet.
 */
export type TreeState = {
    root: string;
    counter: number;
    mac?: string;
};

/** A single row returned for MPT construction, scoped to one wallet.
 * appId is the domain that owns the entry; the trie leaf is keyed by
 * entry_key = sha256(appId || 0x00 || type || 0x00 || address), so entries from
 * different apps never collide even at the same address. */
/**
 * One committed authenticated transition (ward-design.md §2.1/§2.4/§7, batch-update)
 * — the append-only lineage record the host keeps so it can *verify* the MPT by a
 * backward-walk + per-batch root check, rather than trusting a flat rebuild.
 *
 * Batch-native: a transition is the batch link (`prevRoot` → `targetRoot` at a single
 * `counter`, uniform +1) carrying ALL device leaf blobs the batch wrote (`leaves`,
 * 1..N; a leaf with empty `ct` deletes that entry_key). A single-leaf write is just a
 * batch of one. The transition-auth tokens (`authCommit`/`headMac`/`sigCommit?`) are
 * stored OPAQUELY — the host holds no keys, so it cannot recompute or verify them; it
 * forwards them to the WM / another device. The host's own check is the keyless
 * per-batch root replay (`hydrate` reconstruction). `targetRootMac` is the device root MAC handed
 * back at reconcile (likewise opaque to the host).
 */
export type WardTransition = {
    counter: number;
    prevRoot: string; // root before this commit; '' = from empty tree (genesis)
    targetRoot: string; // root after; '' = tree became empty
    targetRootMac?: string;
    leaves: WardLeafBlob[]; // the batch's device leaves (1..N); ct==='' deletes that entry_key
    // batch-update transition authentication — opaque to the host (no keys):
    authCommit?: string; // MAC(K_auth, TAG_COMMIT‖ward_id‖from_c‖from_root‖to_c‖to_root)
    headMac?: string; // MAC(K_head, TAG_HEAD‖ward_id‖to_c‖to_root)
    sigCommit?: string; // Ed25519(K_sig, AuthCommit-preimage); present only when WARD_KSIG
};

export type WardRow = {
    appId: string;
    address: string;
    networkSymbol: string;
    /** First-class trie path (hex), == entry.blob.entryKey. The record's real key in
     * the keyed-path model (ward-design.md §2.1); indexed for O(1) serve-by-entry_key.
     * Optional only for rows written before the keyed model (no blob). */
    entryKey?: string;
    entry: WardEntry;
};
