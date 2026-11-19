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

    it('keeps an append-only transition log per wallet, ascending by counter', async () => {
        await storage.appendTransition(WARD_ID, {
            counter: 2,
            prevRoot: 'aa',
            targetRoot: 'cc',
            leaves: [leaf('11'.repeat(32))],
        });
        await storage.appendTransition(WARD_ID, {
            counter: 1,
            prevRoot: '',
            targetRoot: 'aa',
            leaves: [],
        });
        expect(storage.getTransitions(WARD_ID).map(t => t.counter)).toEqual([1, 2]);
        expect(storage.getTransitions(WARD_ID)[1]?.leaves).toEqual([leaf('11'.repeat(32))]);
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
