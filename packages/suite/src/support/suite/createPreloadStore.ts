import {
    type StorageAction,
    storageCorrupted,
    storageError,
    storageLoad,
} from 'src/actions/suite/storageLifecycleActions';
import { type DbDep } from 'src/storage/createDb';
import { loadStoragePayload } from 'src/storage/loadStoragePayload';

type PreloadStoreDeps = DbDep;

export type PreloadStoreAction = StorageAction | undefined;

export type PreloadStore = () => Promise<PreloadStoreAction>;

export type PreloadStoreDep = { preloadStore: PreloadStore };

// Load persisted state before rendering the Redux-connected app. The store is created
// synchronously during composition and hydrated with this result during initialization.
export const createPreloadStore =
    (deps: PreloadStoreDeps): PreloadStore =>
    async () => {
        if (!deps.db.isSupported()) return;

        try {
            const { onBlocked, onBlocking } = deps.db;
            const dbError = await new Promise<'blocked' | 'blocking' | undefined>(
                (resolve, reject) => {
                    deps.db.onBlocked = () => resolve('blocked');
                    deps.db.onBlocking = () => resolve('blocking');
                    // Opening can fail without a blocked event (e.g. an Electron profile lock).
                    // Let the storage-error handling below settle startup instead of leaving the loader hanging.
                    deps.db.getDB().then(() => resolve(undefined), reject);
                },
            ).finally(() => {
                // Restore the runtime lifecycle handlers after checking for startup errors.
                deps.db.onBlocked = onBlocked;
                deps.db.onBlocking = onBlocking;
            });

            if (dbError) {
                return storageError(dbError);
            }

            return storageLoad(await loadStoragePayload(deps.db));
        } catch (error) {
            console.error(error); // Report the error to sentry instead of silently failing

            return storageCorrupted(error.message);
        }
    };
