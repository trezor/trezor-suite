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
 * this resolves at once when there is nothing to move. It fails when the main process could not
 * read the legacy origin: the app must not start on an empty origin while the data waits there.
 */
export const createMigrateLegacyOriginStorage =
    (deps: MigrateLegacyOriginStorageDeps): MigrateLegacyOriginStorage =>
    async () => {
        // A call the main process rejects is a failed move too, the app must not wait for it forever.
        const storageExport = await deps.desktopApi
            .pullLegacyOriginStorage()
            .catch((error: unknown) => err(error instanceof Error ? error.message : String(error)));
        if (!storageExport.success) return err(storageExport.error);
        if (!storageExport.payload) return ok();

        const result = await importLegacyOriginStorage(storageExport.payload);
        /**
         * A report the main process rejects changes nothing here, the outcome of the import stands.
         * The legacy origin is kept then, and the next start settles it:
         * the databases are found here already, so nothing is written twice.
         */
        await deps.desktopApi
            .reportLegacyOriginStorageImport(
                result.success
                    ? { success: true, isImported: result.payload.isImported }
                    : { success: false, error: result.error },
            )
            .catch(() => undefined);

        return result.success ? ok() : err(result.error);
    };
