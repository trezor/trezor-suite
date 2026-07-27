import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from '../26.6.0.1';

const DB_NAME = 'suite-idb-test-26.6.0.1';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

const accountsPk = (account: Account): [string, string, string] => [
    account.descriptor,
    account.symbol,
    account.deviceState,
];

describe('migration 26.6.0.1', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('delete sepolia and keep mainnet', async () => {
        const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                const accountsStore = db.createObjectStore('accounts', {
                    keyPath: ['descriptor', 'symbol', 'deviceState'],
                });
                accountsStore.createIndex('deviceState', 'deviceState', { unique: false });
            },
        });

        const sep1 = mockWalletAccount({ symbol: 'tsep', accountType: 'normal' });
        const eth1 = mockWalletAccount({ symbol: 'eth', accountType: 'normal' });

        await db.put('accounts', sep1);
        await db.put('accounts', eth1);

        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('accounts', accountsPk(sep1))).toBeUndefined();
        expect(await migratedDb.get('accounts', accountsPk(eth1))).toEqual(eth1);

        migratedDb.close();
    });
});
