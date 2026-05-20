import '@suite-common/test-utils/src/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from '../26.6.0';

const DB_NAME = 'suite-idb-test-26.6.0';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 26.6.0', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('deletes all trading-* keys from formDrafts', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('formDrafts');
            },
        });
        await db.put('formDrafts', { cryptoSelect: { id: 'bitcoin' } }, 'trading-buy/account-1');
        await db.put('formDrafts', { outputs: [] }, 'trading-sell/');
        await db.put('formDrafts', { sendCryptoSelect: {} }, 'trading-exchange/');
        await db.put('formDrafts', { outputs: [] }, 'stake/account-1');
        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('formDrafts', 'trading-buy/account-1')).toBeUndefined();
        expect(await migratedDb.get('formDrafts', 'trading-sell/')).toBeUndefined();
        expect(await migratedDb.get('formDrafts', 'trading-exchange/')).toBeUndefined();
        expect(await migratedDb.get('formDrafts', 'stake/account-1')).toBeDefined();

        migratedDb.close();
    });

    test('handles empty formDrafts store without error', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('formDrafts');
            },
        });
        db.close();

        const migratedDb = await runMigration();

        expect(migratedDb.objectStoreNames.contains('formDrafts')).toBe(true);

        migratedDb.close();
    });

    test('preserves non-trading drafts untouched', async () => {
        const stakeDraft = { outputs: [{ amount: '100' }] };
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('formDrafts');
            },
        });
        await db.put('formDrafts', stakeDraft, 'stake/account-1');
        await db.put('formDrafts', { amount: '50' }, 'unstake/account-2');
        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('formDrafts', 'stake/account-1')).toEqual(stakeDraft);
        expect(await migratedDb.get('formDrafts', 'unstake/account-2')).toEqual({ amount: '50' });

        migratedDb.close();
    });
});
