/**
 * The host's side of the trie: the leaves it holds, the proofs it serves, and its transition log.
 * A port of `trezorlib.ward_trie.WardTrie` / `TransitionLog`.
 */
import { equalBytes, toHex } from './bytes';
import {
    EMPTY_ROOT,
    type WardPart,
    addrBit,
    commitOf,
    internalHash,
    leafHash,
    proofElem,
} from './trie';

export const OP_COMMIT = 'commit';
export const OP_REVERT = 'revert';
export type LinkOperation = typeof OP_COMMIT | typeof OP_REVERT;

/**
 * One transition, as a host logs it. The operation is RECORDED, not derived: telling a COMMIT
 * from a REVERT means computing the MAC under both tags, which needs K_auth -- which the host
 * does not have. `null` roots are the empty tree.
 */
export interface Link {
    fromCounter: number;
    fromRoot: Uint8Array | null;
    toCounter: number;
    toRoot: Uint8Array | null;
    authCommit: Uint8Array;
    operation: LinkOperation;
}

const sameRoot = (a: Uint8Array | null, b: Uint8Array | null) =>
    equalBytes(a ?? EMPTY_ROOT, b ?? EMPTY_ROOT);

export class TransitionLog {
    links: Link[] = [];
    /** counter -> the device's `wm_sig` for the transition that reached it */
    wmSigs = new Map<number, Uint8Array>();

    record(link: Link, wmSig?: Uint8Array): Link {
        if (link.operation !== OP_COMMIT && link.operation !== OP_REVERT) {
            throw new Error(`unknown link operation: ${link.operation}`);
        }
        this.links.push(link);
        if (wmSig) this.wmSigs.set(link.toCounter, wmSig);

        return link;
    }

    /**
     * The predecessors of a state, walking BACK from it -- the device's backward walk. THE NEWEST
     * MATCH WINS where several rows end at the same (counter, root): once a demotion exists a
     * counter can be reached twice, and the later edge is the live history.
     */
    linksEndingAt(toCounter: number, toRoot: Uint8Array | null, limit = 64): Link[] {
        const out: Link[] = [];
        let counter = toCounter;
        let root = toRoot;
        while (out.length < limit) {
            let found: Link | undefined;
            for (let i = this.links.length - 1; i >= 0; i--) {
                const link = this.links[i]!;
                if (link.toCounter === counter && sameRoot(link.toRoot, root)) {
                    found = link;
                    break;
                }
            }
            if (!found) break;
            out.push(found);
            counter = found.fromCounter;
            root = found.fromRoot;
        }

        return out;
    }

    /** The last counter two states share, walking both back; null if never. */
    forkPoint(a: [number, Uint8Array | null], b: [number, Uint8Array | null]): number | null {
        let [ac, ar] = a;
        let [bc, br] = b;
        while (!(ac === bc && sameRoot(ar, br))) {
            if (ac >= bc) {
                const [prev] = this.linksEndingAt(ac, ar, 1);
                if (!prev) return null;
                [ac, ar] = [prev.fromCounter, prev.fromRoot];
            } else {
                const [prev] = this.linksEndingAt(bc, br, 1);
                if (!prev) return null;
                [bc, br] = [prev.fromCounter, prev.fromRoot];
            }
        }

        return ac;
    }
}

/** A stored leaf exactly as the device built it. */
export interface WardLeaf {
    identity?: WardPart | null;
    content?: WardPart | null;
}

type Node = ['leaf', string] | ['branch', number, Node, Node];

const hexToKey = (hex: string) => Uint8Array.from(hex.match(/../g)!.map(h => parseInt(h, 16)));

/**
 * A host's replica: entry_key -> leaf, the canonical root, proofs -- and its transition log.
 * Keys are held as lowercase hex, whose sort order is the byte order the tree is built in.
 *
 * CACHED, WITH THE REBUILD AS THE ORACLE: the tree is built once and dropped by the only two
 * mutators; `rebuildRoot()` recomputes from scratch and the tests hold the two equal.
 */
export class WardTrie extends TransitionLog {
    private leaves = new Map<string, Uint8Array>();
    private commits = new Map<string, Uint8Array>();
    blobs = new Map<string, WardLeaf>();
    counter = 0;
    private tree: Node | null = null;

    set(entryKey: Uint8Array, leaf: WardLeaf, keyType?: string): void {
        const kt = keyType ?? leaf.identity?.key_type ?? 'address';
        const commit = commitOf(kt, leaf.identity, leaf.content);
        const k = toHex(entryKey);
        this.commits.set(k, commit);
        this.leaves.set(k, leafHash(entryKey, commit));
        this.blobs.set(k, leaf);
        this.tree = null;
    }

