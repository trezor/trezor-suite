import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import type { MerkleProof, WardEntry, WardRow } from '../types';

// ---------------------------------------------------------------------------
// MPT hashing primitives — must match ward_tree.py exactly
// ---------------------------------------------------------------------------

const utf8 = (s: string) => new TextEncoder().encode(s);

// Deterministic value encoding (networkSymbol + sorted metadata).
//
// Strict counter model: the counter is NOT part of the value bytes. It lives only
// in the 4-byte leaf field (see computeLeafHash), which the device stamps at commit
// time. Baking it into the value would let the host inject a guessed counter into
// WARDQueueUpdate.new_value before the device derives the real one.
export const entryToValueBytes = (networkSymbol: string, entry: WardEntry): Uint8Array => {
    const metaSorted = Object.fromEntries(
        Object.entries(entry.metadata).sort(([a], [b]) => a.localeCompare(b)),
    );
    const encoded = `${networkSymbol}:${JSON.stringify(metaSorted)}`;

    return utf8(encoded);
};

// Inverse of entryToValueBytes — decodes a hex-encoded value (e.g. an offline-queue
// entry's new_value) back into its networkSymbol and metadata. The counter is NOT
// carried in the value under the strict model, so it cannot be recovered here; the
// caller supplies the counter from the tree/device (it is not part of the payload).
// Splits on only the first colon since the trailing JSON metadata may itself contain
// colons.
export const valueHexToEntry = (
    valueHex: string,
): { networkSymbol: string; metadata: WardEntry['metadata'] } => {
    const decoded = new TextDecoder().decode(hexToBytes(valueHex));
    const firstColon = decoded.indexOf(':');

    const networkSymbol = decoded.slice(0, firstColon);
    const metadata = JSON.parse(decoded.slice(firstColon + 1));

    return { networkSymbol, metadata };
};

const ZERO = new Uint8Array([0x00]);

// MVP entry type: the only kind of identifier keyed today is an address. Baked into
// entry_key so the layout reserves a type slot; a constant for now (no wire field).
const ENTRY_TYPE = 'address';

// entry_key = SHA-256(app_id || 0x00 || type || 0x00 || identifier). 32 bytes, and it
// IS the trie path (no second path-hashing step). Because it is a hash, a
// non-membership witness reveals only a hash of another app's identifier — never the
// plaintext. Must stay byte-for-byte identical to firmware `entry_key` / Python
// `_entry_key`.
export const entryKey = (appId: string, identifier: string): Uint8Array =>
    sha256(concatBytes(utf8(appId), ZERO, utf8(ENTRY_TYPE), ZERO, utf8(identifier)));

// value_hash = SHA-256(counter(4B BE) || value_bytes). The counter is committed here,
// on the value side — never in entry_key, so an entry keeps one stable path across
// version bumps. A witness reveals only this hash, hiding the plaintext value.
export const valueHash = (counter: number, value: Uint8Array): Uint8Array => {
    const counterBytes = new Uint8Array(4);
    new DataView(counterBytes.buffer).setUint32(0, counter, false);

    return sha256(concatBytes(counterBytes, value));
};

// leaf_hash = SHA-256(0x00 || entry_key || value_hash) — two-level, so a witness leaf
// can be rebuilt from two hashes without revealing the value/counter behind it.
export const leafHashOf = (ek: Uint8Array, vh: Uint8Array): Uint8Array =>
    sha256(concatBytes(ZERO, ek, vh));

export const computeLeafHash = (
    appId: string,
    address: string,
    networkSymbol: string,
    entry: WardEntry,
): Uint8Array =>
    leafHashOf(
        entryKey(appId, address),
        valueHash(entry.counter, entryToValueBytes(networkSymbol, entry)),
    );

// ---------------------------------------------------------------------------
// Keyed / encrypted-leaf model (ward-design.md §2.1/§2.2) — the device is the
// encryptor and the sole holder of K_index/K_data. The host therefore CANNOT
// compute entry_key or the leaf from plaintext; it stores the device's opaque leaf
// blob (nonce, tag, ct) keyed by the device-supplied entry_key and builds proofs
// BY that entry_key. Must stay byte-for-byte identical to trezorlib ward_crypto /
// firmware apps.ward.service.
// ---------------------------------------------------------------------------

const len32 = (n: number): Uint8Array => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, false);

    return b;
};

// commit = SHA-256(0x02 || nonce || tag || len32(ct) || ct)  (keyless, §2.2)
export const commitOf = (nonce: Uint8Array, tag: Uint8Array, ct: Uint8Array): Uint8Array =>
    sha256(concatBytes(new Uint8Array([0x02]), nonce, tag, len32(ct.length), ct));

