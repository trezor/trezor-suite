import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type Result, err, ok } from '@trezor/type-utils';

import { importLegacyOriginStorage } from './importLegacyOriginStorage';

export type MigrateLegacyOriginStorageDeps = DesktopApiDep<
    'pullLegacyOriginStorage' | 'reportLegacyOriginStorageImport'
>;

export type MigrateLegacyOriginStorage = () => Promise<Result<void, string>>;

export type MigrateLegacyOriginStorageDep = {
    migrateLegacyOriginStorage: MigrateLegacyOriginStorage;
};

/**
 * Moves the storage the desktop app left on its legacy `file://` origin into this origin, once.
 * The main process holds the export and clears the legacy origin after a successful import, so
 * this resolves at once when there is nothing to move.
 */
export const createMigrateLegacyOriginStorage =
    (deps: MigrateLegacyOriginStorageDeps): MigrateLegacyOriginStorage =>
    async () => {
        const storage = await deps.desktopApi.pullLegacyOriginStorage();
        if (!storage) return ok();

        const result = await importLegacyOriginStorage(storage);
        await deps.desktopApi.reportLegacyOriginStorageImport(
            result.success
                ? { success: true, isImported: result.payload.isImported }
                : { success: false, error: result.error },
        );

        return result.success ? ok() : err(result.error);
    };
