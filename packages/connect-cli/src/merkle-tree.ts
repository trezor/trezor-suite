import { createHash } from 'crypto';

import type { AddressEntry, AllEntriesRow, MerkleProof } from '@trezor/connect';

// ---------------------------------------------------------------------------
// SMT hashing primitives — must match authdb_tree.py exactly
// ---------------------------------------------------------------------------

const EMPTY_HASH = createHash('sha256').update(Buffer.alloc(0)).digest();
const SMT_DEPTH = 256;

// Precompute empty subtree hashes bottom-up.
// empty[0] = SHA-256(b"")  (empty leaf)
// empty[d] = SHA-256(b"\x01" + empty[d-1] + empty[d-1])
const EMPTY: Buffer[] = [EMPTY_HASH];
for (let i = 1; i <= SMT_DEPTH; i++) {
    EMPTY.push(
        createHash('sha256')
            .update(Buffer.from([0x01]))
            .update(EMPTY[i - 1])
            .update(EMPTY[i - 1])
            .digest(),
    );
}

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
const entryToValueBytes = (networkSymbol: string, entry: AddressEntry): Buffer => {
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

// Return the bit at position `level` of `addrHash`, MSB first.
// level 0 = MSB of byte 0; level 7 = LSB of byte 0; level 8 = MSB of byte 1; …
const getBit = (addrHash: Buffer, level: number): 0 | 1 =>
    ((addrHash[Math.floor(level / 8)] >> (7 - (level % 8))) & 1) as 0 | 1;

// ---------------------------------------------------------------------------
// SMT construction helpers
// ---------------------------------------------------------------------------

type LeafInfo = { addrHash: Buffer; leafHash: Buffer };

// Build the SMT root hash from a list of leaves.
// Uses a recursive divide-and-conquer over the bit-prefix tree.
const buildRoot = (leaves: LeafInfo[], depth: number): Buffer => {
    if (leaves.length === 0) return EMPTY[SMT_DEPTH - depth];
    if (leaves.length === 1) {
        // Propagate single leaf up through the remaining levels.
        let h = leaves[0].leafHash;
        for (let d = depth; d < SMT_DEPTH; d++) {
            // We've consumed `depth` bits so far; at each remaining level pair with empty.
            const bit = getBit(leaves[0].addrHash, SMT_DEPTH - 1 - d);
            h = bit === 0 ? internalHash(h, EMPTY[0]) : internalHash(EMPTY[0], h);
        }

        return h;
    }

    // Split on current bit (MSB of remaining path).
    const bit = SMT_DEPTH - 1 - depth;
    const left = leaves.filter(l => getBit(l.addrHash, bit) === 0);
    const right = leaves.filter(l => getBit(l.addrHash, bit) === 1);

    return internalHash(buildRoot(left, depth + 1), buildRoot(right, depth + 1));
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a Merkle proof for the given address entry (SMT, depth=256).
 * proof[0] = sibling nearest the leaf; proof[255] = sibling nearest the root.
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
    const proof: string[] = [];

    // Collect siblings level-by-level, leaf→root (level SMT_DEPTH-1 first).
    const collectProof = (lvLeaves: LeafInfo[], depth: number): Buffer => {
        if (lvLeaves.length === 0) return EMPTY[SMT_DEPTH - depth];

        if (lvLeaves.length === 1) {
            const isTarget = lvLeaves[0].addrHash.equals(targetAddrHash);
            let h = lvLeaves[0].leafHash;
            for (let d = depth; d < SMT_DEPTH; d++) {
                const levelBit = SMT_DEPTH - 1 - d;
                const bit = getBit(lvLeaves[0].addrHash, levelBit);
                const sibling = EMPTY[0];
                if (isTarget) proof.push(sibling.toString('hex'));
                h = bit === 0 ? internalHash(h, sibling) : internalHash(sibling, h);
            }

            return h;
        }

        const levelBit = SMT_DEPTH - 1 - depth;
        const leftLeaves = lvLeaves.filter(l => getBit(l.addrHash, levelBit) === 0);
        const rightLeaves = lvLeaves.filter(l => getBit(l.addrHash, levelBit) === 1);

        const targetBit = getBit(targetAddrHash, levelBit);

        let leftHash: Buffer;
        let rightHash: Buffer;

        if (targetBit === 0) {
            leftHash = collectProof(leftLeaves, depth + 1);
            rightHash = buildRoot(rightLeaves, depth + 1);
            proof.push(rightHash.toString('hex'));
        } else {
            leftHash = buildRoot(leftLeaves, depth + 1);
            rightHash = collectProof(rightLeaves, depth + 1);
            proof.push(leftHash.toString('hex'));
        }

        return internalHash(leftHash, rightHash);
    };

    collectProof(leaves, 0);

    return proof;
};

/**
 * Recompute the SMT root from all stored entries.
 * Returns an empty string when there are no entries.
 */
export const computeMerkleRoot = (rows: AllEntriesRow[]): string => {
    if (rows.length === 0) return '';

    const leaves: LeafInfo[] = rows.map(r => ({
        addrHash: createHash('sha256').update(Buffer.from(r.address, 'utf8')).digest(),
        leafHash: computeLeafHash(r.address, r.networkSymbol, r.entry),
    }));

    return buildRoot(leaves, 0).toString('hex');
};

/**
 * Verify a proof locally (mirrors firmware evaluate_proof in lookup.py).
 * proof[0] = sibling nearest leaf; proof[255] = sibling nearest root.
 */
export const evaluateProof = (
    address: string,
    networkSymbol: string,
    entry: AddressEntry,
    proof: MerkleProof,
): string => {
    const addrHash = createHash('sha256').update(Buffer.from(address, 'utf8')).digest();
    let current = computeLeafHash(address, networkSymbol, entry);
    const depth = proof.length;

    for (let i = 0; i < depth; i++) {
        const level = depth - 1 - i;
        const bit = getBit(addrHash, level);
        const sibling = Buffer.from(proof[i], 'hex');
        current = bit === 0 ? internalHash(current, sibling) : internalHash(sibling, current);
    }

    return current.toString('hex');
};
