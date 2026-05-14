import '@suite-common/test-utils/src/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from '../25.10.0';

const DB_NAME = 'suite-idb-test-25.10.0';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 25.10.0', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('migrates devices with errored entropy check to persistentDeviceData', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('security');
            },
        });
        const securityData = { devicesWithFailedEntropyCheck: ['device-id-1', 'device-id-2'] };
        await db.put('security', securityData, 'security');
        db.close();

        const migratedDb = await runMigration();

        const persistentData = await migratedDb.get('persistentDeviceData', 'persistentDeviceData');
        expect(Array.isArray(persistentData)).toBe(true);
        expect(persistentData).toHaveLength(2);
        expect(persistentData).toMatchObject([
            { device_id: 'device-id-1', lastEntropyCheckResult: { success: false } },
            { device_id: 'device-id-2', lastEntropyCheckResult: { success: false } },
        ]);

        // @ts-expect-error security no longer exists
        expect(migratedDb.objectStoreNames.contains('security')).toBe(false);

        migratedDb.close();
    });

    test('does nothing if security store is missing', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION);
        db.close();

        const migratedDb = await runMigration();

        const persistentData = await migratedDb.get('persistentDeviceData', 'persistentDeviceData');
        expect(persistentData).toBeUndefined();

        migratedDb.close();
    });
});
