import { type IDBPDatabase, openDB } from 'idb';

import {
    type AppRememberedPermission,
    CALL_SOURCE_MCP,
    CALL_SOURCE_WEB,
} from '@suite-common/connect-popup';
import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { type SuiteDBSchema } from '#src/storage/definitions';

import migration from './26.11.0.1';

const DB_NAME = 'suite-idb-test-26.11.0.1';
const INITIAL_VERSION = 1;

const runMigration = () =>
    openDB(DB_NAME, INITIAL_VERSION + 1, {
        upgrade(db: IDBPDatabase<SuiteDBSchema>, _oldVersion, _newVersion, tx) {
            migration.migrate(db, tx);
        },
    });

// The record carries the WalletConnect sessions too, which the schema does not declare.
type ConnectRecord = SuiteDBSchema['connect']['value'] & { walletConnectSessions?: unknown[] };

const createDBWithConnect = async (connect?: ConnectRecord) => {
    const db = await openDB<SuiteDBSchema>(DB_NAME, INITIAL_VERSION, {
        upgrade(upgradeDb) {
            upgradeDb.createObjectStore('connect');
        },
    });

    if (connect) {
        await db.put('connect', connect, 'connect');
    }

    db.close();
};

const mcpKeyedByDeclaredName: AppRememberedPermission = {
    type: CALL_SOURCE_MCP,
    origin: 'mcp://localhost',
    process: { name: 'Claude Code', fullPath: 'Claude Code', warning: true },
    manifest: { appName: 'Claude Code' },
    allowedPermissions: [{ permission: 'read_address' }],
};
const mcpIdentified: AppRememberedPermission = {
    type: CALL_SOURCE_MCP,
    origin: 'mcp://localhost',
    process: { name: 'Cursor', fullPath: '/Applications/Cursor.app/', warning: false },
    manifest: { appName: 'Cursor' },
    allowedPermissions: [{ permission: 'read_address' }],
};
const web: AppRememberedPermission = {
    type: CALL_SOURCE_WEB,
    origin: 'https://example.com',
    manifest: { appName: 'Example' },
    allowedPermissions: [{ permission: 'read_address' }],
};

describe('migration 26.11.0.1', () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    test('drops the permissions remembered for an MCP client under the name it declared', async () => {
        await createDBWithConnect({
            permissions: [web, mcpKeyedByDeclaredName, mcpIdentified],
            walletConnectSessions: [{ topic: 'session' }],
        });

        const migratedDb = await runMigration();

        expect(await migratedDb.get('connect', 'connect')).toEqual({
            permissions: [web, mcpIdentified],
            walletConnectSessions: [{ topic: 'session' }],
        });

        migratedDb.close();
    });

    test('does not create a record when nothing was remembered', async () => {
        await createDBWithConnect();

        const migratedDb = await runMigration();

        expect(await migratedDb.get('connect', 'connect')).toBeUndefined();

        migratedDb.close();
    });
});
