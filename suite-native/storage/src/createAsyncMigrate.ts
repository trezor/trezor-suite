import { DEFAULT_VERSION, PersistedState } from 'redux-persist';

export type UnknownPersistedState<T> = (T & PersistedState) | undefined;

export type MigrationsManifest<T> = {
    [key: string]: (
        // <any> because this is the old state = won't conform to the current reducer type
        state: UnknownPersistedState<any>,
    ) => UnknownPersistedState<T> | Promise<UnknownPersistedState<T>>;
};

/**
 * This is a replacement of createMigrate helper from redux-persist that allows to use async migrations
 * and also allows initial migration from empty state.
 *
 * Debug config is not implemented, but it can be added if needed.
 */
export const createAsyncMigrate =
    <T>(migrations: MigrationsManifest<T>) =>
    async (
        oldState: UnknownPersistedState<any>,
        currentVersion: number,
    ): Promise<UnknownPersistedState<T>> => {
        // If there is migration for version 1 it is considered as initial migration from empty state.
        // Note that migrations will be indexed from 1 in the manifest.
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
            // `as` for two reasons: 1) this state is still old, will be new after all migrations, 2) _persist is not guaranteed
            let migratedState = oldState as UnknownPersistedState<T>;

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
