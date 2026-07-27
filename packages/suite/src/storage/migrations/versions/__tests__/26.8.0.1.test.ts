import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { type SuiteDBSchema } from 'src/storage/definitions';
import { serializeDevice } from 'src/utils/suite/storage';

import migration from '../26.8.0.1';

const DB_NAME = 'suite-idb-test-26.8.0.1';
const INITIAL_VERSION = 1;

const REMEMBERED_DEVICE_STATE = 'rememberedWallet@device:0' as StaticSessionId;
const UNREMEMBERED_DEVICE_STATE = 'unrememberedWallet@device:0' as StaticSessionId;
const ORPHANED_DEVICE_STATE = 'orphanedWallet@device:0' as StaticSessionId;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 26.8.0.1', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('removes receive data not belonging to a remembered device', async () => {
        const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
            upgrade(upgradeDb) {
                upgradeDb.createObjectStore('devices');
                upgradeDb.createObjectStore('accounts', {
                    keyPath: ['descriptor', 'symbol', 'deviceState'],
                });
                upgradeDb.createObjectStore('receive');
            },
        });

        const rememberedDevice = mockSuiteDevice({
            remember: true,
            state: { staticSessionId: REMEMBERED_DEVICE_STATE },
        });
        if (rememberedDevice.type !== 'acquired') {
            throw new Error('Expected an acquired device');
        }

        const rememberedAccount = mockWalletAccount({
            descriptor: asAccountDescriptor('rememberedAccount'),
            symbol: 'btc',
            deviceState: REMEMBERED_DEVICE_STATE,
        });
        const unrememberedAccount = mockWalletAccount({
            descriptor: asAccountDescriptor('unrememberedAccount'),
            symbol: 'btc',
            deviceState: UNREMEMBERED_DEVICE_STATE,
        });
        const orphanedAccount = mockWalletAccount({
            descriptor: asAccountDescriptor('orphanedAccount'),
            symbol: 'btc',
            deviceState: ORPHANED_DEVICE_STATE,
        });

        await db.put('devices', serializeDevice(rememberedDevice), REMEMBERED_DEVICE_STATE);
        await db.put('accounts', rememberedAccount);
        await db.put('accounts', unrememberedAccount);
        await db.put(
            'receive',
            { touchedAddresses: [{ path: 'remembered-path', address: 'remembered-address' }] },
            rememberedAccount.key,
        );
        await db.put(
            'receive',
            { touchedAddresses: [{ path: 'unremembered-path', address: 'unremembered-address' }] },
            unrememberedAccount.key,
        );
        await db.put(
            'receive',
            { touchedAddresses: [{ path: 'orphaned-path', address: 'orphaned-address' }] },
            orphanedAccount.key,
        );
        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('receive', rememberedAccount.key)).toEqual({
            touchedAddresses: [{ path: 'remembered-path', address: 'remembered-address' }],
        });
        expect(await migratedDb.get('receive', unrememberedAccount.key)).toBeUndefined();
        expect(await migratedDb.get('receive', orphanedAccount.key)).toBeUndefined();

        migratedDb.close();
    });
});
