import { commitLocal, loadEntry, loadHead, prepareChange } from '../app';
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

        const update = prepareChange(
            await loadEntry(db, WARD_ID, APP, 'bc1qalice', NET),
            NET,
            { label: 'alice2' },
            1,
        );
        expect(update.op).toBe('update');

        const insert = prepareChange(null, NET, { label: 'carol' }, 1);
        expect(insert.op).toBe('insert');
    });

    it('newValueHex is counter-free (strict model): same metadata → same value regardless of counter', () => {
        const md: WardLabel = { label: 'x' };
        const a = prepareChange(null, NET, md, 0); // newEntry.counter = 1
        const b = prepareChange(null, NET, md, 41); // newEntry.counter = 42
        expect(a.newEntry.counter).not.toBe(b.newEntry.counter);
        expect(a.newValueHex).toBe(b.newValueHex); // counter is NOT in the value bytes
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

    it('commitLocal with deleted:true REMOVES the row (full delete, not empty update)', async () => {
        const db = seed();
        // A WARD delete removes the leaf from the trie, so the host record must go too.
        // Keeping it (an "update to empty") would leave loadEntry answering with stale
        // metadata for an entry the device can prove absent, and would feed a blob-less
        // row to blobRows.
        await commitLocal(db, WARD_ID, APP, 'bc1qalice', NET, {}, { counter: 8, deleted: true });

        expect(await loadEntry(db, WARD_ID, APP, 'bc1qalice', NET)).toBeNull();
        // the row is gone from the row set entirely, not merely blob-less
        const rows = await db.getAllEntries(WARD_ID);
        expect(rows.map(r => r.address)).toEqual(['bc1qbob']);
    });

    it('prepareChange: metadata:{} is an UPDATE, only delete:true is a delete', async () => {
        // The tombstone bug: `metadata: {}` serializes to `${networkSymbol}:{}` — e.g.
        // "TEST:{}", 7 non-empty bytes — so the device UPDATES the leaf and the entry
        // survives. An empty new_value is the device's delete sentinel, and only an
        // explicit delete produces one.
        const existing = await loadEntry(seed(), WARD_ID, APP, 'bc1qalice', NET);

        const emptyMeta = prepareChange(existing, NET, {}, 1);
        expect(emptyMeta.op).toBe('update');
        expect(emptyMeta.newValueHex).not.toBe('');
        expect(Buffer.from(emptyMeta.newValueHex, 'hex').toString()).toBe('btc:{}');

        const removed = prepareChange(existing, NET, {}, 1, true);
        expect(removed.op).toBe('delete');
        expect(removed.newValueHex).toBe('');
    });

    it('commitLocal advances tree_state even when a delete EMPTIES the tree', async () => {
        // The device reports no root at all when the tree becomes empty. Skipping the
        // checkpoint write would pin tree_state to the pre-delete root while the device
        // moved on -- a silent desync that breaks every later proof. '' is the host's
        // canonical empty root (computeRootFromBlobs([]) === '').
        const db = seed();
        await db.setTreeState(WARD_ID, { root: 'oldroot', counter: 4, mac: 'oldmac' });

        await commitLocal(
            db,
            WARD_ID,
            APP,
            'bc1qalice',
            NET,
            {},
            {
                counter: 5,
                deleted: true,
                // no root / rootMac: the tree is now empty
            },
        );

        expect(await db.getTreeState(WARD_ID)).toEqual({ root: '', counter: 5 });
        expect(await loadEntry(db, WARD_ID, APP, 'bc1qalice', NET)).toBeNull();
    });

    // TODO(handoff, gap 4): add API-boundary cold-start / inconsistent-head cases
    // (empty tree init, "root present but mac absent", "non-empty root with empty-tree
    // attestation"). These currently fail LATE in firmware reconcile — see gaps.md #3/#4.
    it.todo('rejects inconsistent (WM_HEAD, DB_HEAD) combinations early (gap 3/4)');
});
