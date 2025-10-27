import { DEFAULT_VERSION, PersistedState } from 'redux-persist';

export type UnknownPersistedState =
    | Record<string, any>
    | (Record<string, any> & PersistedState)
    | undefined;
export type MigrationsManifest = {
    [key: string]: (
        state: UnknownPersistedState,
    ) => UnknownPersistedState | Promise<UnknownPersistedState>;
};

/**
 * This is a replacement of createMigrate helper from redux-persist that allows to use async migrations
 * and also allows initial migration from empty state.
 *
 * Debug config is not implemented, but it can be added if needed.
 */
export const createAsyncMigrate =
    (migrations: MigrationsManifest) =>
    async (oldState: UnknownPersistedState, currentVersion: number) => {
        // If there is migration for version 1 it is considered as initial migration from empty state.
        if (!oldState && !migrations[1]) return undefined;

        const inboundVersion: number =
            oldState?._persist?.version !== undefined
                ? oldState._persist.version
                : DEFAULT_VERSION; /* -1 */

        if (inboundVersion === currentVersion) {
            return Promise.resolve(oldState);
        }

        if (inboundVersion > currentVersion) {
            if (process.env.NODE_ENV !== 'production')
                console.error('redux-persist: downgrading version is not supported');

            return Promise.resolve(oldState);
        }

        const migrationKeys = Object.keys(migrations)
            .map(ver => parseInt(ver))
            .filter(key => currentVersion >= key && key > inboundVersion)
            .sort((a, b) => a - b);

        try {
            let migratedState = oldState;

            // Run migrations sequentially.
            for (const versionKey of migrationKeys) {
                migratedState = await migrations[versionKey.toString()](migratedState);
            }

            return migratedState;
        } catch (err) {
            console.error(err); // in order to log this to Sentry

            return undefined;
        }
    };
