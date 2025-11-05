import { DEFAULT_VERSION, PersistedState } from 'redux-persist';

// unknown is here just for explicitness, it's the same as PersistedState
export type UnknownPersistedState = unknown & PersistedState;

export type MigrationsManifest = {
    [key: number]: (
        state: UnknownPersistedState,
    ) => UnknownPersistedState | Promise<UnknownPersistedState> | undefined;
};

type MigratedState<TReducerInitialState> =
    | (Partial<TReducerInitialState> & PersistedState)
    | undefined;

/**
 * This is a replacement of createMigrate helper from redux-persist that allows to use async migrations
 * and also allows initial migration from empty state.
 *
 * Debug config is not implemented, but it can be added if needed.
 */
export const createAsyncMigrate =
    <TReducerInitialState>(migrations: MigrationsManifest) =>
    async (
        oldState: UnknownPersistedState,
        currentVersion: number,
    ): Promise<MigratedState<TReducerInitialState>> => {
        if (
            !oldState &&
            // If migration for version 1 exists, undefined oldState is allowed - do not early return.
            // Migration for version 1 is considered as "initial migration" from an empty state.
            !migrations[1]
        ) {
            return Promise.resolve(undefined);
        }

        const inboundVersion: number =
            oldState?._persist?.version !== undefined
                ? oldState._persist.version
                : DEFAULT_VERSION; /* -1 */

        if (inboundVersion === currentVersion) {
            // `as` because we do no migration here
            return Promise.resolve(oldState as MigratedState<TReducerInitialState>);
        }

        if (inboundVersion > currentVersion) {
            if (process.env.NODE_ENV !== 'production')
                console.error('redux-persist: downgrading version is not supported');

            // `as` because we do no migration here
            return Promise.resolve(oldState as MigratedState<TReducerInitialState>);
        }

        const migrationKeys = Object.keys(migrations)
            .map(ver => parseInt(ver))
            .filter(key => currentVersion >= key && key > inboundVersion)
            .sort((a, b) => a - b);

        try {
            // `as` for two reasons: 1) this state is still old, will be new after all migrations, 2) _persist is not guaranteed
            let migratedState = oldState as MigratedState<TReducerInitialState>;

            // Run migrations sequentially.
            for (const versionKey of migrationKeys) {
                migratedState = (await migrations[versionKey](
                    migratedState,
                )) as MigratedState<TReducerInitialState>;
            }

            return Promise.resolve(migratedState);
        } catch (err) {
            console.error(err);

            return Promise.reject(err);
        }
    };
