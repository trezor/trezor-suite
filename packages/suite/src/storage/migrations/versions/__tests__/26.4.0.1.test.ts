import '@suite-common/test-utils/src/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from '../../../definitions';
import migration from '../26.4.0.1';

const DB_NAME = 'suite-idb-test-26.4.0.1';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 26.4.0.1', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('adds descriptor with apiType "usb" when descriptor is missing', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('devices');
            },
        });
        await db.put('devices', { id: 'device-1' }, 'device-1');
        db.close();

        const migratedDb = await runMigration();

        const device = await migratedDb.get('devices', 'device-1');
        expect(device).toBeDefined();
        expect(device?.descriptor).toEqual({ apiType: 'usb' });

        migratedDb.close();
    });

    test('adds apiType "usb" when descriptor exists but apiType is missing', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('devices');
            },
        });
        await db.put('devices', { id: 'device-1', descriptor: { id: 'some-id' } }, 'device-1');
        db.close();

        const migratedDb = await runMigration();

        const device = await migratedDb.get('devices', 'device-1');
        expect(device).toBeDefined();
        expect(device?.descriptor).toEqual({ id: 'some-id', apiType: 'usb' });

        migratedDb.close();
    });

    test('does not modify device when descriptor.apiType is already set', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('devices');
            },
        });
        const originalDevice = {
            id: 'device-1',
            descriptor: { apiType: 'bluetooth', id: 'bt-id' },
        };
        await db.put('devices', originalDevice, 'device-1');
        db.close();

        const migratedDb = await runMigration();

        const device = await migratedDb.get('devices', 'device-1');
        expect(device).toBeDefined();
        expect(device?.descriptor).toEqual({ apiType: 'bluetooth', id: 'bt-id' });

        migratedDb.close();
    });

    test('handles empty devices store without error', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('devices');
            },
        });
        db.close();

        const migratedDb = await runMigration();

        // Just verify the migration completed without throwing
        expect(migratedDb.objectStoreNames.contains('devices')).toBe(true);

        migratedDb.close();
    });
});