// leaf = SHA-256(0x00 || entry_key || commit)  (§2.2)
export const leafFromCommit = (ek: Uint8Array, commit: Uint8Array): Uint8Array =>
    sha256(concatBytes(ZERO, ek, commit));

/** A stored leaf blob the device produced (all hex), keyed by its entry_key.
 * `entryType` is carried for the membership ack (K_data selector) but is not part
 * of proof hashing. */
export type BlobRow = {
    entryKeyHex: string;
    nonceHex: string;
    tagHex: string;
    ctHex: string;
    entryType?: string;
};

const blobLeaf = (r: BlobRow): LeafInfo => {
    const ek = hexToBytes(r.entryKeyHex);

    return {
        addrHash: ek,
        leafHash: leafFromCommit(
            ek,
            commitOf(hexToBytes(r.nonceHex), hexToBytes(r.tagHex), hexToBytes(r.ctHex)),
        ),
    };
};

// internal_hash(left, right) = SHA-256(b"\x01" + left + right)  — positional, no sorting
const internalHash = (left: Uint8Array, right: Uint8Array): Uint8Array =>
    sha256(concatBytes(new Uint8Array([0x01]), left, right));

// Return the bit at position `bit` of `addrHash`, MSB first.
// bit 0 = MSB of byte 0; bit 7 = LSB of byte 0; bit 8 = MSB of byte 1; …
const getBit = (addrHash: Uint8Array, bit: number): 0 | 1 =>
    (((addrHash[Math.floor(bit / 8)] ?? 0) >> (7 - (bit % 8))) & 1) as 0 | 1;

// ---------------------------------------------------------------------------
// MPT (Merkle Patricia Trie) — path-compressed positional trie
//
// Nodes:
//   Leaf  — a single entry; its hash is just the leaf hash.
//   Branch — splits on bit `bit`; hash = SHA-256(0x01 || hash(left) || hash(right)).
//
// There are no extension nodes because the verifier only needs siblings at
// branch points; skipped bits contribute nothing to the hash.
//
// Proof format (leaf→root order):
//   proof[i] = <2 hex chars: bit position 0-255> + <64 hex chars: sibling subtree hash>
//            = 66 hex chars total per element
//
// This is O(log N) elements for N entries, far below the firmware's buffer limit.
// ---------------------------------------------------------------------------

type LeafInfo = { addrHash: Uint8Array; leafHash: Uint8Array };

type LeafNode = { kind: 'leaf'; addrHash: Uint8Array; leafHash: Uint8Array };
type BranchNode = { kind: 'branch'; bit: number; left: MptNode; right: MptNode };
type MptNode = LeafNode | BranchNode;

// Graft-based INSERT matching firmware's insert_leaf algorithm.
// When reaching a leaf, create a branch at the first bit where new and existing diverge.
// This may produce branches with non-monotonically increasing bit positions, matching firmware.
const graftInsert = (tree: MptNode | null, addrHash: Uint8Array, leafHash: Uint8Array): MptNode => {
    if (tree === null) {
        return { kind: 'leaf', addrHash, leafHash };
    }
    if (tree.kind === 'leaf') {
        let bit = 0;
        while (bit < 256 && getBit(tree.addrHash, bit) === getBit(addrHash, bit)) bit++;
        const newLeaf: MptNode = { kind: 'leaf', addrHash, leafHash };

        return getBit(addrHash, bit) === 0
            ? { kind: 'branch', bit, left: newLeaf, right: tree }
            : { kind: 'branch', bit, left: tree, right: newLeaf };
    }
    const b = getBit(addrHash, tree.bit);

    return b === 0
        ? { ...tree, left: graftInsert(tree.left, addrHash, leafHash) }
        : { ...tree, right: graftInsert(tree.right, addrHash, leafHash) };
};

// Build MPT by replaying inserts in rowid order (matching firmware's sequential graft INSERTs).
// rows must already be sorted by rowid (insertion order).
const buildMpt = (leaves: LeafInfo[]): MptNode => {
    let tree: MptNode | null = null;
    for (const leaf of leaves) {
        tree = graftInsert(tree, leaf.addrHash, leaf.leafHash);
    }
    if (tree === null) throw new Error('MPT: no leaves');

    return tree;
};

// Hash a subtree recursively.
const hashMpt = (node: MptNode): Uint8Array => {
    if (node.kind === 'leaf') return node.leafHash;

    return internalHash(hashMpt(node.left), hashMpt(node.right));
};

