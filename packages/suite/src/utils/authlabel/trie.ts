/**
 * Authenticated-labeling binary Patricia trie (host side).
 *
 * Byte-for-byte identical hashing to the firmware
 * (`core/src/apps/authlabel/trie.py`) and the host reference
 * (`python/src/trezorlib/authlabel.py`). The device only verifies/recomputes;
 * Suite builds the trie and generates proofs. See
 * `.context/poc-labeling/DESIGN.md`.
 */
import { sha256 } from '@noble/hashes/sha2.js';

const LEAF_TAG = 0x00;
const BRANCH_TAG = 0x01;
const EMPTY_TAG = 0x02;
export const KEY_HASH_BITS = 256;

const u16 = (n: number) => new Uint8Array([(n >> 8) & 0xff, n & 0xff]);
const u32 = (n: number) =>
    new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);

const concat = (parts: Uint8Array[]) => {
    const len = parts.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(len);
    let off = 0;
    parts.forEach(p => {
        out.set(p, off);
        off += p.length;
    });

    return out;
};

const sha = (...parts: Uint8Array[]) => sha256(concat(parts));

export const bytesEqual = (a: Uint8Array, b: Uint8Array) => {
    if (a.length !== b.length) return false;

    return a.every((v, i) => v === b[i]);
};

export const toHex = (b: Uint8Array) =>
    Array.from(b)
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');

export const fromHex = (h: string) => {
    const out = new Uint8Array(h.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);

    return out;
};

export const encPrefix = (nbits: number, prefix: Uint8Array) => {
    const nbytes = Math.ceil(nbits / 8);
    const data = new Uint8Array(nbytes);
    data.set(prefix.slice(0, nbytes));
    const rem = nbits % 8;
    if (rem) data[nbytes - 1] = data[nbytes - 1]! & ((0xff << (8 - rem)) & 0xff);

    return concat([u16(nbits), data]);
};

export const getBit = (data: Uint8Array, index: number) =>
    (data[index >> 3]! >> (7 - (index & 7))) & 1;

export const firstDivergingBit = (a: Uint8Array, b: Uint8Array, maxBits: number) => {
    for (let i = 0; i < maxBits; i++) {
        if (getBit(a, i) !== getBit(b, i)) return i;
    }

    return maxBits;
};

export const EMPTY_ROOT = sha(
    new Uint8Array([EMPTY_TAG]),
    new TextEncoder().encode('AUTHLABEL_EMPTY_TRIE'),
);

export const keyHash = (keyType: number, keyBytes: Uint8Array) => sha(u16(keyType), keyBytes);

export const leafHash = (kh: Uint8Array, labelType: number, value: Uint8Array, counter: number) =>
    sha(
        new Uint8Array([LEAF_TAG]),
        encPrefix(KEY_HASH_BITS, kh),
        u16(labelType),
        u16(value.length),
        value,
        u32(counter),
    );

export const branchHash = (
    prefixBits: number,
    prefix: Uint8Array,
    c0: Uint8Array,
    c1: Uint8Array,
) => sha(new Uint8Array([BRANCH_TAG]), encPrefix(prefixBits, prefix), c0, c1);

// --- proof shapes (mirror the protobuf messages) ---
export interface TrieLeaf {
    key_hash: Uint8Array;
    label_type: number;
    label_value: Uint8Array;
    counter: number;
}
export interface TrieBranch {
    prefix: Uint8Array;
    prefix_bits: number;
    child_hash_0: Uint8Array;
    child_hash_1: Uint8Array;
}
export interface TriePathStep {
    prefix: Uint8Array;
    prefix_bits: number;
    sibling_hash: Uint8Array;
}
export interface TrieProof {
    leaf?: TrieLeaf;
    branch?: TrieBranch;
    path: TriePathStep[];
    empty?: boolean;
}

