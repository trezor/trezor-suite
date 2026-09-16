import { type IDBPDatabase, openDB } from 'idb';

import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from './26.10.0.2';

const DB_NAME = 'suite-idb-test-26.10.0.2';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

const createDB = async ({ withTokenManagement }: { withTokenManagement: boolean }) => {
    const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('walletSettings');
            if (withTokenManagement) {
                upgradeDb.createObjectStore('tokenManagement');
            }
        },
    });

    db.close();
};

describe('migration 26.10.0.2', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    test('recreates the store when a failed upgrade left it missing', async () => {
        await createDB({ withTokenManagement: false });

        const db = await runMigration();
        const hasStore = db.objectStoreNames.contains('tokenManagement');
        db.close();

        expect(hasStore).toBe(true);
    });

    test('keeps the existing store and its data untouched', async () => {
        await createDB({ withTokenManagement: true });

        const seeded = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION);
        await seeded.put('tokenManagement', { hide: [], show: [] } as never, 'eth-coin-show');
        seeded.close();

        const db = await runMigration();
        const entry = await db.get('tokenManagement', 'eth-coin-show');
        db.close();

        expect(entry).toEqual({ hide: [], show: [] });
    });
});