// addrHash holds the 32-byte entry_key (the trie path), keyed per row by its own
// (appId, address) — the trie is a single combined structure across domains.
const rowsToLeaves = (rows: WardRow[]): LeafInfo[] =>
    rows.map(r => ({
        addrHash: entryKey(r.appId, r.address),
        leafHash: computeLeafHash(r.appId, r.address, r.networkSymbol, r.entry),
    }));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a Merkle proof for the given address entry (MPT, path-compressed).
 * proof[0] = sibling nearest the leaf; proof[last] = sibling nearest the root.
 * Each element is 66 hex chars: 2-char bit-position + 64-char sibling hash.
 * Matches ward_tree.py get_proof / firmware verifier evaluate_proof.
 */
export const generateMerkleProof = (
    rows: WardRow[],
    appId: string,
    address: string,
    networkSymbol: string,
): MerkleProof => {
    const target = rows.find(
        r => r.appId === appId && r.address === address && r.networkSymbol === networkSymbol,
    );
    if (!target) return [];

    const leaves = rowsToLeaves(rows);
    const targetAddrHash = entryKey(appId, address);
    const mptRoot = buildMpt(leaves);

    const proof: string[] = [];

    // Walk the MPT toward the target leaf, collecting siblings at each branch.
    // Proof elements are pushed as we unwind (leaf-to-root order).
    const walk = (node: MptNode): Uint8Array => {
        if (node.kind === 'leaf') return node.leafHash;

        const targetBit = getBit(targetAddrHash, node.bit);
        const bitHex = node.bit.toString(16).padStart(2, '0');

        if (targetBit === 0) {
            const leftHash = walk(node.left);
            const rightHash = hashMpt(node.right);
            proof.push(bitHex + bytesToHex(rightHash));

            return internalHash(leftHash, rightHash);
        } else {
            const leftHash = hashMpt(node.left);
            const rightHash = walk(node.right);
            proof.push(bitHex + bytesToHex(leftHash));

            return internalHash(leftHash, rightHash);
        }
    };

    walk(mptRoot);

    return proof;
};

/**
 * Recompute the MPT root hash from all stored entries.
 * Returns an empty string when there are no entries.
 */
export const computeMerkleRoot = (rows: WardRow[]): string => {
    if (rows.length === 0) return '';

    return bytesToHex(hashMpt(buildMpt(rowsToLeaves(rows))));
};

/**
 * Generate a non-membership proof for the given (appId, address).
 * Returns the proof (same format as membership proof, but for the witness leaf),
 * plus the witness as two hashes — witnessEntryKey and witnessValueHash — so the
 * neighbour's plaintext identifier and value are never revealed to the querying app.
 * Returns empty witness hashes if the tree is empty (address trivially not in tree).
 */
export const generateNonMembershipProof = (
    rows: WardRow[],
    appId: string,
    address: string,
    _networkSymbol: string,
): {
    proof: MerkleProof;
    witnessEntryKey: string | null;
    witnessValueHash: string | null;
} => {
    if (rows.length === 0) {
        return { proof: [], witnessEntryKey: null, witnessValueHash: null };
    }

    const targetAddrHash = entryKey(appId, address);
    const leaves = rowsToLeaves(rows);
    const mptRoot = buildMpt(leaves);

    // Walk the MPT following the target entry_key path, collecting siblings.
    // The leaf we land on is the witness.
    let witnessLeaf: LeafInfo | null = null;
    const proof: string[] = [];

    const walk = (node: MptNode): Uint8Array => {
        if (node.kind === 'leaf') {
            witnessLeaf = node;

            return node.leafHash;
        }

        const targetBit = getBit(targetAddrHash, node.bit);
        const bitHex = node.bit.toString(16).padStart(2, '0');

        if (targetBit === 0) {
            const leftHash = walk(node.left);
            const rightHash = hashMpt(node.right);
            proof.push(bitHex + bytesToHex(rightHash));

            return internalHash(leftHash, rightHash);
        } else {
            const leftHash = hashMpt(node.left);
            const rightHash = walk(node.right);
            proof.push(bitHex + bytesToHex(leftHash));

            return internalHash(leftHash, rightHash);
        }
    };

    walk(mptRoot);

    if (!witnessLeaf) {
        return { proof: [], witnessEntryKey: null, witnessValueHash: null };
    }

    const wl: LeafInfo = witnessLeaf;
    const wr = rows.find(r => bytesToHex(entryKey(r.appId, r.address)) === bytesToHex(wl.addrHash));
    if (!wr) {
        return { proof: [], witnessEntryKey: null, witnessValueHash: null };
    }

    // The witness travels as two hashes only: its entry_key (== wl.addrHash, the path)
    // and value_hash. Neither reveals wr's plaintext identifier or value.
    return {
        proof,
        witnessEntryKey: bytesToHex(wl.addrHash),
        witnessValueHash: bytesToHex(
            valueHash(wr.entry.counter, entryToValueBytes(wr.networkSymbol, wr.entry)),
        ),
    };
};

