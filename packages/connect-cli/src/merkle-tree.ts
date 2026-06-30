import { createHash } from 'crypto';

import type { AddressEntry, AllEntriesRow, MerkleProof } from '@trezor/connect';

// Leaf hash: deterministic encoding of address + networkSymbol + counter + metadata.
const hashLeaf = (address: string, networkSymbol: string, entry: AddressEntry): string =>
    createHash('sha256')
        .update(`${address}:${networkSymbol}:${entry.counter}:${JSON.stringify(entry.metadata)}`)
        .digest('hex');

const hashPair = (left: string, right: string): string =>
    createHash('sha256').update(left + right).digest('hex');

// Pad to the next power of two by repeating the last leaf.
const padToPow2 = (hashes: string[]): string[] => {
    if (hashes.length <= 1) return hashes;
    let len = 1;
    while (len < hashes.length) len <<= 1;
    const padded = [...hashes];
    while (padded.length < len) padded.push(padded[padded.length - 1]);

    return padded;
};

/**
 * Builds a Merkle tree from all stored address entries and returns the proof for the
 * given address. Leaves are sorted by their hash for a deterministic, insertion-order-
 * independent tree.
 *
 * Returns an empty array when the address is not present or the tree has fewer than
 * two entries (single-leaf tree needs no proof).
 *
 * Note: this is a simple binary Merkle tree used as a placeholder until the full
 * Merkle Patricia Trie (MPT) used by the Trezor device is implemented.
 */
export const generateMerkleProof = (
    rows: AllEntriesRow[],
    address: string,
    networkSymbol: string,
): MerkleProof => {
    if (rows.length === 0) return [];

    const leaves = rows
        .map(r => ({ hash: hashLeaf(r.address, r.networkSymbol, r.entry), row: r }))
        .sort((a, b) => a.hash.localeCompare(b.hash));

    const targetIdx = leaves.findIndex(
        l => l.row.address === address && l.row.networkSymbol === networkSymbol,
    );
    if (targetIdx === -1) return [];

    const hashes = padToPow2(leaves.map(l => l.hash));
    const proof: MerkleProof = [];
    let idx = targetIdx;
    let levelSize = hashes.length;
    let level = [...hashes];

    while (levelSize > 1) {
        const sibling = idx % 2 === 0 ? level[idx + 1] : level[idx - 1];
        proof.push(sibling);

        const next: string[] = [];
        for (let i = 0; i < levelSize; i += 2) {
            next.push(hashPair(level[i], level[i + 1]));
        }
        idx = Math.floor(idx / 2);
        level = next;
        levelSize = next.length;
    }

    return proof;
};

/**
 * Computes the Merkle root from all stored address entries.
 * Returns an empty string when there are no entries.
 */
export const computeMerkleRoot = (rows: AllEntriesRow[]): string => {
    if (rows.length === 0) return '';

    const hashes = padToPow2(
        rows
            .map(r => hashLeaf(r.address, r.networkSymbol, r.entry))
            .sort((a, b) => a.localeCompare(b)),
    );

    let level = hashes;
    while (level.length > 1) {
        const next: string[] = [];
        for (let i = 0; i < level.length; i += 2) {
            next.push(hashPair(level[i], level[i + 1]));
        }
        level = next;
    }

    return level[0];
};
