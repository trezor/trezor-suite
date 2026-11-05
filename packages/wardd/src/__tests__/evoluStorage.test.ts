import { EvoluWardStorage, settled, wardOwner, wardOwnerSecret } from '../evoluStorage';

const WARD_ID = 'cd'.repeat(32);
const OTHER = 'ef'.repeat(32);
const leaf = (entryKey: string) => ({
    entryKey,
    keyType: 'address',
    identity: { encoding: 0, nonceHex: '01', tagHex: '02', bodyHex: 'ee' },
    content: { encoding: 0, nonceHex: '01', tagHex: '02', bodyHex: 'ff' },
});

describe('EvoluWardStorage', () => {
    let storage: EvoluWardStorage;

    beforeEach(async () => {
        storage = await EvoluWardStorage.open({ dataDir: null });
    });

    afterEach(() => storage.dispose());

    it('keeps entries per wallet and serves them by entry_key', async () => {
        await storage.upsert(WARD_ID, 'btc', 'bc1qa', 'btc', {
            metadata: { label: 'a' },
            counter: 1,
            blob: leaf('11'.repeat(32)),
        });
        await storage.upsert(OTHER, 'btc', 'bc1qa', 'btc', {
            metadata: { label: 'other' },
            counter: 1,
        });

        expect(storage.lookup(WARD_ID, 'btc', 'bc1qa', 'btc')).toMatchObject({
            metadata: { label: 'a' },
        });
        expect(storage.getAllEntries(WARD_ID)).toHaveLength(1);
        expect(storage.getByEntryKey(WARD_ID, '11'.repeat(32))).toMatchObject({ address: 'bc1qa' });

        await storage.upsert(WARD_ID, 'btc', 'bc1qa', 'btc', {
            metadata: { label: 'b' },
            counter: 2,
        });
        expect(storage.lookup(WARD_ID, 'btc', 'bc1qa', 'btc')).toMatchObject({ counter: 2 });

        await storage.remove(WARD_ID, 'btc', 'bc1qa', 'btc');
        expect(storage.lookup(WARD_ID, 'btc', 'bc1qa', 'btc')).toBeNull();
        expect(storage.getAllEntries(OTHER)).toHaveLength(1);
    });

    it('keeps the tree checkpoint and the transition log', async () => {
        expect(storage.getTreeState(WARD_ID)).toBeNull();
        await storage.setTreeState(WARD_ID, { root: 'aa', counter: 1, mac: 'bb' });
        await storage.setTreeState(WARD_ID, { root: 'cc', counter: 2 });
        expect(storage.getTreeState(WARD_ID)).toEqual({ root: 'cc', counter: 2 });

        await storage.appendTransition(WARD_ID, {
            counter: 2,
            prevRoot: 'aa',
            targetRoot: 'cc',
            leaves: [],
        });
        await storage.appendTransition(WARD_ID, {
            counter: 1,
            prevRoot: '',
            targetRoot: 'aa',
            leaves: [],
        });
        expect(storage.getTransitions(WARD_ID).map(t => t.counter)).toEqual([1, 2]);
        expect(storage.getTransitions(OTHER)).toEqual([]);
    });
});

describe('the WARD owner', () => {
    it("is the SLIP-21 'WARD' child of the wallet's Evolu node", () => {
        const node = '00'.repeat(32) + '11'.repeat(32);
        const a = wardOwner(wardOwnerSecret(node));
        const b = wardOwner(wardOwnerSecret(node));

        expect(a.id).toBe(b.id);
        expect(wardOwner(wardOwnerSecret('22'.repeat(64))).id).not.toBe(a.id);
        expect(() => wardOwnerSecret('00'.repeat(32))).toThrow('64-byte');
    });
});

describe('settled', () => {
    const quietStore = { get: () => null, subscribe: () => () => {} };

    it('fails a write that never completes', async () => {
        await expect(settled(() => {}, { errors: quietStore, timeoutMs: 10 })).rejects.toThrow(
            'did not settle',
        );
    });

    it('fails a write when Evolu reports an error meanwhile', async () => {
        let error: unknown = null;
        let notify = () => {};
        const store = {
            get: () => error,
            subscribe: (l: () => void) => {
                notify = l;

                return () => {};
            },
        };
        const pending = settled(() => {}, { errors: store, timeoutMs: 1000 });
        error = { type: 'SqliteError' };
        notify();

        await expect(pending).rejects.toThrow('SqliteError');
    });
});
