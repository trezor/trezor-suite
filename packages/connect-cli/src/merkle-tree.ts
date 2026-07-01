import { createHash } from 'crypto';

import type { AddressEntry, AllEntriesRow, MerkleProof } from '@trezor/connect';

// ---------------------------------------------------------------------------
// MPT hashing primitives — must match authdb_tree.py exactly
// ---------------------------------------------------------------------------

// leaf_hash = SHA-256(b"\x00" + address_bytes + value_bytes)
export const computeLeafHash = (
    address: string,
    networkSymbol: string,
    entry: AddressEntry,
): Buffer => {
    const addrBytes = Buffer.from(address, 'utf8');
    const valBytes = entryToValueBytes(networkSymbol, entry);

    return createHash('sha256')
        .update(Buffer.from([0x00]))
        .update(addrBytes)
        .update(valBytes)
        .digest();
};

// Deterministic value encoding (networkSymbol + counter + sorted metadata).
export const entryToValueBytes = (networkSymbol: string, entry: AddressEntry): Buffer => {
    const metaSorted = Object.fromEntries(
        Object.entries(entry.metadata).sort(([a], [b]) => a.localeCompare(b)),
    );
    const encoded = `${networkSymbol}:${entry.counter}:${JSON.stringify(metaSorted)}`;

    return Buffer.from(encoded, 'utf8');
};

// internal_hash(left, right) = SHA-256(b"\x01" + left + right)  — positional, no sorting
const internalHash = (left: Buffer, right: Buffer): Buffer =>
    createHash('sha256')
        .update(Buffer.from([0x01]))
        .update(left)
        .update(right)
        .digest();

// Return the bit at position `bit` of `addrHash`, MSB first.
// bit 0 = MSB of byte 0; bit 7 = LSB of byte 0; bit 8 = MSB of byte 1; …
const getBit = (addrHash: Buffer, bit: number): 0 | 1 =>
    ((addrHash[Math.floor(bit / 8)] >> (7 - (bit % 8))) & 1) as 0 | 1;

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

type LeafInfo = { addrHash: Buffer; leafHash: Buffer };

type LeafNode = { kind: 'leaf'; addrHash: Buffer; leafHash: Buffer };
type BranchNode = { kind: 'branch'; bit: number; left: MptNode; right: MptNode };
type MptNode = LeafNode | BranchNode;

// Find the first bit position (>= startBit) where the set of leaves diverges.
const findSplitBit = (leaves: LeafInfo[], startBit: number): number => {
    for (let bit = startBit; bit < 256; bit++) {
        const b0 = getBit(leaves[0].addrHash, bit);
        if (leaves.some(l => getBit(l.addrHash, bit) !== b0)) return bit;
    }
    // Should never reach here if all addrHashes are distinct (SHA-256 collisions are impossible).
    throw new Error('MPT: duplicate address hashes detected');
};

// Build MPT from a non-empty set of leaves, starting path-compression from bit `startBit`.
const buildMpt = (leaves: LeafInfo[], startBit: number): MptNode => {
    if (leaves.length === 1) return { kind: 'leaf', ...leaves[0] };

    const bit = findSplitBit(leaves, startBit);
    const left = leaves.filter(l => getBit(l.addrHash, bit) === 0);
    const right = leaves.filter(l => getBit(l.addrHash, bit) === 1);

    return {
        kind: 'branch',
        bit,
        left: buildMpt(left, bit + 1),
        right: buildMpt(right, bit + 1),
    };
};

