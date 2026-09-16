import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';
import SuiteDB from '@trezor/suite-storage';

const DB_NAME = 'suite-idb-migration-failure-test';
const VERSION = 2;

describe('failing migration', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    it('rejects instead of opening a partially migrated database', async () => {
        const db = new SuiteDB(
            DB_NAME,
            VERSION,
            () => Promise.reject(new Error('migration failed')),
            jest.fn(),
        );

        await expect(db.getDB()).rejects.toThrow();
    });

    it('is retried on the next start instead of being skipped forever', async () => {
        const failing = new SuiteDB(
            DB_NAME,
            VERSION,
            () => Promise.reject(new Error('migration failed')),
            jest.fn(),
        );

        await expect(failing.getDB()).rejects.toThrow();

        const migratedFrom: number[] = [];
        const succeeding = new SuiteDB(
            DB_NAME,
            VERSION,
            (_db, oldVersion) => {
                migratedFrom.push(oldVersion);

                return Promise.resolve();
            },
            jest.fn(),
        );

        await succeeding.getDB();

        // The aborted upgrade left no version behind, so the migration runs again from scratch.
        expect(migratedFrom).toEqual([0]);
    });
});
