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

// Leaf-content mode (dev switch) — MUST mirror core service.py WARD_PLAINTEXT_LEAVES
// and trezorlib ward_crypto.WARD_PLAINTEXT_LEAVES for host-computed roots/proofs to
// match the device. A mutable holder (not a bare `const`) so tests can flip it. The
// whole system picks one mode; a mismatch fails cleanly (roots won't match).
export const wardLeafMode = { plaintext: false };

// commit = SHA-256(domain || nonce || tag || len32(ct) || ct)  (keyless, §2.2).
// Domain-separated by mode: encrypted 0x02 (nonce/tag/ct are the AEAD blob); plaintext
// 0x04 (nonce/tag empty, ct == the packed content) so the two can never collide.
export const commitOf = (nonce: Uint8Array, tag: Uint8Array, ct: Uint8Array): Uint8Array =>
    sha256(
        concatBytes(
            new Uint8Array([wardLeafMode.plaintext ? 0x04 : 0x02]),
            nonce,
            tag,
            len32(ct.length),
            ct,
        ),
    );

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

// Path-compressed internal hash (anti-malleability) — mirrors authdb_tree._internal_hash /
// firmware service.internal_hash:
//   SHA-256(0x01 || u16be(split_bit) || u16be(skiplen) || left || right)
// Binding split_bit + skiplen into every branch is what closes the non-membership malleability
// (siblings can no longer be re-slotted at a different depth).
const u16be = (n: number): Uint8Array => {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, false);

    return b;
};

const internalHash = (
    splitBit: number,
    skiplen: number,
    left: Uint8Array,
    right: Uint8Array,
): Uint8Array =>
    sha256(concatBytes(new Uint8Array([0x01]), u16be(splitBit), u16be(skiplen), left, right));

// Proof element = u16be(split_bit) || u16be(skiplen) || sibling(32) = 36 bytes (72 hex chars).
const proofElem = (splitBit: number, skiplen: number, sibling: Uint8Array): string =>
    bytesToHex(u16be(splitBit)) + bytesToHex(u16be(skiplen)) + bytesToHex(sibling);

const parseProofElem = (
    elemHex: string,
): { splitBit: number; skiplen: number; sibling: Uint8Array } => {
    const elem = hexToBytes(elemHex);
    if (elem.length !== 36) throw new Error('invalid proof element length');
    const dv = new DataView(elem.buffer, elem.byteOffset, elem.byteLength);

    return {
        splitBit: dv.getUint16(0, false),
        skiplen: dv.getUint16(2, false),
        sibling: elem.slice(4),
    };
};

// Validate a proof shape root→leaf: split_bit strictly increasing and skiplen == split_bit − start_bit
// (mirrors authdb_tree._proof_steps_root_to_leaf). null on a malformed / malleable proof.
const proofStepsRootToLeaf = (
    proof: MerkleProof,
): Array<{ splitBit: number; skiplen: number; sibling: Uint8Array }> | null => {
    const steps: Array<{ splitBit: number; skiplen: number; sibling: Uint8Array }> = [];
    let startBit = 0;
    try {
        for (let i = proof.length - 1; i >= 0; i--) {
            const { splitBit, skiplen, sibling } = parseProofElem(proof[i]!);
            if (splitBit >= 256) return null;
            if (splitBit < startBit || skiplen !== splitBit - startBit) return null;
            steps.push({ splitBit, skiplen, sibling });
            startBit = splitBit + 1;
        }
    } catch {
        return null;
    }

    return steps;
};

// Return the bit at position `bit` of `addrHash`, MSB first.
// bit 0 = MSB of byte 0; bit 7 = LSB of byte 0; bit 8 = MSB of byte 1; …
const getBit = (addrHash: Uint8Array, bit: number): 0 | 1 =>
    (((addrHash[Math.floor(bit / 8)] ?? 0) >> (7 - (bit % 8))) & 1) as 0 | 1;

// ---------------------------------------------------------------------------
// MPT (Merkle Patricia Trie) — path-compressed positional trie
//
// Nodes:
//   Leaf   — a single entry; its hash is the leaf hash.
//   Branch — splits on bit `bit`; skiplen = bit − parent's start bit; hash binds both
//            (see internalHash) so the tree is canonical and non-membership proofs are
//            non-malleable.
//
// Proof format (leaf→root order): each element = u16be(split_bit) || u16be(skiplen) ||
// 32-byte sibling = 36 bytes (72 hex chars). O(log N) elements. Mirrors trezorlib
// authdb_tree.py and firmware service.py byte-for-byte.
// ---------------------------------------------------------------------------

type LeafInfo = { addrHash: Uint8Array; leafHash: Uint8Array };

type LeafNode = { kind: 'leaf'; addrHash: Uint8Array; leafHash: Uint8Array };
type BranchNode = { kind: 'branch'; bit: number; skiplen: number; left: MptNode; right: MptNode };
type MptNode = LeafNode | BranchNode;

// First bit (from startBit) where the leaves diverge — mirrors authdb_tree._find_split_bit.
const findSplitBit = (leaves: LeafInfo[], startBit: number): number => {
    for (let bit = startBit; bit < 256; bit++) {
        const b0 = getBit(leaves[0]!.addrHash, bit);
        if (leaves.some((l, i) => i > 0 && getBit(l.addrHash, bit) !== b0)) return bit;
    }
    throw new Error('MPT: duplicate entry_key (HMAC-SHA256 collision)');
};

