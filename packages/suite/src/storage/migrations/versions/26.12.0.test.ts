import { type IDBPDatabase, openDB } from 'idb';

import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { type SuiteDBSchema } from '#src/storage/definitions';

import migration from './26.12.0';

const DB_NAME = 'suite-idb-test-26.12.0';
const INITIAL_VERSION = 1;
const KEY = 'persistentDeviceData';

const bluetoothDescriptor = { apiType: 'bluetooth', id: 'bt-id' };

type SeedData = {
    persistentDeviceData?: object[];
};

const runMigration = async (dbName: string, { persistentDeviceData }: SeedData = {}) => {
    const initialDb = await openDB(dbName, INITIAL_VERSION, {
        upgrade(db) {
            db.createObjectStore(KEY);
        },
    });
    if (persistentDeviceData) {
        await initialDb.put(KEY, persistentDeviceData, KEY);
    }
    initialDb.close();

    return openDB<SuiteDBSchema>(dbName, INITIAL_VERSION + 1, {
        async upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            await migration.migrate(db, tx);
        },
    });
};

describe('migration 26.12.0', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    describe('persistentDeviceData descriptors', () => {
        test('moves the Bluetooth descriptor to the descriptors array', async () => {
            const db = await runMigration(`${DB_NAME}-bluetooth`, {
                persistentDeviceData: [{ device_id: 'device-1', descriptor: bluetoothDescriptor }],
            });

            expect(await db.get(KEY, KEY)).toEqual([
                { device_id: 'device-1', descriptors: [bluetoothDescriptor] },
            ]);
        });

        test('sets empty descriptors for entries without a descriptor', async () => {
            const db = await runMigration(`${DB_NAME}-empty`, {
                persistentDeviceData: [{ device_id: 'device-1' }],
            });

            expect(await db.get(KEY, KEY)).toEqual([{ device_id: 'device-1', descriptors: [] }]);
        });

        test('keeps descriptors that are already migrated', async () => {
            const db = await runMigration(`${DB_NAME}-migrated`, {
                persistentDeviceData: [
                    { device_id: 'device-1', descriptors: [bluetoothDescriptor] },
                ],
            });

            expect(await db.get(KEY, KEY)).toEqual([
                { device_id: 'device-1', descriptors: [bluetoothDescriptor] },
            ]);
        });

        test('does nothing when there is no persistent device data', async () => {
            const db = await runMigration(`${DB_NAME}-none`);

            expect(await db.get(KEY, KEY)).toBeUndefined();
        });
    });
});