const leafNodeHash = (l: TrieLeaf) => leafHash(l.key_hash, l.label_type, l.label_value, l.counter);
const branchNodeHash = (b: TrieBranch) =>
    branchHash(b.prefix_bits, b.prefix, b.child_hash_0, b.child_hash_1);

const nodeHashAndPrefix = (proof: TrieProof): [Uint8Array, Uint8Array, number] => {
    if (proof.leaf) return [leafNodeHash(proof.leaf), proof.leaf.key_hash, KEY_HASH_BITS];
    if (proof.branch)
        return [branchNodeHash(proof.branch), proof.branch.prefix, proof.branch.prefix_bits];
    throw new Error('proof has no node');
};

const foldUp = (cur: Uint8Array, directionBits: Uint8Array, path: TriePathStep[]) => {
    let acc = cur;
    path.forEach(step => {
        const b = getBit(directionBits, step.prefix_bits);
        const [c0, c1] = b === 0 ? [acc, step.sibling_hash] : [step.sibling_hash, acc];
        acc = branchHash(step.prefix_bits, step.prefix, c0, c1);
    });

    return acc;
};

export const computeRoot = (proof: TrieProof): Uint8Array => {
    if (proof.empty) return EMPTY_ROOT;
    let [cur, nodePrefix] = nodeHashAndPrefix(proof);
    proof.path.forEach(step => {
        const b = getBit(nodePrefix, step.prefix_bits);
        const [c0, c1] = b === 0 ? [cur, step.sibling_hash] : [step.sibling_hash, cur];
        cur = branchHash(step.prefix_bits, step.prefix, c0, c1);
        nodePrefix = step.prefix;
    });

    return cur;
};

export const provesExistence = (proof: TrieProof, kh: Uint8Array) =>
    !!proof.leaf && bytesEqual(proof.leaf.key_hash, kh);

export const provesNonexistence = (proof: TrieProof, kh: Uint8Array) => {
    if (proof.empty) return true;
    if (!proof.leaf && !proof.branch) return false;
    const [, nodePrefix, nodePrefixBits] = nodeHashAndPrefix(proof);
    const parentBits = proof.path.length ? proof.path[0]!.prefix_bits : -1;
    const diverge = firstDivergingBit(kh, nodePrefix, nodePrefixBits);

    return parentBits < diverge && diverge < nodePrefixBits;
};

export const recomputeUpdate = (
    proof: TrieProof,
    kh: Uint8Array,
    labelType: number,
    value: Uint8Array,
    counter: number,
) => foldUp(leafHash(kh, labelType, value, counter), kh, proof.path);

export const recomputeDelete = (proof: TrieProof, kh: Uint8Array) => {
    if (!proof.path.length) return EMPTY_ROOT;

    return foldUp(proof.path[0]!.sibling_hash, kh, proof.path.slice(1));
};

export const recomputeAdd = (
    proof: TrieProof,
    kh: Uint8Array,
    labelType: number,
    value: Uint8Array,
    counter: number,
) => {
    const newLeaf = leafHash(kh, labelType, value, counter);
    if (proof.empty) return newLeaf;
    const [nodeHash, nodePrefix, nodePrefixBits] = nodeHashAndPrefix(proof);
    const diverge = firstDivergingBit(kh, nodePrefix, nodePrefixBits);
    const [c0, c1] = getBit(kh, diverge) === 0 ? [newLeaf, nodeHash] : [nodeHash, newLeaf];
    const newBranch = branchHash(diverge, kh, c0, c1);

    return foldUp(newBranch, kh, proof.path);
};

// ---------------------------------------------------------------------------
// trie builder + proof generator
// ---------------------------------------------------------------------------
interface Node {
    isLeaf: boolean;
    prefixBits: number;
    key: Uint8Array;
    labelType: number;
    labelValue: Uint8Array;
    counter: number;
    c0?: Node;
    c1?: Node;
}

