import { DEFAULT_VERSION, type PersistedState } from 'redux-persist';

import { type MigrationsManifest } from './migrationTypes';

type MigratedState<TReducerInitialState> = Partial<TReducerInitialState> & PersistedState;

/**
 * This is a replacement of createMigrate helper from redux-persist that allows to use async migrations
 * and also allows migration with empty persisted state (if you need to get the initial data from other source).
 *
 * Debug config is not implemented, but it can be added if needed.
 */
export const createAsyncMigrate =
    <TReducerInitialState>(migrations: MigrationsManifest) =>
    async (
        oldState: PersistedState,
        currentVersion: number,
    ): Promise<MigratedState<TReducerInitialState>> => {
        if (!oldState) {
            // This allows to use migration that gets the initial data from other sources.
            oldState = { _persist: { version: DEFAULT_VERSION /* -1 */, rehydrated: true } };
        }

        const inboundVersion: number = oldState._persist?.version ?? DEFAULT_VERSION;

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
                const migration = migrations[versionKey];
                if (migration) {
                    migratedState = (await migration(
                        migratedState,
                    )) as MigratedState<TReducerInitialState>;
                }
            }

            return Promise.resolve(migratedState);
        } catch (err) {
            console.error(err);

            return Promise.reject(err);
        }
    };
