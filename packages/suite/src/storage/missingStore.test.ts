import { openDB } from 'idb';

import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';
import SuiteDB from '@trezor/suite-storage';

const DB_NAME = 'suite-idb-missing-store-test';

// A database left by a failed upgrade: the version claims everything is migrated, but stores that
// the skipped migrations should have created are absent. Startup reads them by name, so an
// unguarded read would throw NotFoundError and Suite would show the corrupted-database screen.
const createDatabaseWithoutStores = async () => {
    const db = await openDB(DB_NAME, 1, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('present');
        },
    });

    db.close();
};

const openSuiteDb = () => new SuiteDB(DB_NAME, 1, () => Promise.resolve(), jest.fn());

describe('reading a store that a failed migration never created', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    it('reads as undefined instead of throwing', async () => {
        await createDatabaseWithoutStores();

        await expect(openSuiteDb().getItemByPK('missing' as never, 'key' as never)).resolves.toBe(
            undefined,
        );
    });

    it('reads as an empty collection instead of throwing', async () => {
        await createDatabaseWithoutStores();

        await expect(openSuiteDb().getItemsWithKeys('missing' as never)).resolves.toEqual([]);
    });

    it('still reads a store that does exist', async () => {
        await createDatabaseWithoutStores();

        const db = openSuiteDb();
        await db.addItem('present' as never, { a: 1 } as never, 'key' as never);

        await expect(db.getItemByPK('present' as never, 'key' as never)).resolves.toEqual({ a: 1 });
    });
});
