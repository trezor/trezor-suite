import { type DesktopApi, type LegacyOriginStorage } from '@suite/desktop-app-api';
import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    type MigrateLegacyOriginStorageDeps,
    createMigrateLegacyOriginStorage,
} from './migrateLegacyOriginStorage';

type PulledLegacyOriginStorage = Awaited<ReturnType<DesktopApi['pullLegacyOriginStorage']>>;

const createDeps = (pulled: PulledLegacyOriginStorage) =>
    createMockDeps<MigrateLegacyOriginStorageDeps>({
        desktopApi: {
            pullLegacyOriginStorage: () => Promise.resolve(pulled),
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
        const deps = createDeps({ success: true });

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result).toEqual({ success: true, payload: undefined });
        expect(deps.desktopApi.reportLegacyOriginStorageImport).not.toHaveBeenCalled();
        expect(await indexedDB.databases()).toEqual([]);
    });

    it('fails without touching this origin when the main process could not export the storage', async () => {
        const deps = createDeps({ success: false, error: 'timed out after 120000 ms' });

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result).toEqual({ success: false, error: 'timed out after 120000 ms' });
        expect(deps.desktopApi.reportLegacyOriginStorageImport).not.toHaveBeenCalled();
        expect(await indexedDB.databases()).toEqual([]);
    });

    it('imports the storage and reports the import', async () => {
        const deps = createDeps({
            success: true,
            payload: createStorage([{ key: 'suite', value: { settings: {} } }]),
        });

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result).toEqual({ success: true, payload: undefined });
        expect(deps.desktopApi.reportLegacyOriginStorageImport).toHaveBeenCalledWith({
            success: true,
            isImported: true,
        });
        expect((await indexedDB.databases()).map(info => info.name)).toEqual(['trezor-suite']);
    });

    it('reports a failed import and fails itself', async () => {
        const deps = createDeps({
            success: true,
            payload: createStorage([{ key: Number.NaN, value: {} }]),
        });

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result.success).toBe(false);
        expect(deps.desktopApi.reportLegacyOriginStorageImport).toHaveBeenCalledWith({
            success: false,
            error: expect.any(String),
        });
    });

    it('fails without touching this origin when the main process rejects the pull', async () => {
        const deps = createDeps({ success: true });
        deps.desktopApi.pullLegacyOriginStorage.mockRejectedValue(
            new Error('No handler registered'),
        );

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result).toEqual({ success: false, error: 'No handler registered' });
        expect(deps.desktopApi.reportLegacyOriginStorageImport).not.toHaveBeenCalled();
        expect(await indexedDB.databases()).toEqual([]);
    });

    it('keeps the outcome of a finished import when the main process rejects its report', async () => {
        const deps = createDeps({
            success: true,
            payload: createStorage([{ key: 'suite', value: { settings: {} } }]),
        });
        deps.desktopApi.reportLegacyOriginStorageImport.mockRejectedValue(
            new Error('The legacy origin cannot be cleared'),
        );

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result).toEqual({ success: true, payload: undefined });
        expect((await indexedDB.databases()).map(info => info.name)).toEqual(['trezor-suite']);
    });

    it('fails with the error of the import when the main process rejects its report', async () => {
        const deps = createDeps({
            success: true,
            payload: createStorage([{ key: Number.NaN, value: {} }]),
        });
        deps.desktopApi.reportLegacyOriginStorageImport.mockRejectedValue(
            new Error('No handler registered'),
        );

        const result = await createMigrateLegacyOriginStorage(deps)();

        expect(result.success).toBe(false);
        expect(result).not.toEqual({ success: false, error: 'No handler registered' });
    });
});
