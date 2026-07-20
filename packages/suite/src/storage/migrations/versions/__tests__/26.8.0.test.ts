import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type AccountKey } from '@suite-common/wallet-types';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from '../26.8.0';

const DB_NAME = 'suite-idb-test-26.8.0';
const INITIAL_VERSION = 1;

const VAULT_CONTRACT = '0xBeEF69b8FeA9a16Fb98a661860F6D78d94E1B000';
const USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

const createSeedDb = async () => {
    const db = await openDB(DB_NAME, INITIAL_VERSION, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('accounts');
            upgradeDb.createObjectStore('historicRates');
            upgradeDb.createObjectStore('receive');
        },
    });

    await db.put(
        'accounts',
        {
            key: 'account-1',
            symbol: 'eth',
            tokens: [
                { contract: USDT_CONTRACT, decimals: 6 },
                { contract: VAULT_CONTRACT, decimals: 6, protocols: ['erc4626'] },
            ],
        },
        'account-1',
    );

    return db;
};

describe('migration 26.8.0', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('removes historic rates of ERC4626 tokens and keeps the rest', async () => {
        const db = await createSeedDb();
        await db.put(
            'historicRates',
            {
                'eth-usd': { 1700000000: 2000 },
                [`eth-${USDT_CONTRACT}-usd`]: { 1700000000: 1 },
                [`eth-${VAULT_CONTRACT.toLowerCase()}-usd`]: { 1700000000: 1.05 },
                [`eth-${VAULT_CONTRACT}-eur`]: { 1700000000: 0.95 },
            },
            'account-1',
        );
        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('historicRates', 'account-1')).toEqual({
            'eth-usd': { 1700000000: 2000 },
            [`eth-${USDT_CONTRACT}-usd`]: { 1700000000: 1 },
        });

        migratedDb.close();
    });

    test('renames receive revealed addresses to touched addresses', async () => {
        const db = await createSeedDb();
        const accountKey = 'btc-account-key' as AccountKey;

        await db.put(
            'receive',
            {
                revealedAddresses: [
                    {
                        path: 'btc-path',
                        address: 'btc-address',
                        isVerified: true,
                    },
                ],
                currentFreshAddress: {
                    path: 'fresh-btc-path',
                    address: 'fresh-btc-address',
                },
            },
            accountKey,
        );
        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('receive', accountKey)).toEqual({
            touchedAddresses: [
                {
                    path: 'btc-path',
                    address: 'btc-address',
                },
            ],
            currentFreshAddress: {
                path: 'fresh-btc-path',
                address: 'fresh-btc-address',
            },
        });

        migratedDb.close();
    });
});
