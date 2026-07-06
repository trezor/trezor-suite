import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import type { AuthLabelEntry, AuthLabelRow, MerkleProof } from './provider';

// ---------------------------------------------------------------------------
// MPT hashing primitives — must match authdb_tree.py exactly
// ---------------------------------------------------------------------------

const utf8 = (s: string) => new TextEncoder().encode(s);

// Deterministic value encoding (networkSymbol + counter + sorted metadata).
export const entryToValueBytes = (networkSymbol: string, entry: AuthLabelEntry): Uint8Array => {
    const metaSorted = Object.fromEntries(
        Object.entries(entry.metadata).sort(([a], [b]) => a.localeCompare(b)),
    );
    const encoded = `${networkSymbol}:${entry.counter}:${JSON.stringify(metaSorted)}`;

    return utf8(encoded);
};

// Inverse of entryToValueBytes — decodes a hex-encoded value (e.g. an offline-queue
// entry's new_value) back into its networkSymbol and AuthLabelEntry. Splits on only the
// first two colons since the trailing JSON metadata may itself contain colons.
export const valueHexToEntry = (
    valueHex: string,
): { networkSymbol: string; entry: AuthLabelEntry } => {
    const decoded = new TextDecoder().decode(hexToBytes(valueHex));
    const firstColon = decoded.indexOf(':');
    const secondColon = decoded.indexOf(':', firstColon + 1);

    const networkSymbol = decoded.slice(0, firstColon);
    const counter = Number(decoded.slice(firstColon + 1, secondColon));
    const metadata = JSON.parse(decoded.slice(secondColon + 1));

    return { networkSymbol, entry: { metadata, counter } };
};

// leaf_hash = SHA-256(b"\x00" + address_bytes + counter(4B BE) + value_bytes)
// counter is a first-class, cryptographically-committed per-address version number
// (docs/authdb-sync-proposal.md Part 1) -- not just text embedded in the value blob.
export const computeLeafHash = (
    address: string,
    networkSymbol: string,
    entry: AuthLabelEntry,
): Uint8Array => {
    const addrBytes = utf8(address);
    const valBytes = entryToValueBytes(networkSymbol, entry);
    const counterBytes = new Uint8Array(4);
    new DataView(counterBytes.buffer).setUint32(0, entry.counter, false);

    return sha256(concatBytes(new Uint8Array([0x00]), addrBytes, counterBytes, valBytes));
};

// internal_hash(left, right) = SHA-256(b"\x01" + left + right)  — positional, no sorting
const internalHash = (left: Uint8Array, right: Uint8Array): Uint8Array =>
    sha256(concatBytes(new Uint8Array([0x01]), left, right));

const addressHash = (address: string): Uint8Array => sha256(utf8(address));

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

const rowsToLeaves = (rows: AuthLabelRow[]): LeafInfo[] =>
    rows.map(r => ({
        addrHash: addressHash(r.address),
        leafHash: computeLeafHash(r.address, r.networkSymbol, r.entry),
    }));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a Merkle proof for the given address entry (MPT, path-compressed).
 * proof[0] = sibling nearest the leaf; proof[last] = sibling nearest the root.
 * Each element is 66 hex chars: 2-char bit-position + 64-char sibling hash.
 * Matches authdb_tree.py get_proof / firmware verifier evaluate_proof.
 */
export const generateMerkleProof = (
    rows: AuthLabelRow[],
    address: string,
    networkSymbol: string,
): MerkleProof => {
    const target = rows.find(r => r.address === address && r.networkSymbol === networkSymbol);
    if (!target) return [];

    const leaves = rowsToLeaves(rows);
    const targetAddrHash = addressHash(address);
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
export const computeMerkleRoot = (rows: AuthLabelRow[]): string => {
    if (rows.length === 0) return '';

    return bytesToHex(hashMpt(buildMpt(rowsToLeaves(rows))));
};

/**
 * Generate a non-membership proof for the given address.
 * Returns the proof (same format as membership proof, but for the witness leaf),
 * plus the witness address and witness value bytes.
 * Returns null if the tree is empty (address trivially not in tree).
 */
export const generateNonMembershipProof = (
    rows: AuthLabelRow[],
    address: string,
    _networkSymbol: string,
): {
    proof: MerkleProof;
    witnessAddress: string | null;
    witnessValue: Uint8Array | null;
    witnessCounter: number | null;
} => {
    if (rows.length === 0) {
        return { proof: [], witnessAddress: null, witnessValue: null, witnessCounter: null };
    }

    const targetAddrHash = addressHash(address);
    const leaves = rowsToLeaves(rows);
    const mptRoot = buildMpt(leaves);

    // Walk the MPT following the target address path, collecting siblings.
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
        return { proof: [], witnessAddress: null, witnessValue: null, witnessCounter: null };
    }

    const wl: LeafInfo = witnessLeaf;
    const wr = rows.find(r => bytesToHex(addressHash(r.address)) === bytesToHex(wl.addrHash));
    if (!wr) {
        return { proof: [], witnessAddress: null, witnessValue: null, witnessCounter: null };
    }

    return {
        proof,
        witnessAddress: wr.address,
        witnessValue: entryToValueBytes(wr.networkSymbol, wr.entry),
        witnessCounter: wr.entry.counter,
    };
};

/**
 * Verify a proof locally (mirrors firmware evaluate_proof in lookup.py).
 * proof[0] = sibling nearest leaf; proof[last] = sibling nearest root.
 * Each element is 66 hex chars: 2-char bit-position + 64-char sibling hash.
 */
export const evaluateProof = (
    address: string,
    networkSymbol: string,
    entry: AuthLabelEntry,
    proof: MerkleProof,
): string => {
    const addrHash = addressHash(address);
    let current = computeLeafHash(address, networkSymbol, entry);

    for (const elem of proof) {
        const bit = parseInt(elem.slice(0, 2), 16);
        const sibling = hexToBytes(elem.slice(2));
        const targetBit = getBit(addrHash, bit);
        current = targetBit === 0 ? internalHash(current, sibling) : internalHash(sibling, current);
    }

    return bytesToHex(current);
};
