/**
 * The WARD Merkle trie: primitives and the device's own verification rules.
 *
 * A TypeScript port of `trezorlib.ward_trie` (firmware repo), which mirrors the firmware verifier
 * `core/src/apps/ward/trie.py`. It must stay byte-for-byte identical to both: the conformance
 * vectors in `__tests__/fixtures/vectors.json` are generated from the Python reference.
 *
 *     leaf     = sha256(0x00 || entry_key || commit)
 *     commit   = value_digest = sha256(0x03 || sealed_content)    -- docs/ward/ward_leaf_encryption.md
 *     internal = sha256(0x01 || u8(split_bit) || left || right)
 *     empty    = sha256(0x02)
 *
 * Children are POSITIONAL (left is bit 0), never sorted; a node's hash commits to its split bit
 * and never to its depth. A proof is a list of 33-byte elements, LEAF-TO-ROOT. The split bit is one
 * byte, which holds every position of a 32-byte key -- `rust/trezor-ward`'s `BitPos` encoding.
 */
import { sha256 } from '@noble/hashes/sha2.js';

import { type BytesLike, concatBytes, equalBytes, toBytes } from './bytes';

export const EMPTY_ROOT = sha256(Uint8Array.of(0x02));
export const PROOF_ELEM_LEN = 33;
const KEY_BITS = 256;

/** A malformed operand or proof, or a claim that does not hold -- what the device refuses too. */
export class WardTrieError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WardTrieError';
    }
}

const require32 = (...values: (Uint8Array | null | undefined)[]) => {
    // Every opaque operand is exactly 32 bytes, and that is load-bearing: the preimages
    // concatenate them with no separator, so a key K || C[0] with commit C[1:] would hash to the
    // leaf of (K, C). Fixed width makes every split unambiguous.
    for (const v of values) {
        if (v?.length !== 32) throw new WardTrieError('WARD trie operands must be 32 bytes');
    }
};

/** Bit `bit` of the path, MSB-first: bit 0 is the top bit of byte 0. */
export const addrBit = (entryKey: Uint8Array, bit: number): number =>
    ((entryKey[bit >> 3] ?? 0) >> (7 - (bit & 7))) & 1;

/**
 * The leaf commitment: sha256(0x03 || sealed_content), over sealed bytes only, so a host with no
 * keys can compute it. The sealed identity is not committed -- entry_key authenticates it.
 */
export const valueDigest = (sealedContent: BytesLike | null | undefined): Uint8Array =>
    sha256(concatBytes(Uint8Array.of(0x03), toBytes(sealedContent)));

export const leafHash = (entryKey: Uint8Array, commit: Uint8Array): Uint8Array => {
    require32(entryKey, commit);

    return sha256(concatBytes(Uint8Array.of(0x00), entryKey, commit));
};

export const internalHash = (splitBit: number, left: Uint8Array, right: Uint8Array): Uint8Array =>
    sha256(concatBytes(Uint8Array.of(0x01, splitBit), left, right));

export const proofElem = (splitBit: number, sibling: Uint8Array): Uint8Array => {
    require32(sibling);

    return concatBytes(Uint8Array.of(splitBit), sibling);
};

export const parseProofElem = (elem: Uint8Array): [number, Uint8Array] => {
    if (elem.length !== PROOF_ELEM_LEN) throw new WardTrieError('invalid proof element length');

    return [elem[0]!, elem.slice(1)];
};

/** Refuse a proof that is not a real root-to-leaf path; return its parsed steps (root first). */
export const checkShape = (proof: readonly Uint8Array[]): [number, Uint8Array][] => {
    const steps: [number, Uint8Array][] = [];
    let prev = -1;
    for (const elem of [...proof].reverse()) {
        const [splitBit, sibling] = parseProofElem(elem);
        if (splitBit >= KEY_BITS) throw new WardTrieError('proof split_bit out of range');
        if (splitBit <= prev) {
            throw new WardTrieError('proof split bits are not strictly increasing');
        }
        steps.push([splitBit, sibling]);
        prev = splitBit;
    }

    return steps;
};

/** Hash `start` up the path of `entryKey` to a CANDIDATE root; the caller compares it. */
export const fold = (
    start: Uint8Array,
    proof: readonly Uint8Array[],
    entryKey: Uint8Array,
): Uint8Array => {
    require32(start, entryKey);
    checkShape(proof);
    let node = start;
    for (const elem of proof) {
        const [splitBit, sibling] = parseProofElem(elem);
        node =
            addrBit(entryKey, splitBit) === 0
                ? internalHash(splitBit, node, sibling)
                : internalHash(splitBit, sibling, node);
    }

    return node;
};

export const verifyMembership = (
    entryKey: Uint8Array,
    commit: Uint8Array,
    proof: readonly Uint8Array[],
    root: Uint8Array,
): boolean => equalBytes(fold(leafHash(entryKey, commit), proof, entryKey), root);

