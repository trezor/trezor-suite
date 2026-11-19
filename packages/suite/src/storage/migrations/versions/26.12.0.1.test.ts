import { type IDBPDatabase, openDB } from 'idb';

import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { type SuiteDBSchema } from '#src/storage/definitions';

import migration from './26.12.0.1';

const DB_NAME = 'suite-idb-test-26.12.0';
const INITIAL_VERSION = 1;
const KEY = 'persistentDeviceData';

const bluetoothDescriptor = { apiType: 'bluetooth', id: 'bt-id' };

type SeedData = {
    persistentDeviceData?: object[];
    devices?: Record<string, object>;
};

const runMigration = async (dbName: string, { persistentDeviceData, devices }: SeedData = {}) => {
    const initialDb = await openDB(dbName, INITIAL_VERSION, {
        upgrade(db) {
            db.createObjectStore(KEY);
            db.createObjectStore('devices');
        },
    });

    if (persistentDeviceData) {
        await initialDb.put(KEY, persistentDeviceData, KEY);
    }

    for (const [storageKey, device] of Object.entries(devices ?? {})) {
        await initialDb.put('devices', device, storageKey);
    }

    initialDb.close();

    return openDB<SuiteDBSchema>(dbName, INITIAL_VERSION + 1, {
        async upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            await migration.migrate(db, tx);
        },
    });
};

describe('migration 26.12.0.1', () => {
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

    describe('devices key', () => {
        test('adds a key to a remembered device without one', async () => {
            const db = await runMigration(`${DB_NAME}-key`, {
                devices: { 'device-1': { id: 'device-1' } },
            });

            expect(await db.get('devices', 'device-1')).toEqual({
                id: 'device-1',
                key: expect.any(String),
            });
        });

        test('adds a different key to each remembered device', async () => {
            const db = await runMigration(`${DB_NAME}-keys`, {
                devices: { 'device-1': { id: 'device-1' }, 'device-2': { id: 'device-2' } },
            });

            const firstDevice = await db.get('devices', 'device-1');
            const secondDevice = await db.get('devices', 'device-2');

            expect(firstDevice?.key).toEqual(expect.any(String));
            expect(secondDevice?.key).toEqual(expect.any(String));
            expect(firstDevice?.key).not.toEqual(secondDevice?.key);
        });

        test('keeps the key of a device that already has one', async () => {
            const db = await runMigration(`${DB_NAME}-existing-key`, {
                devices: { 'device-1': { id: 'device-1', key: 'existing-key' } },
            });

            expect(await db.get('devices', 'device-1')).toEqual({
                id: 'device-1',
                key: 'existing-key',
            });
        });

        test('adds keys even when there is no persistent device data', async () => {
            const db = await runMigration(`${DB_NAME}-key-only`, {
                devices: { 'device-1': { id: 'device-1' } },
            });

            expect(await db.get(KEY, KEY)).toBeUndefined();
            expect((await db.get('devices', 'device-1'))?.key).toEqual(expect.any(String));
        });
    });
});