// Hash a subtree recursively.
const hashMpt = (node: MptNode): Buffer => {
    if (node.kind === 'leaf') return node.leafHash;

    return internalHash(hashMpt(node.left), hashMpt(node.right));
};

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
    rows: AllEntriesRow[],
    address: string,
    networkSymbol: string,
): MerkleProof => {
    const target = rows.find(r => r.address === address && r.networkSymbol === networkSymbol);
    if (!target) return [];

    const leaves: LeafInfo[] = rows.map(r => ({
        addrHash: createHash('sha256').update(Buffer.from(r.address, 'utf8')).digest(),
        leafHash: computeLeafHash(r.address, r.networkSymbol, r.entry),
    }));

    const targetAddrHash = createHash('sha256').update(Buffer.from(address, 'utf8')).digest();
    const mptRoot = buildMpt(leaves, 0);

    const proof: string[] = [];

    // Walk the MPT toward the target leaf, collecting siblings at each branch.
    // Proof elements are pushed as we unwind (leaf-to-root order).
    const walk = (node: MptNode): Buffer => {
        if (node.kind === 'leaf') return node.leafHash;

        const targetBit = getBit(targetAddrHash, node.bit);
        const bitHex = node.bit.toString(16).padStart(2, '0');

        if (targetBit === 0) {
            const leftHash = walk(node.left);
            const rightHash = hashMpt(node.right);
            proof.push(bitHex + rightHash.toString('hex'));

            return internalHash(leftHash, rightHash);
        } else {
            const leftHash = hashMpt(node.left);
            const rightHash = walk(node.right);
            proof.push(bitHex + leftHash.toString('hex'));

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
export const computeMerkleRoot = (rows: AllEntriesRow[]): string => {
    if (rows.length === 0) return '';

    const leaves: LeafInfo[] = rows.map(r => ({
        addrHash: createHash('sha256').update(Buffer.from(r.address, 'utf8')).digest(),
        leafHash: computeLeafHash(r.address, r.networkSymbol, r.entry),
    }));

    return hashMpt(buildMpt(leaves, 0)).toString('hex');
};

/**
 * Generate a non-membership proof for the given address.
 * Returns the proof (same format as membership proof, but for the witness leaf),
 * plus the witness address and witness value bytes.
 * Returns null if the tree is empty (address trivially not in tree).
 */
export const generateNonMembershipProof = (
    rows: AllEntriesRow[],
    address: string,
    networkSymbol: string,
): { proof: MerkleProof; witnessAddress: string | null; witnessValue: Buffer | null } => {
    if (rows.length === 0) {
        return { proof: [], witnessAddress: null, witnessValue: null };
    }

    const targetAddrHash = createHash('sha256').update(Buffer.from(address, 'utf8')).digest();

    const leaves: LeafInfo[] = rows.map(r => ({
        addrHash: createHash('sha256').update(Buffer.from(r.address, 'utf8')).digest(),
        leafHash: computeLeafHash(r.address, r.networkSymbol, r.entry),
    }));

    const mptRoot = buildMpt(leaves, 0);

    // Walk the MPT following the target address path, collecting siblings.
    // The leaf we land on is the witness.
    let witnessRow: AllEntriesRow | null = null;
    const proof: string[] = [];

    const walk = (node: MptNode, rowsSubset: AllEntriesRow[]): Buffer => {
        if (node.kind === 'leaf') {
            // This is the witness leaf
            witnessRow = rowsSubset[0];
            return node.leafHash;
        }

        const targetBit = getBit(targetAddrHash, node.bit);
        const bitHex = node.bit.toString(16).padStart(2, '0');

        const leftRows = rowsSubset.filter(r => {
            const h = createHash('sha256').update(Buffer.from(r.address, 'utf8')).digest();
            return getBit(h, node.bit) === 0;
        });
        const rightRows = rowsSubset.filter(r => {
            const h = createHash('sha256').update(Buffer.from(r.address, 'utf8')).digest();
            return getBit(h, node.bit) === 1;
        });

        if (targetBit === 0) {
            const leftHash = walk(node.left, leftRows);
            const rightHash = hashMpt(node.right);
            proof.push(bitHex + rightHash.toString('hex'));
            return internalHash(leftHash, rightHash);
        } else {
            const leftHash = hashMpt(node.left);
            const rightHash = walk(node.right, rightRows);
            proof.push(bitHex + leftHash.toString('hex'));
            return internalHash(leftHash, rightHash);
        }
    };

    walk(mptRoot, rows);

    if (!witnessRow) {
        return { proof: [], witnessAddress: null, witnessValue: null };
    }

    const wr = witnessRow as AllEntriesRow;
    return {
        proof,
        witnessAddress: wr.address,
        witnessValue: entryToValueBytes(wr.networkSymbol, wr.entry),
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
    entry: AddressEntry,
    proof: MerkleProof,
): string => {
    const addrHash = createHash('sha256').update(Buffer.from(address, 'utf8')).digest();
    let current = computeLeafHash(address, networkSymbol, entry);

    for (const elem of proof) {
        const bit = parseInt(elem.slice(0, 2), 16);
        const sibling = Buffer.from(elem.slice(2), 'hex');
        const targetBit = getBit(addrHash, bit);
        current = targetBit === 0 ? internalHash(current, sibling) : internalHash(sibling, current);
    }

    return current.toString('hex');
};
