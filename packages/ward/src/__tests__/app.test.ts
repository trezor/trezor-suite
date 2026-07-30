import { commitLocal, loadEntry, loadHead, prepareChange, proofFor } from '../app';
import { InMemoryWardDb } from '../storage';
import type { WardLabel } from '../types';

const WARD_ID = 'ab'.repeat(16); // 32-byte SLIP21 ward anchor (hex)
const APP = 'bitcoin'; // domain the entries live in
const NET = 'btc';
const seed = () => {
    const db = new InMemoryWardDb();
    db.upsert(WARD_ID, APP, 'bc1qalice', NET, { metadata: { label: 'alice' }, counter: 1 });
    db.upsert(WARD_ID, APP, 'bc1qbob', NET, { metadata: { label: 'bob' }, counter: 1 });

    return db;
};

describe('ward app layer', () => {
    it('loadHead returns rows + tree checkpoint scoped to the wardId', async () => {
        const db = seed();
        db.setTreeState(WARD_ID, { root: 'deadbeef', counter: 2 });
        const { rows, tree } = await loadHead(db, WARD_ID);
        expect(rows.map(r => r.address).sort()).toEqual(['bc1qalice', 'bc1qbob']);
        expect(rows.every(r => r.appId === APP)).toBe(true);
        expect(tree).toEqual({ root: 'deadbeef', counter: 2 });
        // A different ward sees nothing.
        expect((await loadHead(db, 'ff'.repeat(16))).rows).toHaveLength(0);
    });

    it('loadEntry resolves a present entry and null for a miss', async () => {
        const db = seed();
        expect(await loadEntry(db, WARD_ID, APP, 'bc1qalice', NET)).toEqual({
            metadata: { label: 'alice' },
            counter: 1,
        });
        expect(await loadEntry(db, WARD_ID, APP, 'bc1qnope', NET)).toBeNull();
        // Same address in a different domain is a separate (absent) entry.
        expect(await loadEntry(db, WARD_ID, 'ethereum', 'bc1qalice', NET)).toBeNull();
    });

    it('prepareChange classifies insert vs update and builds an OLD-state proof', async () => {
        const db = seed();
        const { rows } = await loadHead(db, WARD_ID);

        const update = prepareChange(
            rows,
            APP,
            await loadEntry(db, WARD_ID, APP, 'bc1qalice', NET),
            'bc1qalice',
            NET,
            { label: 'alice2' },
            1,
        );
        expect(update.op).toBe('update');
        expect(update.oldProof.kind).toBe('membership');

        const insert = prepareChange(rows, APP, null, 'bc1qcarol', NET, { label: 'carol' }, 1);
        expect(insert.op).toBe('insert');
        expect(insert.oldProof.kind).toBe('non-membership');
    });

    it('newValueHex is counter-free (strict model): same metadata → same value regardless of counter', async () => {
        const db = seed();
        const { rows } = await loadHead(db, WARD_ID);
        const md: WardLabel = { label: 'x' };
        const a = prepareChange(rows, APP, null, 'bc1qx', NET, md, 0); // newEntry.counter = 1
        const b = prepareChange(rows, APP, null, 'bc1qx', NET, md, 41); // newEntry.counter = 42
        expect(a.newEntry.counter).not.toBe(b.newEntry.counter);
        expect(a.newValueHex).toBe(b.newValueHex); // counter is NOT in the value bytes
    });

    it('proofFor returns a normalized hex package for membership and non-membership', async () => {
        const db = seed();
        const { rows } = await loadHead(db, WARD_ID);
        const m = proofFor(
            rows,
            APP,
            'bc1qalice',
            NET,
            await loadEntry(db, WARD_ID, APP, 'bc1qalice', NET),
        );
        expect(m.kind).toBe('membership');
        if (m.kind === 'membership') expect(typeof m.valueHex).toBe('string');
        const n = proofFor(rows, APP, 'bc1qnope', NET, null);
        expect(n.kind).toBe('non-membership');
        // The witness is two hashes only — never a plaintext identifier/value.
        if (n.kind === 'non-membership') {
            expect(typeof n.witnessEntryKeyHex).toBe('string');
            expect(typeof n.witnessValueHashHex).toBe('string');
        }
    });

    it('commitLocal persists the DEVICE-confirmed counter, not a host guess', async () => {
        const db = seed();
        await commitLocal(
            db,
            WARD_ID,
            APP,
            'bc1qalice',
            NET,
            { label: 'alice2' },
            {
                counter: 7,
                root: 'cafe',
                rootMac: 'f00d',
            },
        );
        expect(await loadEntry(db, WARD_ID, APP, 'bc1qalice', NET)).toEqual({
            metadata: { label: 'alice2' },
            counter: 7,
        });
        expect(await db.getTreeState(WARD_ID)).toEqual({ root: 'cafe', counter: 7, mac: 'f00d' });
    });

    // TODO(handoff, gap 4): add API-boundary cold-start / inconsistent-head cases
    // (empty tree init, "root present but mac absent", "non-empty root with empty-tree
    // attestation"). These currently fail LATE in firmware reconcile — see gaps.md #3/#4.
    it.todo('rejects inconsistent (WM_HEAD, DB_HEAD) combinations early (gap 3/4)');
});
