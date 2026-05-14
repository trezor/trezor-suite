import '@suite-common/test-utils/src/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from '../26.5.0.1';

const DB_NAME = 'suite-idb-test-26.5.0.1';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 26.5.0.1', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('migrates addressDisplayType from suiteSettings to walletSettings', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('suiteSettings');
                db.createObjectStore('walletSettings');
            },
        });
        await db.put(
            'suiteSettings',
            { settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL } },
            'suite',
        );
        await db.put('walletSettings', {}, 'wallet');
        db.close();

        const migratedDb = await runMigration();

        const wallet = await migratedDb.get('walletSettings', 'wallet');
        expect(wallet?.addressDisplayType).toBe(AddressDisplayOptions.ORIGINAL);

        migratedDb.close();
    });

    test('defaults to chunked if addressDisplayType is missing from suiteSettings', async () => {
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
        expect(wallet?.addressDisplayType).toBe(AddressDisplayOptions.CHUNKED);

        migratedDb.close();
    });

    test('defaults to chunked if suiteSettings store is missing', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('walletSettings');
            },
        });
        await db.put('walletSettings', {}, 'wallet');
        db.close();

        const migratedDb = await runMigration();

        const wallet = await migratedDb.get('walletSettings', 'wallet');
        expect(wallet?.addressDisplayType).toBe(AddressDisplayOptions.CHUNKED);

        migratedDb.close();
    });
});
