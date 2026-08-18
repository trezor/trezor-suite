import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from './26.9.0';

const DB_NAME = 'suite-idb-test-26.9.0';

describe('migration 26.9.0', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('creates the graph fiat cache store', async () => {
        const db = await openDB(DB_NAME, 2, {
            upgrade(upgradeDb: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
                migration.migrate(upgradeDb, tx);
            },
        });

        expect(db.objectStoreNames.contains('graphFiatRates')).toBe(true);

        db.close();
    });

    test('preserves a graph fiat cache store created by the original feature branch', async () => {
        const legacyDb = await openDB(DB_NAME, 1, {
            upgrade(upgradeDb: IDBPDatabase<SuiteDBSchema>) {
                upgradeDb.createObjectStore('graphFiatRates');
            },
        });
        legacyDb.close();

        const db = await openDB(DB_NAME, 2, {
            upgrade(upgradeDb: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
                migration.migrate(upgradeDb, tx);
            },
        });

        expect(db.objectStoreNames.contains('graphFiatRates')).toBe(true);

        db.close();
    });
});
