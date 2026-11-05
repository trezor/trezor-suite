import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import type { MerkleProof, WardEntry } from '../types';

// ---------------------------------------------------------------------------
// MPT hashing primitives — must match ward_tree.py exactly
// ---------------------------------------------------------------------------

const utf8 = (s: string) => new TextEncoder().encode(s);

// Deterministic value encoding (networkSymbol + sorted metadata).
//
// Strict counter model: the counter is NOT part of the value bytes. It lives as C_leaf
// inside the sealed LeafContent, which the device stamps at commit time. Baking it into
// the value would let the host inject a guessed counter into WARDQueueUpdate.new_value
// before the device derives the real one.
export const entryToValueBytes = (networkSymbol: string, entry: WardEntry): Uint8Array => {
    const metaSorted = Object.fromEntries(
        Object.entries(entry.metadata).sort(([a], [b]) => a.localeCompare(b)),
    );
    const encoded = `${networkSymbol}:${JSON.stringify(metaSorted)}`;

    return utf8(encoded);
};

const ZERO = new Uint8Array([0x00]);

/** Part encodings — the byte that goes into the commit. */
export const ENC_ENCRYPTED = 0;
export const ENC_PLAINTEXT = 1;

/** One encoded leaf part (all hex). `bodyHex` is the ciphertext when encoding is
 * ENC_ENCRYPTED, the packed plaintext when ENC_PLAINTEXT; nonce/tag are empty for
 * plaintext. */
export type LeafPart = {
    encoding: number;
    nonceHex: string;
    tagHex: string;
    bodyHex: string;
};

export const EMPTY_PART: LeafPart = {
    encoding: ENC_PLAINTEXT,
    nonceHex: '',
    tagHex: '',
    bodyHex: '',
};

const len8 = (n: number) => new Uint8Array([n & 0xff]);

// 4-byte big-endian length prefix.
const len32 = (n: number) => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, false);

    return b;
};

// part(p) = encoding(1B) || len8(nonce) || nonce || len8(tag) || tag || len32(body) || body
const partBytes = (p: LeafPart | undefined): Uint8Array => {
    const q = p ?? EMPTY_PART;
    const nonce = hexToBytes(q.nonceHex);
    const tag = hexToBytes(q.tagHex);
    const body = hexToBytes(q.bodyHex);

    return concatBytes(
        new Uint8Array([q.encoding]),
        len8(nonce.length),
        nonce,
        len8(tag.length),
        tag,
        len32(body.length),
        body,
    );
};

// commit = SHA-256(0x02 || len8(key_type) || key_type
//                       || len32(id_part) || id_part || len32(val_part) || val_part)
// Keyless (§2.2): a host holding no keys recomputes it from stored bytes whatever each
// part's encoding is. Each part's encoding byte is inside the commit, so an encrypted
// and a plaintext part can never collide. An empty content body is a delete.
export const commitOf = (keyType: string, identity: LeafPart, content: LeafPart): Uint8Array => {
    const kt = utf8(keyType);
    const idPart = partBytes(identity);
    const valPart = partBytes(content);

    return sha256(
        concatBytes(
            new Uint8Array([0x02]),
            len8(kt.length),
            kt,
            len32(idPart.length),
            idPart,
            len32(valPart.length),
            valPart,
        ),
    );
};

// leaf = SHA-256(0x00 || entry_key || commit)  (§2.2). entry_key == LeafIdentityMAC.
export const leafFromCommit = (ek: Uint8Array, commit: Uint8Array): Uint8Array =>
    sha256(concatBytes(ZERO, ek, commit));

/** A stored leaf the device produced, keyed by its entry_key (LeafIdentityMAC).
 * `keyType` is always clear — it selects both K_ident and K_data. Serving a proof
 * needs no key: the MAC is the stored key and the commit is over ciphertext. */
export type BlobRow = {
    entryKeyHex: string;
    keyType: string;
    identity: LeafPart;
    content: LeafPart;
};

const blobLeaf = (r: BlobRow): LeafInfo => {
    const ek = hexToBytes(r.entryKeyHex);

    return {
        addrHash: ek,
        leafHash: leafFromCommit(ek, commitOf(r.keyType, r.identity, r.content)),
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
        witnessCommitHex: bytesToHex(commitOf(wr.keyType, wr.identity, wr.content)),
    };
};