const nodeHash = (n: Node): Uint8Array => {
    if (n.isLeaf) return leafHash(n.key, n.labelType, n.labelValue, n.counter);

    return branchHash(n.prefixBits, n.key, nodeHash(n.c0!), nodeHash(n.c1!));
};

type Entry = [Uint8Array, number, Uint8Array, number]; // key, labelType, value, counter

const commonPrefixLen = (keys: Uint8Array[]) => {
    for (let i = 0; i < KEY_HASH_BITS; i++) {
        const b = getBit(keys[0]!, i);
        for (let k = 1; k < keys.length; k++) {
            if (getBit(keys[k]!, i) !== b) return i;
        }
    }

    return KEY_HASH_BITS;
};

const build = (entries: Entry[]): Node => {
    if (entries.length === 1) {
        const [key, lt, lv, c] = entries[0]!;

        return {
            isLeaf: true,
            prefixBits: KEY_HASH_BITS,
            key,
            labelType: lt,
            labelValue: lv,
            counter: c,
        };
    }
    const keys = entries.map(e => e[0]);
    const L = commonPrefixLen(keys);

    return {
        isLeaf: false,
        prefixBits: L,
        key: keys[0]!,
        labelType: 0,
        labelValue: new Uint8Array(),
        counter: 0,
        c0: build(entries.filter(e => getBit(e[0], L) === 0)),
        c1: build(entries.filter(e => getBit(e[0], L) === 1)),
    };
};

export class Trie {
    private entries = new Map<string, Entry>();

    set(kh: Uint8Array, labelType: number, value: Uint8Array, counter: number) {
        this.entries.set(toHex(kh), [kh, labelType, value, counter]);
    }

    delete(kh: Uint8Array) {
        this.entries.delete(toHex(kh));
    }

    /** All leaves, so the trie can be persisted and rebuilt without the device. */
    allEntries(): { keyHash: Uint8Array; labelType: number; value: Uint8Array; counter: number }[] {
        return Array.from(this.entries.values()).map(([kh, lt, lv, c]) => ({
            keyHash: kh,
            labelType: lt,
            value: lv,
            counter: c,
        }));
    }

    static fromEntries(
        entries: { keyHash: Uint8Array; labelType: number; value: Uint8Array; counter: number }[],
    ) {
        const trie = new Trie();
        entries.forEach(e => trie.set(e.keyHash, e.labelType, e.value, e.counter));

        return trie;
    }

    private rootNode(): Node | undefined {
        if (this.entries.size === 0) return undefined;

        return build(Array.from(this.entries.values()));
    }

    root(): Uint8Array {
        const n = this.rootNode();

        return n ? nodeHash(n) : EMPTY_ROOT;
    }

    proof(kh: Uint8Array): TrieProof {
        const root = this.rootNode();
        if (!root) return { empty: true, path: [] };
        const steps: TriePathStep[] = [];
        let node = root;
        while (!node.isLeaf) {
            const div = firstDivergingBit(kh, node.key, node.prefixBits);
            if (div < node.prefixBits) break;
            const b = getBit(kh, node.prefixBits);
            const child = b === 1 ? node.c1! : node.c0!;
            const sibling = b === 1 ? node.c0! : node.c1!;
            steps.push({
                prefix: encPrefix(node.prefixBits, node.key).slice(2),
                prefix_bits: node.prefixBits,
                sibling_hash: nodeHash(sibling),
            });
            node = child;
        }
        steps.reverse();
        if (node.isLeaf) {
            return {
                leaf: {
                    key_hash: node.key,
                    label_type: node.labelType,
                    label_value: node.labelValue,
                    counter: node.counter,
                },
                path: steps,
            };
        }

        return {
            branch: {
                prefix: encPrefix(node.prefixBits, node.key).slice(2),
                prefix_bits: node.prefixBits,
                child_hash_0: nodeHash(node.c0!),
                child_hash_1: nodeHash(node.c1!),
            },
            path: steps,
        };
    }
}