const absenceFailure = (
    entryKey: Uint8Array,
    witnessKey: Uint8Array,
    witnessCommit: Uint8Array,
    proof: readonly Uint8Array[],
    root: Uint8Array,
): string | null => {
    // Widths RAISE; every other failure is a reason. The same split as the firmware.
    require32(entryKey, witnessKey, witnessCommit);
    if (equalBytes(witnessKey, entryKey)) return 'witness must differ from entry_key';
    for (const [splitBit] of checkShape(proof)) {
        if (addrBit(entryKey, splitBit) !== addrBit(witnessKey, splitBit)) {
            return "witness does not occupy the target's path";
        }
    }
    if (!equalBytes(fold(leafHash(witnessKey, witnessCommit), proof, witnessKey), root)) {
        return 'witness is not in the tree';
    }

    return null;
};

export const verifyNonmembership = (
    entryKey: Uint8Array,
    witnessKey: Uint8Array,
    witnessCommit: Uint8Array,
    proof: readonly Uint8Array[],
    root: Uint8Array,
): boolean => absenceFailure(entryKey, witnessKey, witnessCommit, proof, root) === null;

const requireSettled = (storedRoot: Uint8Array | null | undefined): Uint8Array => {
    // None is "cannot verify", never "empty": read as empty it would authorise a witness-less
    // insert that replaces the tree.
    if (!storedRoot) throw new WardTrieError('no trusted root');

    return storedRoot;
};

/** The root after inserting `(entryKey, newCommit)`, having proved `entryKey` absent. */
export const insertRoot = (
    entryKey: Uint8Array,
    newCommit: Uint8Array,
    proof: readonly Uint8Array[],
    storedRoot: Uint8Array,
    witnessKey?: Uint8Array | null,
    witnessCommit?: Uint8Array | null,
): Uint8Array => {
    const root = requireSettled(storedRoot);
    require32(entryKey);
    if (equalBytes(root, EMPTY_ROOT)) {
        if (proof.length || witnessKey) throw new WardTrieError('an empty tree takes no witness');

        return leafHash(entryKey, newCommit);
    }
    if (!witnessKey || !witnessCommit) {
        throw new WardTrieError('insert needs a non-membership witness');
    }
    const failure = absenceFailure(entryKey, witnessKey, witnessCommit, proof, root);
    if (failure) throw new WardTrieError(failure);

    let splitBit = 0;
    while (addrBit(entryKey, splitBit) === addrBit(witnessKey, splitBit)) splitBit++;
    let idx = 0;
    while (idx < proof.length && parseProofElem(proof[idx]!)[0] > splitBit) idx++;
    if (idx < proof.length && parseProofElem(proof[idx]!)[0] === splitBit) {
        throw new WardTrieError('witness path already branches at the split bit');
    }
    const subtree = fold(leafHash(witnessKey, witnessCommit), proof.slice(0, idx), witnessKey);
    const newLeaf = leafHash(entryKey, newCommit);
    const branch =
        addrBit(entryKey, splitBit) === 0
            ? internalHash(splitBit, newLeaf, subtree)
            : internalHash(splitBit, subtree, newLeaf);

    return fold(branch, proof.slice(idx), witnessKey);
};

const provePresent = (
    entryKey: Uint8Array,
    oldCommit: Uint8Array,
    proof: readonly Uint8Array[],
    storedRoot: Uint8Array,
) => {
    const root = requireSettled(storedRoot);
    if (equalBytes(root, EMPTY_ROOT)) {
        throw new WardTrieError('the tree is empty; nothing to replace');
    }
    if (!verifyMembership(entryKey, oldCommit, proof, root)) {
        throw new WardTrieError('current entry does not match the trusted root');
    }
};

/** The root after deleting a present leaf: its sibling moves up unchanged. */
export const deleteRoot = (
    entryKey: Uint8Array,
    oldCommit: Uint8Array,
    proof: readonly Uint8Array[],
    storedRoot: Uint8Array,
): Uint8Array => {
    provePresent(entryKey, oldCommit, proof, storedRoot);
    if (!proof.length) return EMPTY_ROOT;
    const [, sibling] = parseProofElem(proof[0]!);

    return fold(sibling, proof.slice(1), entryKey);
};

/** The root after replacing a present leaf's value: same path, same siblings, new leaf. */
export const updateRoot = (
    entryKey: Uint8Array,
    oldCommit: Uint8Array,
    newCommit: Uint8Array,
    proof: readonly Uint8Array[],
    storedRoot: Uint8Array,
): Uint8Array => {
    provePresent(entryKey, oldCommit, proof, storedRoot);

    return fold(leafHash(entryKey, newCommit), proof, entryKey);
};
