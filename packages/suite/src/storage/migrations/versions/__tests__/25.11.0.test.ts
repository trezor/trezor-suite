import '@suite-common/test-utils/src/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from '../../../definitions';
import migration from '../25.11.0';

const DB_NAME = 'suite-idb-test-25.11.0';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 25.11.0', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('migrates autoEject and autoForget from suiteSettings to walletSettings', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('suiteSettings');
                db.createObjectStore('walletSettings');
            },
        });
        await db.put('suiteSettings', { settings: { autoEject: true } }, 'suite');
        await db.put('walletSettings', { isAutoEjectEnabled: false }, 'wallet');
        db.close();

        const migratedDb = await runMigration();

        const wallet = await migratedDb.get('walletSettings', 'wallet');
        expect(wallet).toBeDefined();
        expect(wallet?.isAutoEjectEnabled).toBe(true);

        migratedDb.close();
    });

    test('prefills defaults into walletSettings if original values are missing', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('suiteSettings');
                db.createObjectStore('walletSettings');
            },
        });
        await db.put('suiteSettings', { settings: {} }, 'suite');
        await db.put('walletSettings', {}, 'wallet');
        db.close();

        const migratedDb = await runMigration();

        const wallet = await migratedDb.get('walletSettings', 'wallet');
        expect(wallet).toBeDefined();
        expect(wallet?.isAutoEjectEnabled).toBe(false);

        migratedDb.close();
    });

    test('prefills defaults into walletSettings if suiteSettings store is missing', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('walletSettings');
            },
        });
        await db.put('walletSettings', {}, 'wallet');
        db.close();

        const migratedDb = await runMigration();

        const wallet = await migratedDb.get('walletSettings', 'wallet');
        expect(wallet).toBeDefined();
        expect(wallet?.isAutoEjectEnabled).toBe(false);

        migratedDb.close();
    });
});
