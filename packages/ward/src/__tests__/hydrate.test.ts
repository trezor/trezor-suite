import { hydrate, resolveHead } from '../app';
import type { BlobRow } from '../proof';
import { computeRootFromBlobs } from '../proof';
import { InMemoryWardDb } from '../storage';
import type { WardTransition } from '../types';

// Leaf blobs are opaque to the host — reconstruction only re-derives commit/leaf hashes from
// (entry_key, nonce, tag, ct), which is keyless. So fixtures can use arbitrary hex; they
// need not be real ChaCha ciphertexts.
const blob = (ek: string, ct: string): BlobRow => ({
    entryKeyHex: ek.repeat(32),
    nonceHex: '01'.repeat(12),
    tagHex: '02'.repeat(16),
    ctHex: ct,
    entryType: 'address',
});

const rootOf = (rows: BlobRow[]) => computeRootFromBlobs(rows);

// Build a linear lineage: insert A, insert B, update A, delete B. Returns the ordered
// transitions plus the expected head root and final leaf set.
const buildChain = () => {
    const A = blob('aa', 'aabb');
    const B = blob('bb', 'ccdd');
    const A2 = { ...A, ctHex: 'aaee' }; // update A (same entry_key, new ct)

    const s1 = [A];
    const s2 = [A, B];
    const s3 = [A2, B];
    const s4 = [A2]; // B deleted

    const R1 = rootOf(s1);
    const R2 = rootOf(s2);
    const R3 = rootOf(s3);
    const R4 = rootOf(s4);

    const asT = (
        counter: number,
        prevRoot: string,
        targetRoot: string,
        b: BlobRow,
        ct: string,
    ): WardTransition => ({
        counter,
        prevRoot,
        targetRoot,
        leaves: [
            { entryKey: b.entryKeyHex, entryType: 'address', nonce: b.nonceHex, tag: b.tagHex, ct },
        ],
    });

    const transitions: WardTransition[] = [
        asT(1, '', R1, A, A.ctHex),
        asT(2, R1, R2, B, B.ctHex),
        asT(3, R2, R3, A2, A2.ctHex),
        asT(4, R3, R4, B, ''), // delete B
    ];

    return { transitions, head: R4, finalLeaves: s4, A2 };
};

