import { type IDBPDatabase, openDB } from 'idb';

import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { type SuiteDBSchema } from '#src/storage/definitions';

import migration from './26.11.0.2';

const DB_NAME = 'suite-idb-test-26.11.0.2';
const INITIAL_VERSION = 1;

const runMigration = async (dbName: string) => {
    const initialDb = await openDB(dbName, INITIAL_VERSION);
    initialDb.close();

    return openDB<SuiteDBSchema>(dbName, INITIAL_VERSION + 1, {
        async upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            await migration.migrate(db, tx);
        },
    });
};

describe('migration 26.11.0.2', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    test('creates a random trade API install salt', async () => {
        const firstDb = await runMigration(`${DB_NAME}-first`);
        const secondDb = await runMigration(`${DB_NAME}-second`);

        const salt = await firstDb.get('tradeApiInstallSalt', 'tradeApiInstallSalt');
        expect(salt).toMatch(/^[0-9a-f]{64}$/);
        expect(await secondDb.get('tradeApiInstallSalt', 'tradeApiInstallSalt')).not.toBe(salt);
    });
});
