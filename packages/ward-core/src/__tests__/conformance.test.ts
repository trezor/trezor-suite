/**
 * Conformance against the Python reference (`trezorlib.ward_trie`, firmware repo). Every value in
 * the fixture was produced there -- see `scripts/gen-vectors.py` -- so passing means this port
 * computes the same roots, proofs and commits byte for byte.
 */
import { toBytes, toHex } from '../bytes';
import { OP_COMMIT, OP_REVERT, WardTrie } from '../store';
import {
    EMPTY_ROOT,
    WardTrieError,
    checkShape,
    commitOf,
    deleteRoot,
    insertRoot,
    proofElem,
    updateRoot,
    verifyMembership,
    verifyNonmembership,
} from '../trie';
import vectors from './fixtures/vectors.json';

const hex = (v: string) => toBytes(v);
const hexes = (vs: string[]) => vs.map(hex);

describe('ward-core conformance with trezorlib.ward_trie', () => {
    it('agrees on the empty root', () => {
        expect(toHex(EMPTY_ROOT)).toBe(vectors.empty_root);
    });

    it('verifies the firmware frozen vectors', () => {
        const f = vectors.frozen;
        expect(
            verifyMembership(hex(f.member), hex(f.witness_commit), hexes(f.proof), hex(f.root)),
        ).toBe(true);
        expect(
            verifyNonmembership(
                hex(f.absent),
                hex(f.member),
                hex(f.witness_commit),
                hexes(f.proof),
                hex(f.root),
            ),
        ).toBe(true);
        // the witness equal to the target proves presence, not absence
        expect(
            verifyNonmembership(
                hex(f.member),
                hex(f.member),
                hex(f.witness_commit),
                hexes(f.proof),
                hex(f.root),
            ),
        ).toBe(false);
        // a relabelled split bit misses the root
        const relabelled = Uint8Array.from([0, 1, ...hex(f.proof[0]!).slice(2)]);
        expect(
            verifyNonmembership(
                hex(f.absent),
                hex(f.member),
                hex(f.witness_commit),
                [relabelled],
                hex(f.root),
            ),
        ).toBe(false);
    });

    it('computes every commit the reference does', () => {
        for (const c of vectors.commits) {
            expect(toHex(commitOf(c.key_type, c.identity as any, c.content as any))).toBe(c.commit);
        }
    });

    it.each(vectors.runs.map(r => [r.seed, r.shared_prefix_bytes, r] as const))(
        'replays run seed=%s shared=%s: roots, proofs, and the verifier-derived roots',
        (_seed, _shared, run) => {
            const store = new WardTrie();
            let derived: Uint8Array = EMPTY_ROOT;
            for (const step of run.steps as any[]) {
                const key = hex(step.key);
                const before = store.rootOrEmpty();
                if (step.op === 'delete') {
                    derived = deleteRoot(
                        key,
                        store.commit(key),
                        store.membershipProof(key),
                        before,
                    );
                    store.remove(key);
                } else {
                    const newCommit = commitOf('address', step.leaf.identity, step.leaf.content);
                    if (step.op === 'update') {
                        derived = updateRoot(
                            key,
                            store.commit(key),
                            newCommit,
                            store.membershipProof(key),
                            before,
                        );
                    } else {
                        const [proof, wk, wc] = store.nonmembershipProof(key);
                        derived = insertRoot(key, newCommit, proof, before, wk, wc);
                    }
                    store.set(key, {
                        ...step.leaf,
                        identity: { ...step.leaf.identity, key_type: 'address' },
                    });
                }
                expect(store.root() === null ? null : toHex(store.root()!)).toBe(step.root);
                expect(toHex(derived)).toBe(step.root ?? vectors.empty_root);
                expect(store.root()).toEqual(store.rebuildRoot()); // the cache never drifts

                if (step.membership) {
                    const m = step.membership;
                    expect(store.membershipProof(hex(m.key)).map(toHex)).toEqual(m.proof);
                    expect(toHex(store.commit(hex(m.key)))).toBe(m.commit);
                }
                if (step.nonmembership) {
                    const n = step.nonmembership;
                    const [proof, wk, wc] = store.nonmembershipProof(hex(n.key));
                    expect(proof.map(toHex)).toEqual(n.proof);
                    expect(toHex(wk!)).toBe(n.witness_key);
                    expect(toHex(wc!)).toBe(n.witness_commit);
                }
            }
        },
    );

    it('serves a batch from the staged scratch tree exactly as the reference does', () => {
        const base = new WardTrie().scratch(
            Object.entries(vectors.batch.base).map(([k, v]) => [hex(k), hex((v as any).commit)]),
        );
        expect(toHex(base.rootOrEmpty())).toBe(vectors.batch.base_root);
        const staged: [Uint8Array, Uint8Array][] = [];
        for (const s of vectors.batch.served as any[]) {
            const view = base.scratch(staged);
            expect(toHex(view.rootOrEmpty())).toBe(s.root_before);
            const key = hex(s.key);
            if (s.present) {
                expect(view.membershipProof(key).map(toHex)).toEqual(s.proof);
            } else {
                const [proof, wk, wc] = view.nonmembershipProof(key);
                expect(proof.map(toHex)).toEqual(s.proof);
                expect([toHex(wk!), toHex(wc!)]).toEqual([s.witness_key, s.witness_commit]);
            }
            staged.push([key, hex(s.staged_commit)]);
        }
    });

    it('agrees on the transition log: newest link wins, and the fork point', () => {
        const store = new WardTrie();
        for (const l of vectors.log.links) {
            store.record({
                fromCounter: l.from_counter,
                fromRoot: l.from_root ? hex(l.from_root) : null,
                toCounter: l.to_counter,
                toRoot: l.to_root ? hex(l.to_root) : null,
                authCommit: hex(l.auth_commit),
                operation: l.operation === 'revert' ? OP_REVERT : OP_COMMIT,
            });
        }
        for (const e of vectors.log.ending_at) {
            expect(store.linksEndingAt(e.to_counter, hex(e.to_root)).map(l => l.toCounter)).toEqual(
                e.counters,
            );
        }
        for (const f of vectors.log.fork_point) {
            expect(
                store.forkPoint(
                    [f.a[0] as number, hex(f.a[1] as string)],
                    [f.b[0] as number, hex(f.b[1] as string)],
                ),
            ).toBe(f.k);
        }
    });
});

describe('ward-core refuses what the device refuses', () => {
    it('refuses malformed proofs before hashing', () => {
        for (const proof of [
            [Uint8Array.from([1, 0, ...new Uint8Array(32)])], // split_bit 256
            [new Uint8Array(33)],
            [proofElem(1, new Uint8Array(32)), proofElem(4, new Uint8Array(32))], // reversed
            [proofElem(1, new Uint8Array(32)), proofElem(1, new Uint8Array(32))], // repeated
        ]) {
            expect(() => checkShape(proof)).toThrow(WardTrieError);
        }
    });

    it('refuses an unsettled root and a witness-less insert on a non-empty tree', () => {
        const f = vectors.frozen;
        expect(() => insertRoot(hex(f.member), hex(f.witness_commit), [], null as any)).toThrow(
            'no trusted root',
        );
        expect(() => insertRoot(hex(f.absent), hex(f.witness_commit), [], hex(f.root))).toThrow(
            'witness',
        );
    });
});
