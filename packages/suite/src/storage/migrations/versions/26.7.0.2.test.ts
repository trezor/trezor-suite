import '@suite-common/test-utils/globalOverrides';
import { type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type SuiteDBSchema } from 'src/storage/definitions';

import migration from './26.7.0.2';

const DB_NAME = 'suite-idb-test-26.7.0.2';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

describe('migration 26.7.0.2', () => {
    beforeEach(async () => {
        await deleteDB(DB_NAME);
    });

    test('moves testnet networks and NFT section out of experimental settings', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('suiteSettings');
            },
        });
        await db.put(
            'suiteSettings',
            {
                settings: {
                    experimental: ['testnet-networks', 'nft-section', 'tor-external'],
                },
            },
            'suite',
        );
        db.close();

        const migratedDb = await runMigration();

        const suiteSettings = await migratedDb.get('suiteSettings', 'suite');
        expect(suiteSettings?.settings.isTestnetNetworksEnabled).toBe(true);
        expect(suiteSettings?.settings.isNftSectionEnabled).toBe(true);
        expect(suiteSettings?.settings.experimental).toEqual(['tor-external']);

        migratedDb.close();
    });

    test('leaves settings unchanged when experimental features are not enabled', async () => {
        const db = await openDB(DB_NAME, INITIAL_VERSION, {
            upgrade(db) {
                db.createObjectStore('suiteSettings');
            },
        });
        await db.put('suiteSettings', { settings: {} }, 'suite');
        db.close();

        const migratedDb = await runMigration();

        const suiteSettings = await migratedDb.get('suiteSettings', 'suite');
        expect(suiteSettings?.settings).toEqual({});

        migratedDb.close();
    });
});
