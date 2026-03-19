import '@suite-common/test-utils/src/globalOverrides';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';
import { asAccountDescriptor } from '@suite-common/wallet-types';
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

const getAccountStoreKey = (account: {
    descriptor: string;
    symbol: string;
    deviceState: string;
}): [string, string, string] => [account.descriptor, account.symbol, account.deviceState];

describe('migration 26.4.0.1', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('reclassifies old Sepolia and Hoodi normal accounts to legacy', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                const accountsStore = db.createObjectStore('accounts', {
                    keyPath: ['descriptor', 'symbol', 'deviceState'],
                });

                accountsStore.createIndex('deviceState', 'deviceState', { unique: false });
            },
        });

        const oldTsepAccount = mockWalletAccount(
            {
                symbol: 'tsep',
                descriptor: asAccountDescriptor('old-tsep-account'),
                path: "m/44'/1'/0'/0/0",
                accountType: 'normal',
            },
            networkSpecificDefaultEthereum,
        );
        const oldThodAccount = mockWalletAccount(
            {
                symbol: 'thod',
                descriptor: asAccountDescriptor('old-thod-account'),
                path: "m/44'/1'/0'/0/1",
                accountType: 'normal',
            },
            networkSpecificDefaultEthereum,
        );
        const newTsepAccount = mockWalletAccount(
            {
                symbol: 'tsep',
                descriptor: asAccountDescriptor('new-tsep-account'),
                path: "m/44'/60'/0'/0/0",
                accountType: 'normal',
            },
            networkSpecificDefaultEthereum,
        );
        const existingLegacyTsepAccount = mockWalletAccount(
            {
                symbol: 'tsep',
                descriptor: asAccountDescriptor('legacy-tsep-account'),
                path: "m/44'/1'/0'/0/2",
                accountType: 'legacy',
            },
            networkSpecificDefaultEthereum,
        );
        const ethAccount = mockWalletAccount(
            {
                symbol: 'eth',
                descriptor: asAccountDescriptor('eth-account'),
                path: "m/44'/1'/0'/0/0",
                accountType: 'normal',
            },
            networkSpecificDefaultEthereum,
        );

        await db.put('accounts', oldTsepAccount);
        await db.put('accounts', oldThodAccount);
        await db.put('accounts', newTsepAccount);
        await db.put('accounts', existingLegacyTsepAccount);
        await db.put('accounts', ethAccount);
        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('accounts', getAccountStoreKey(oldTsepAccount))).toMatchObject({
            accountType: 'legacy',
            path: "m/44'/1'/0'/0/0",
        });
        expect(await migratedDb.get('accounts', getAccountStoreKey(oldThodAccount))).toMatchObject({
            accountType: 'legacy',
            path: "m/44'/1'/0'/0/1",
        });
        expect(await migratedDb.get('accounts', getAccountStoreKey(newTsepAccount))).toMatchObject({
            accountType: 'normal',
            path: "m/44'/60'/0'/0/0",
        });
        expect(
            await migratedDb.get('accounts', getAccountStoreKey(existingLegacyTsepAccount)),
        ).toMatchObject({ accountType: 'legacy', path: "m/44'/1'/0'/0/2" });
        expect(await migratedDb.get('accounts', getAccountStoreKey(ethAccount))).toMatchObject({
            accountType: 'normal',
            path: "m/44'/1'/0'/0/0",
        });

        migratedDb.close();
    });
});
