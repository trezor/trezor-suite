import { type LegacyOriginStorage } from '@suite/desktop-app-api';
import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    type MigrateLegacyOriginStorageDeps,
    createMigrateLegacyOriginStorage,
} from './migrateLegacyOriginStorage';

const createDeps = (storage: LegacyOriginStorage | undefined) =>
    createMockDeps<MigrateLegacyOriginStorageDeps>({
        desktopApi: {
            pullLegacyOriginStorage: () => Promise.resolve(storage),
            reportLegacyOriginStorageImport: () => Promise.resolve(),
        },
    });

const createStorage = (
    records: LegacyOriginStorage['databases'][number]['objectStores'][number]['records'],
): LegacyOriginStorage => ({
    databases: [
        {
            name: 'trezor-suite',
            version: 3,
            objectStores: [
                {
                    name: 'suiteSettings',
                    keyPath: null,
                    autoIncrement: false,
                    indexes: [],
                    records,
                },
            ],
        },
    ],
    localStorage: {},
    files: [],
});

describe(createMigrateLegacyOriginStorage.name, () => {
    beforeEach(() => {
        installFakeIndexedDb();
    });

    it('does nothing when the main process has nothing to move', async () => {
        const deps = createDeps(undefined);

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result).toEqual({ success: true, payload: undefined });
        expect(deps.desktopApi.reportLegacyOriginStorageImport).not.toHaveBeenCalled();
        expect(await indexedDB.databases()).toEqual([]);
    });

    it('imports the storage and reports the import', async () => {
        const deps = createDeps(createStorage([{ key: 'suite', value: { settings: {} } }]));

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result).toEqual({ success: true, payload: undefined });
        expect(deps.desktopApi.reportLegacyOriginStorageImport).toHaveBeenCalledWith({
            success: true,
            isImported: true,
        });
        expect((await indexedDB.databases()).map(info => info.name)).toEqual(['trezor-suite']);
    });

    it('reports a failed import and fails itself', async () => {
        const deps = createDeps(createStorage([{ key: { not: 'a valid key' }, value: {} }]));

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result.success).toBe(false);
        expect(deps.desktopApi.reportLegacyOriginStorageImport).toHaveBeenCalledWith({
            success: false,
            error: expect.any(String),
        });
    });
});