    remove(entryKey: Uint8Array): void {
        const k = toHex(entryKey);
        this.leaves.delete(k);
        this.commits.delete(k);
        this.blobs.delete(k);
        this.tree = null;
    }

    has(entryKey: Uint8Array): boolean {
        return this.leaves.has(toHex(entryKey));
    }

    commit(entryKey: Uint8Array): Uint8Array {
        const c = this.commits.get(toHex(entryKey));
        if (!c) throw new Error('entry_key is not in the tree');

        return c;
    }

    get size(): number {
        return this.leaves.size;
    }

    private build(keys: string[], start: number): Node {
        if (keys.length === 1) return ['leaf', keys[0]!];
        const bytes = keys.map(hexToKey);
        let bit = start;
        for (; bit < 256; bit++) {
            const b0 = addrBit(bytes[0]!, bit);
            if (bytes.some(k => addrBit(k, bit) !== b0)) break;
        }
        if (bit === 256) throw new Error('duplicate entry_key (HMAC-SHA256 collision)');
        const left = keys.filter((_, i) => addrBit(bytes[i]!, bit) === 0);
        const right = keys.filter((_, i) => addrBit(bytes[i]!, bit) === 1);

        return ['branch', bit, this.build(left, bit + 1), this.build(right, bit + 1)];
    }

    private hash(node: Node): Uint8Array {
        if (node[0] === 'leaf') return this.leaves.get(node[1])!;

        return internalHash(node[1], this.hash(node[2]), this.hash(node[3]));
    }

    private rootNode(): Node {
        if (!this.tree) this.tree = this.build([...this.leaves.keys()].sort(), 0);

        return this.tree;
    }

    /** The canonical root, or null when empty (the wire's "absent"). */
    root(): Uint8Array | null {
        return this.leaves.size ? this.hash(this.rootNode()) : null;
    }

    rootOrEmpty(): Uint8Array {
        return this.root() ?? EMPTY_ROOT;
    }

    rebuildRoot(): Uint8Array | null {
        return this.leaves.size ? this.hash(this.build([...this.leaves.keys()].sort(), 0)) : null;
    }

    private proof(node: Node, target: Uint8Array, out: Uint8Array[]): Uint8Array {
        if (node[0] === 'leaf') return this.leaves.get(node[1])!;
        const [, bit, left, right] = node;
        let lh: Uint8Array;
        let rh: Uint8Array;
        if (addrBit(target, bit) === 0) {
            lh = this.proof(left, target, out);
            rh = this.hash(right);
            out.push(proofElem(bit, rh));
        } else {
            lh = this.hash(left);
            rh = this.proof(right, target, out);
            out.push(proofElem(bit, lh));
        }

        return internalHash(bit, lh, rh);
    }

    membershipProof(entryKey: Uint8Array): Uint8Array[] {
        if (!this.has(entryKey)) throw new Error('entry_key is not in the tree');
        const out: Uint8Array[] = [];
        this.proof(this.rootNode(), entryKey, out);

        return out;
    }

    /** [proof, witnessKey, witnessCommit] for an ABSENT key; [[], null, null] when empty. */
    nonmembershipProof(entryKey: Uint8Array): [Uint8Array[], Uint8Array | null, Uint8Array | null] {
        if (!this.leaves.size) return [[], null, null];
        let node = this.rootNode();
        while (node[0] === 'branch') {
            node = addrBit(entryKey, node[1]) === 0 ? node[2] : node[3];
        }
        const witness = hexToKey(node[1]);

        return [this.membershipProof(witness), witness, this.commits.get(node[1])!];
    }

    /**
     * A copy with `staged` (entryKey, commit) leaves applied -- what a host serves a BATCHED
     * flush from, since the device proves each change against the root it has built so far.
     */
    scratch(staged: readonly [Uint8Array, Uint8Array][] = []): WardTrie {
        const copy = new WardTrie();
        copy.leaves = new Map(this.leaves);
        copy.commits = new Map(this.commits);
        copy.blobs = new Map(this.blobs);
        for (const [entryKey, commit] of staged) {
            const k = toHex(entryKey);
            copy.commits.set(k, commit);
            copy.leaves.set(k, leafHash(entryKey, commit));
        }
        copy.counter = this.counter;

        return copy;
    }
}