/**
 * Verify a proof locally (mirrors firmware evaluate_proof in lookup.py).
 * proof[0] = sibling nearest leaf; proof[last] = sibling nearest root.
 * Each element is 66 hex chars: 2-char bit-position + 64-char sibling hash.
 */
export const evaluateProof = (
    appId: string,
    address: string,
    networkSymbol: string,
    entry: WardEntry,
    proof: MerkleProof,
): string => {
    const addrHash = entryKey(appId, address);
    let current = computeLeafHash(appId, address, networkSymbol, entry);

    for (const elem of proof) {
        const bit = parseInt(elem.slice(0, 2), 16);
        const sibling = hexToBytes(elem.slice(2));
        const targetBit = getBit(addrHash, bit);
        current = targetBit === 0 ? internalHash(current, sibling) : internalHash(sibling, current);
    }

    return bytesToHex(current);
};

// ---------------------------------------------------------------------------
// By-entry_key proof API (keyed/encrypted-leaf model). Serves proofs purely from
// the device-supplied entry_key + stored leaf blobs — no plaintext, no keys.
// Mirrors trezorlib WARDTree get_proof_by_key / get_nonmembership_proof_by_key.
// ---------------------------------------------------------------------------

/** Recompute the root over stored leaf blobs. '' when empty. */
export const computeRootFromBlobs = (rows: BlobRow[]): string =>
    rows.length === 0 ? '' : bytesToHex(hashMpt(buildMpt(rows.map(blobLeaf))));

/** Membership proof for `entryKeyHex` over stored blobs (leaf→root order). */
export const proofByKey = (rows: BlobRow[], entryKeyHex: string): MerkleProof => {
    if (rows.length === 0) return [];
    const target = hexToBytes(entryKeyHex);
    const root = buildMpt(rows.map(blobLeaf));
    const proof: string[] = [];
    const walk = (node: MptNode): Uint8Array => {
        if (node.kind === 'leaf') return node.leafHash;
        const bitHex = node.bit.toString(16).padStart(2, '0');
        if (getBit(target, node.bit) === 0) {
            const l = walk(node.left);
            const r = hashMpt(node.right);
            proof.push(bitHex + bytesToHex(r));

            return internalHash(l, r);
        }
        const l = hashMpt(node.left);
        const r = walk(node.right);
        proof.push(bitHex + bytesToHex(l));

        return internalHash(l, r);
    };
    walk(root);

    return proof;
};

/** Non-membership proof for `entryKeyHex`: the witness leaf on its path, as two
 * hashes (witnessEntryKey, witnessCommit). Empty witnesses when the tree is empty. */
export const nonMembershipByKey = (
    rows: BlobRow[],
    entryKeyHex: string,
): { proof: MerkleProof; witnessEntryKeyHex: string | null; witnessCommitHex: string | null } => {
    if (rows.length === 0) {
        return { proof: [], witnessEntryKeyHex: null, witnessCommitHex: null };
    }
    const target = hexToBytes(entryKeyHex);
    const root = buildMpt(rows.map(blobLeaf));
    let witness: LeafInfo | null = null;
    const proof: string[] = [];
    const walk = (node: MptNode): Uint8Array => {
        if (node.kind === 'leaf') {
            witness = node;

            return node.leafHash;
        }
        const bitHex = node.bit.toString(16).padStart(2, '0');
        if (getBit(target, node.bit) === 0) {
            const l = walk(node.left);
            const r = hashMpt(node.right);
            proof.push(bitHex + bytesToHex(r));

            return internalHash(l, r);
        }
        const l = hashMpt(node.left);
        const r = walk(node.right);
        proof.push(bitHex + bytesToHex(l));

        return internalHash(l, r);
    };
    walk(root);
    if (!witness) return { proof: [], witnessEntryKeyHex: null, witnessCommitHex: null };
    const wek = bytesToHex((witness as LeafInfo).addrHash);
    const wr = rows.find(r => r.entryKeyHex === wek);
    if (!wr) return { proof: [], witnessEntryKeyHex: null, witnessCommitHex: null };

    return {
        proof,
        witnessEntryKeyHex: wek,
        witnessCommitHex: bytesToHex(
            commitOf(hexToBytes(wr.nonceHex), hexToBytes(wr.tagHex), hexToBytes(wr.ctHex)),
        ),
    };
};
