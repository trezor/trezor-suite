import { type IDBPDatabase, openDB } from 'idb';

import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';
import type { RuntimeNetworkPreferences } from '@trezor/network-module-suite-common-types';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from './26.11.0.1';

const DB_NAME = 'suite-idb-test-26.11.0.1';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

const createDB = async ({ withPreferences }: { withPreferences: boolean }) => {
    const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('walletSettings');
            if (withPreferences) {
                upgradeDb.createObjectStore('runtimeNetworkPreferences');
            }
        },
    });

    db.close();
};

describe('migration 26.11.0.1', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    test('adds the runtime network preferences store', async () => {
        await createDB({ withPreferences: false });

        const db = await runMigration();
        const hasStore = db.objectStoreNames.contains('runtimeNetworkPreferences');
        db.close();

        expect(hasStore).toBe(true);
    });

    test('keeps an existing store and its data untouched', async () => {
        await createDB({ withPreferences: true });

        const preferences: RuntimeNetworkPreferences = { userDefinitions: [], enabled: [] };
        const seeded = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION);
        await seeded.put('runtimeNetworkPreferences', preferences, 'preferences');
        seeded.close();

        const db = await runMigration();
        const entry = await db.get('runtimeNetworkPreferences', 'preferences');
        db.close();

        expect(entry).toEqual(preferences);
    });
});