describe('§7 hydrate — reconstruct + verify MPT from the transition lineage', () => {
    it('reproduces the head root and final leaf set via backward-walk + forward replay', () => {
        const { transitions, head, A2 } = buildChain();
        const res = hydrate(transitions, head);
        expect(res.root).toBe(head);
        expect(res.verifiedCounter).toBe(4);
        // Only the surviving leaf (A2) remains; B was deleted.
        expect(res.blobs).toHaveLength(1);
        expect(res.blobs.map(b => b.entryKeyHex)).toEqual([A2.entryKeyHex]);
        expect(res.blobs.map(b => b.ctHex)).toEqual([A2.ctHex]);
        expect(computeRootFromBlobs(res.blobs)).toBe(head);
    });

    it('empty head yields an empty tree', () => {
        expect(hydrate([], '')).toEqual({ blobs: [], root: '', verifiedCounter: 0 });
    });

    it('is order-insensitive on input (indexes by target_root, not array order)', () => {
        const { transitions, head } = buildChain();
        const reversed = [...transitions].reverse();
        expect(hydrate(reversed, head).root).toBe(head);
    });

    it('ignores an orphan batch not on the head lineage', () => {
        const { transitions, head } = buildChain();
        const orphan: WardTransition = {
            counter: 99,
            prevRoot: 'de'.repeat(32),
            targetRoot: 'ad'.repeat(32),
            leaves: [
                {
                    entryKey: 'cc'.repeat(32),
                    entryType: 'address',
                    nonce: '01'.repeat(12),
                    tag: '02'.repeat(16),
                    ct: 'beef',
                },
            ],
        };
        expect(hydrate([...transitions, orphan], head).root).toBe(head);
    });

    it('REJECTS a tampered target_root (per-batch root check fails)', () => {
        const { transitions, head } = buildChain();
        const tampered = transitions.map(t =>
            t.counter === 2 ? { ...t, targetRoot: 'ff'.repeat(32) } : t,
        );
        // The tampered root is now unreachable from head → lineage break at that link.
        expect(() => hydrate(tampered, head)).toThrow(/lineage incomplete|non-contiguous/);
    });

    it('REJECTS an omitted intermediate batch (broken lineage)', () => {
        const { transitions, head } = buildChain();
        const missingMid = transitions.filter(t => t.counter !== 2);
        expect(() => hydrate(missingMid, head)).toThrow(/no transition produces root/);
    });

    it('REJECTS a head root that no transition produces', () => {
        const { transitions } = buildChain();
        expect(() => hydrate(transitions, 'ab'.repeat(32))).toThrow(/no transition produces root/);
    });

    it('REJECTS a batch whose blob was corrupted so it no longer replays to its target', () => {
        const { transitions, head } = buildChain();
        // Corrupt the ct of batch 3's leaf but keep its declared target_root — the forward
        // replay will now compute a different root than target_root.
        const corrupt = transitions.map(t =>
            t.counter === 3 ? { ...t, leaves: t.leaves.map(lf => ({ ...lf, ct: 'dead' })) } : t,
        );
        expect(() => hydrate(corrupt, head)).toThrow(/replays to .* != target/);
    });

    it('applies a MULTI-leaf batch as one transition (batch-update)', () => {
        // One committed batch inserts A, B, C together (n=3) at counter 1.
        const A = blob('a1', 'aa11');
        const B = blob('b2', 'bb22');
        const C = blob('c3', 'cc33');
        const toLeaf = (x: BlobRow) => ({
            entryKey: x.entryKeyHex,
            entryType: 'address',
            nonce: x.nonceHex,
            tag: x.tagHex,
            ct: x.ctHex,
        });
        const R1 = rootOf([A, B, C]);
        const batch: WardTransition = {
            counter: 1,
            prevRoot: '',
            targetRoot: R1,
            leaves: [toLeaf(A), toLeaf(B), toLeaf(C)],
            authCommit: 'ab'.repeat(32), // opaque to the host — stored, not verified here
            headMac: 'cd'.repeat(32),
        };
        const res = hydrate([batch], R1);
        expect(res.root).toBe(R1);
        expect(res.verifiedCounter).toBe(1);
        expect(res.blobs.map(b => b.entryKeyHex).sort()).toEqual(
            [A, B, C].map(x => x.entryKeyHex).sort(),
        );
        // Dropping any single leaf from the batch breaks the per-batch root check.
        const missingLeaf: WardTransition = { ...batch, leaves: [toLeaf(A), toLeaf(B)] };
        expect(() => hydrate([missingLeaf], R1)).toThrow(/replays to .* != target/);
    });
});

describe('resolveHead — verifies via hydrate when a transition log exists', () => {
    const WARD = 'ab'.repeat(16);

    it('hydrates and matches the stored head root', async () => {
        const { transitions, head } = buildChain();
        const db = new InMemoryWardDb();
        for (const t of transitions) db.appendTransition(WARD, t);
        db.setTreeState(WARD, { root: head, counter: 4 });
        const res = await resolveHead(db, WARD);
        expect(res.hydrated?.root).toBe(head);
        expect(res.hydrated?.verifiedCounter).toBe(4);
    });

    it('propagates a hydrate rejection when the log is torn', async () => {
        const { transitions, head } = buildChain();
        const db = new InMemoryWardDb();
        // Omit the middle batch → torn lineage.
        for (const t of transitions.filter(tr => tr.counter !== 2)) db.appendTransition(WARD, t);
        db.setTreeState(WARD, { root: head, counter: 4 });
        await expect(resolveHead(db, WARD)).rejects.toThrow(/no transition produces root/);
    });
});
