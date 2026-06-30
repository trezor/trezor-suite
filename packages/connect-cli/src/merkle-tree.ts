import { createHash } from 'crypto';

import type { AddressEntry, AllEntriesRow, MerkleProof } from '@trezor/connect';

// ---------------------------------------------------------------------------
// Hashing primitives — must match trezorlib.merkle_tree exactly
// ---------------------------------------------------------------------------

// leaf_hash(value) = SHA-256(b"\x00" + value)
// The raw value for an address entry is a deterministic UTF-8 encoding of all fields.
// This is what the client passes as AuthDbLookup.leaf_hash when talking to the device.
export const computeLeafHash = (
    address: string,
    networkSymbol: string,
    entry: AddressEntry,
): Buffer => {
    const raw = entryToBytes(address, networkSymbol, entry);

    return createHash('sha256').update(Buffer.concat([Buffer.from([0x00]), raw])).digest();
};

// internal_hash(a, b) = SHA-256(b"\x01" + min(a,b) + max(a,b))  — order-independent
const internalHash = (a: Buffer, b: Buffer): Buffer => {
    const [lo, hi] = a.compare(b) <= 0 ? [a, b] : [b, a];

    return createHash('sha256').update(Buffer.concat([Buffer.from([0x01]), lo, hi])).digest();
};

// Deterministic encoding of an address entry to bytes.
// Metadata keys are sorted so encoding is stable regardless of insertion order.
const entryToBytes = (address: string, networkSymbol: string, entry: AddressEntry): Buffer => {
    const metaSorted = Object.fromEntries(
        Object.entries(entry.metadata).sort(([a], [b]) => a.localeCompare(b)),
    );
    const encoded = `${address}:${networkSymbol}:${entry.counter}:${JSON.stringify(metaSorted)}`;

    return Buffer.from(encoded, 'utf8');
};

// ---------------------------------------------------------------------------
// Tree construction — matches trezorlib.MerkleTree algorithm:
//   1. Sort leaves by their hash.
//   2. Pair left-to-right; any leftover odd node is pushed to the next level unchanged.
//   3. Repeat until one node remains (the root).
// ---------------------------------------------------------------------------

const buildLayers = (leafHashes: Buffer[]): Buffer[][] => {
    const sorted = [...leafHashes].sort((a, b) => a.compare(b));
    const layers: Buffer[][] = [sorted];
    let current = sorted;

    while (current.length > 1) {
        const next: Buffer[] = [];
        let i = 0;
        while (i + 1 < current.length) {
            next.push(internalHash(current[i], current[i + 1]));
            i += 2;
        }
        if (i < current.length) next.push(current[i]); // odd node pushed up unchanged

        layers.push(next);
        current = next;
    }

    return layers;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a Merkle proof for the given address entry.
 *
 * Returns the ordered list of sibling hashes (hex strings) from the leaf level
 * to the root. No entry is added for levels where a node has no sibling (odd
 * node pushed up). This matches trezorlib.MerkleTree.get_proof / evaluate_proof.
 */
export const generateMerkleProof = (
    rows: AllEntriesRow[],
    address: string,
    networkSymbol: string,
): MerkleProof => {
    if (rows.length === 0) return [];

    const target = rows.find(r => r.address === address && r.networkSymbol === networkSymbol);
    if (!target) return [];

    const sortedLeaves = rows
        .map(r => ({ hash: computeLeafHash(r.address, r.networkSymbol, r.entry), row: r }))
        .sort((a, b) => a.hash.compare(b.hash));

    const targetHash = computeLeafHash(address, networkSymbol, target.entry);
    let idx = sortedLeaves.findIndex(l => l.hash.compare(targetHash) === 0);
    if (idx === -1) return [];

    const layers = buildLayers(sortedLeaves.map(l => l.hash));
    const proof: MerkleProof = [];

    for (let level = 0; level < layers.length - 1; level++) {
        const layer = layers[level];
        if (idx % 2 === 0) {
            // right sibling exists only if this is not the lone odd node
            if (idx + 1 < layer.length) proof.push(layer[idx + 1].toString('hex'));
            // else: odd node pushed up — no proof entry at this level
        } else {
            proof.push(layer[idx - 1].toString('hex'));
        }
        idx = Math.floor(idx / 2);
    }

    return proof;
};

/**
 * Recompute the Merkle root from all stored entries.
 * Returns an empty string when there are no entries.
 */
export const computeMerkleRoot = (rows: AllEntriesRow[]): string => {
    if (rows.length === 0) return '';

    const leafHashes = rows.map(r => computeLeafHash(r.address, r.networkSymbol, r.entry));
    const layers = buildLayers(leafHashes);

    return layers[layers.length - 1][0].toString('hex');
};

/**
 * Reconstruct the root from a single entry + its proof.
 * Equivalent to trezorlib.merkle_tree.evaluate_proof.
 * Useful for verifying a proof locally before sending to the device.
 */
export const evaluateProof = (
    address: string,
    networkSymbol: string,
    entry: AddressEntry,
    proof: MerkleProof,
): string => {
    let hash = computeLeafHash(address, networkSymbol, entry);
    for (const siblingHex of proof) {
        hash = internalHash(hash, Buffer.from(siblingHex, 'hex'));
    }

    return hash.toString('hex');
};
