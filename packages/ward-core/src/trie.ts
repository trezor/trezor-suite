/**
 * The WARD Merkle trie: primitives and the device's own verification rules.
 *
 * A TypeScript port of `trezorlib.ward_trie` (firmware repo), which mirrors the firmware verifier
 * `core/src/apps/ward/trie.py`. It must stay byte-for-byte identical to both: the conformance
 * vectors in `__tests__/fixtures/vectors.json` are generated from the Python reference.
 *
 *     leaf     = sha256(0x00 || entry_key || commit)
 *     commit   = sha256(0x02 || len8(key_type) || key_type
 *                            || len32(id_part) || id_part || len32(val_part) || val_part)
 *     internal = sha256(0x01 || u16be(split_bit) || left || right)
 *     empty    = sha256(0x03)
 *     part     = encoding(1B) || len8(nonce) || nonce || len8(tag) || tag || len32(body) || body
 *
 * Children are POSITIONAL (left is bit 0), never sorted; a node's hash commits to its split bit
 * and never to its depth. A proof is a list of 34-byte elements, LEAF-TO-ROOT.
 */
import { sha256 } from '@noble/hashes/sha2.js';

import { type BytesLike, concatBytes, equalBytes, toBytes, u16, u32 } from './bytes';

export const EMPTY_ROOT = sha256(Uint8Array.of(0x03));
export const PROOF_ELEM_LEN = 34;
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
        if (!v || v.length !== 32) throw new WardTrieError('WARD trie operands must be 32 bytes');
    }
};

/** Bit `bit` of the path, MSB-first: bit 0 is the top bit of byte 0. */
export const addrBit = (entryKey: Uint8Array, bit: number): number =>
    ((entryKey[bit >> 3] ?? 0) >> (7 - (bit & 7))) & 1;

/** A wire WardLeafIdentity / WardLeafContent, as Connect carries it (bytes as hex). */
export interface WardPart {
    encoding?: number | null;
    encrypted?: { nonce?: BytesLike | null; tag?: BytesLike | null; ct?: BytesLike | null } | null;
    plaintext?: { content?: BytesLike | null } | null;
    plain?: object | null;
    key_type?: string | null;
}

const EMPTY_PART = concatBytes(Uint8Array.of(1, 0, 0), u32(0));

/**
 * A leaf part -> its canonical framing. DISPATCHES ON `encoding`, NOT ON FIELD PRESENCE, exactly
 * as the firmware does; an unknown encoding or both arms at once are refused.
 */
export const partBytes = (part: WardPart | null | undefined): Uint8Array => {
    if (!part) return EMPTY_PART;
    const encoding = part.encoding ?? 0;
    if (encoding !== 0 && encoding !== 1) {
        throw new Error(`unknown leaf part encoding: ${encoding}`);
    }
    const clear = part.plaintext ?? part.plain ?? null;
    const sealed = part.encrypted ?? null;
    if (sealed && clear) throw new Error('leaf part sets both encodings');

    if (encoding === 1) {
        if (!clear) return EMPTY_PART;
        // a plaintext identity carries structured fields, not a body; only the empty form ever
        // reaches the trie in practice (a delete)
        const body = toBytes((clear as { content?: BytesLike | null }).content ?? null);

        return concatBytes(Uint8Array.of(1, 0, 0), u32(body.length), body);
    }
    if (!sealed) return EMPTY_PART;
    const nonce = toBytes(sealed.nonce);
    const tag = toBytes(sealed.tag);
    const ct = toBytes(sealed.ct);

    return concatBytes(
        Uint8Array.of(0, nonce.length),
        nonce,
        Uint8Array.of(tag.length),
        tag,
        u32(ct.length),
        ct,
    );
};

/** The leaf commitment over a leaf's wire parts. */
export const commitOf = (
    keyType: string,
    identity: WardPart | null | undefined,
    content: WardPart | null | undefined,
): Uint8Array => {
    const kt = new TextEncoder().encode(keyType);
    const a = partBytes(identity);
    const b = partBytes(content);

    return sha256(
        concatBytes(Uint8Array.of(0x02, kt.length), kt, u32(a.length), a, u32(b.length), b),
    );
};

export const leafHash = (entryKey: Uint8Array, commit: Uint8Array): Uint8Array => {
    require32(entryKey, commit);

    return sha256(concatBytes(Uint8Array.of(0x00), entryKey, commit));
};

export const internalHash = (splitBit: number, left: Uint8Array, right: Uint8Array): Uint8Array =>
    sha256(concatBytes(Uint8Array.of(0x01), u16(splitBit), left, right));

export const proofElem = (splitBit: number, sibling: Uint8Array): Uint8Array => {
    require32(sibling);

    return concatBytes(u16(splitBit), sibling);
};

export const parseProofElem = (elem: Uint8Array): [number, Uint8Array] => {
    if (elem.length !== PROOF_ELEM_LEN) throw new WardTrieError('invalid proof element length');

    return [(elem[0]! << 8) | elem[1]!, elem.slice(2)];
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
