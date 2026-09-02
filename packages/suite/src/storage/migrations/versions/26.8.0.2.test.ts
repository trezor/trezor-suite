import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from './26.8.0.2';

const DB_NAME = 'suite-idb-test-26.8.0.2';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

const createDBWithWalletSettings = async (walletSettings?: Record<string, unknown>) => {
    const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('walletSettings');
        },
    });

    if (walletSettings) {
        // @ts-expect-error The old shape of the stored settings is intentionally invalid now.
        await db.put('walletSettings', walletSettings, 'wallet');
    }

    db.close();
};

describe('migration 26.8.0.2', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('converts stored `true` to a record of all enabled networks', async () => {
        await createDBWithWalletSettings({
            enabledNetworks: ['btc', 'eth', 'op'],
            hideSuspiciousTransactions: true,
        });

        const migratedDb = await runMigration();
        const settings = await migratedDb.get('walletSettings', 'wallet');

        expect(settings).toEqual({
            enabledNetworks: ['btc', 'eth', 'op'],
            hideSuspiciousTransactions: { btc: true, eth: true, op: true },
        });

        migratedDb.close();
    });

    test('converts stored `false` to an empty record', async () => {
        await createDBWithWalletSettings({
            enabledNetworks: ['btc', 'eth'],
            hideSuspiciousTransactions: false,
        });

        const migratedDb = await runMigration();
        const settings = await migratedDb.get('walletSettings', 'wallet');

        expect(settings).toEqual({
            enabledNetworks: ['btc', 'eth'],
            hideSuspiciousTransactions: {},
        });

        migratedDb.close();
    });

    test('leaves settings without the old boolean untouched', async () => {
        await createDBWithWalletSettings({
            enabledNetworks: ['btc'],
        });

        const migratedDb = await runMigration();
        const settings = await migratedDb.get('walletSettings', 'wallet');

        expect(settings).toEqual({ enabledNetworks: ['btc'] });

        migratedDb.close();
    });

    test('does nothing when no wallet settings are stored', async () => {
        await createDBWithWalletSettings();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('walletSettings', 'wallet')).toBeUndefined();

        migratedDb.close();
    });
});