// Batch, order-independent path-compressed build — mirrors authdb_tree._build_mpt. Split at the
// first diverging bit, skiplen = split_bit − start_bit, recurse from split_bit + 1. Canonical:
// the shape depends only on the entry_key set, not insertion order.
const buildMpt = (leaves: LeafInfo[], startBit = 0): MptNode => {
    if (leaves.length === 0) throw new Error('MPT: no leaves');
    if (leaves.length === 1) return { kind: 'leaf', ...leaves[0]! };
    const bit = findSplitBit(leaves, startBit);
    const left = leaves.filter(l => getBit(l.addrHash, bit) === 0);
    const right = leaves.filter(l => getBit(l.addrHash, bit) === 1);

    return {
        kind: 'branch',
        bit,
        skiplen: bit - startBit,
        left: buildMpt(left, bit + 1),
        right: buildMpt(right, bit + 1),
    };
};

const hashMpt = (node: MptNode): Uint8Array =>
    node.kind === 'leaf'
        ? node.leafHash
        : internalHash(node.bit, node.skiplen, hashMpt(node.left), hashMpt(node.right));

// Shared membership-proof walk (leaf→root order) — mirrors authdb_tree._walk_proof. Emits the
// sibling elements toward `targetKey`; `onLeaf` captures the leaf reached (the witness, for the
// non-membership callers).
const walkProof = (
    root: MptNode,
    targetKey: Uint8Array,
    onLeaf?: (n: LeafNode) => void,
): MerkleProof => {
    const proof: string[] = [];
    const walk = (node: MptNode): Uint8Array => {
        if (node.kind === 'leaf') {
            onLeaf?.(node);

            return node.leafHash;
        }
        if (getBit(targetKey, node.bit) === 0) {
            const l = walk(node.left);
            const r = hashMpt(node.right);
            proof.push(proofElem(node.bit, node.skiplen, r));

            return internalHash(node.bit, node.skiplen, l, r);
        }
        const l = hashMpt(node.left);
        const r = walk(node.right);
        proof.push(proofElem(node.bit, node.skiplen, l));

        return internalHash(node.bit, node.skiplen, l, r);
    };
    walk(root);

    return proof;
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

    return walkProof(buildMpt(rowsToLeaves(rows)), entryKey(appId, address));
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

    // Walk the target entry_key path; the leaf reached is the witness.
    let witnessLeaf: LeafNode | null = null;
    const proof = walkProof(buildMpt(rowsToLeaves(rows)), entryKey(appId, address), n => {
        witnessLeaf = n;
    });
    if (!witnessLeaf) {
        return { proof: [], witnessEntryKey: null, witnessValueHash: null };
    }

    const wl = witnessLeaf as LeafNode;
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
 * Verify a membership proof locally and return the reconstructed root (mirrors firmware
 * evaluate_proof / trezorlib verify_proof_by_key). proof[0] = sibling nearest the leaf;
 * proof[last] = sibling nearest the root. Each element is 72 hex chars:
 * u16be(split_bit) + u16be(skiplen) + 32-byte sibling. Throws on a malformed / malleable
 * proof (split_bit not increasing, or skiplen ≠ split_bit − start_bit).
 */
export const evaluateProof = (
    appId: string,
    address: string,
    networkSymbol: string,
    entry: WardEntry,
    proof: MerkleProof,
): string => {
    if (proofStepsRootToLeaf(proof) === null) {
        throw new Error('invalid proof (malformed or malleable proof element)');
    }
    const addrHash = entryKey(appId, address);
    let current = computeLeafHash(appId, address, networkSymbol, entry);

    for (const elem of proof) {
        const { splitBit, skiplen, sibling } = parseProofElem(elem);
        current =
            getBit(addrHash, splitBit) === 0
                ? internalHash(splitBit, skiplen, current, sibling)
                : internalHash(splitBit, skiplen, sibling, current);
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
export const proofByKey = (rows: BlobRow[], entryKeyHex: string): MerkleProof =>
    rows.length === 0 ? [] : walkProof(buildMpt(rows.map(blobLeaf)), hexToBytes(entryKeyHex));

/** Non-membership proof for `entryKeyHex`: the witness leaf on its path, as two
 * hashes (witnessEntryKey, witnessCommit). Empty witnesses when the tree is empty. */
export const nonMembershipByKey = (
    rows: BlobRow[],
    entryKeyHex: string,
): { proof: MerkleProof; witnessEntryKeyHex: string | null; witnessCommitHex: string | null } => {
    if (rows.length === 0) {
        return { proof: [], witnessEntryKeyHex: null, witnessCommitHex: null };
    }
    let witness: LeafNode | null = null;
    const proof = walkProof(buildMpt(rows.map(blobLeaf)), hexToBytes(entryKeyHex), n => {
        witness = n;
    });
    if (!witness) return { proof: [], witnessEntryKeyHex: null, witnessCommitHex: null };
    const wek = bytesToHex((witness as LeafNode).addrHash);
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
