import { openDB } from 'idb';

import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from './utils';

const DB_NAME = 'suite-idb-test-migration-utils';

const runUpdateAll = (store: 'devices' | 'txs', update: (old: never) => never) =>
    openDB<SuiteDBSchema>(DB_NAME, 2, {
        async upgrade(_db, _oldVersion, _newVersion, tx) {
            await updateAll(tx, store, update);
        },
    });

// Only `devices` exists — `txs` stands in for a store a failed upgrade never created.
const createDatabase = async () => {
    const db = await openDB<SuiteDBSchema>(DB_NAME, 1, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('devices');
        },
    });
    await db.put('devices', { label: 'before' } as never, 'device-1' as never);
    db.close();
};

describe('updateAll', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    it('skips a store that a failed upgrade never created', async () => {
        await createDatabase();

        const update = jest.fn();
        const db = await runUpdateAll('txs', update as never);
        db.close();

        expect(update).not.toHaveBeenCalled();
    });

    it('still transforms a store that does exist', async () => {
        await createDatabase();

        const db = await runUpdateAll('devices', (() => ({ label: 'after' })) as never);
        const device = await db.get('devices', 'device-1' as never);
        db.close();

        expect(device).toEqual({ label: 'after' });
    });
});
