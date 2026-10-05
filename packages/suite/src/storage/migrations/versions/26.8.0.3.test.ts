import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type StaticSessionId } from '@trezor/connect';

import {
    type ContactsWalletState,
    createEmptyWalletState,
} from 'src/reducers/suite/contactsReducer';
import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from './26.8.0.3';

const DB_NAME = 'suite-idb-test-26.8.0.3';
const INITIAL_VERSION = 1;

const DEVICE_STATE = 'walletA@deviceA:1' as StaticSessionId;
const CONTACT_NPUB = 'bb'.repeat(32);

const wallet: ContactsWalletState = {
    ...createEmptyWalletState(),
    identityNpub: 'aa'.repeat(32),
    contacts: {
        [CONTACT_NPUB]: { npub: CONTACT_NPUB, label: 'Satoshi', addedAt: 1, isVerified: true },
    },
};

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 26.8.0.3', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('creates the contacts and contacts device authority stores', async () => {
        const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
            upgrade(upgradeDb) {
                upgradeDb.createObjectStore('walletSettings');
            },
        });
        db.close();

        const migratedDb = await runMigration();

        expect(migratedDb.objectStoreNames.contains('contacts')).toBe(true);
        expect(migratedDb.objectStoreNames.contains('contactsDeviceAuthority')).toBe(true);

        await migratedDb.put('contacts', wallet, DEVICE_STATE);
        await migratedDb.put(
            'contactsDeviceAuthority',
            { anchoredNpubs: { [CONTACT_NPUB]: { label: 'Satoshi', anchoredAt: 1 } } },
            DEVICE_STATE,
        );

        expect(await migratedDb.get('contacts', DEVICE_STATE)).toEqual(wallet);
        expect(await migratedDb.get('contactsDeviceAuthority', DEVICE_STATE)).toEqual({
            anchoredNpubs: { [CONTACT_NPUB]: { label: 'Satoshi', anchoredAt: 1 } },
        });

        migratedDb.close();
    });

    test('keeps stores that already exist together with their data', async () => {
        const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
            upgrade(upgradeDb) {
                upgradeDb.createObjectStore('contacts');
                upgradeDb.createObjectStore('contactsDeviceAuthority');
            },
        });
        await db.put('contacts', wallet, DEVICE_STATE);
        db.close();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('contacts', DEVICE_STATE)).toEqual(wallet);
        expect(migratedDb.objectStoreNames.contains('contactsDeviceAuthority')).toBe(true);

        migratedDb.close();
    });
});
