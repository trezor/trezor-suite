import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from './26.10.0.1';

const DB_NAME = 'suite-idb-test-26.10.0.1';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

const createDBWithSuiteSettings = async (suiteSettings?: Record<string, unknown>) => {
    const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('suiteSettings');
        },
    });

    if (suiteSettings) {
        // @ts-expect-error The old shape of the stored settings is intentionally invalid now.
        await db.put('suiteSettings', suiteSettings, 'suite');
    }

    db.close();
};

describe('migration 26.10.0.1', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('drops the removed banner flag and keeps the rest', async () => {
        await createDBWithSuiteSettings({
            flags: {
                showStablecoinYieldDashboardPromoBanner: true,
                showDefiYieldDashboardPromoBanner: false,
            },
        });

        const db = await runMigration();
        const suiteSettings = await db.get('suiteSettings', 'suite');
        db.close();

        expect(suiteSettings?.flags).toEqual({ showDefiYieldDashboardPromoBanner: false });
    });

    test('does nothing without a stored record', async () => {
        await createDBWithSuiteSettings();

        const db = await runMigration();
        const suiteSettings = await db.get('suiteSettings', 'suite');
        db.close();

        expect(suiteSettings).toBeUndefined();
    });
});
