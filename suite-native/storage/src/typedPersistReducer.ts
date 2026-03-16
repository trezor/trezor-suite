import { type Reducer } from '@reduxjs/toolkit';
import { type Transform, persistReducer } from 'redux-persist';
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { createAsyncMigrate } from './createAsyncMigrate';
import { type MigrationsManifest } from './migrationTypes';
import { type MMKVStorage } from './mmkvStorage';

export const preparePersistReducer = <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
    version,
    migrations,
    transforms,
    mergeLevel = 1,
    storage,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
    version: number;
    migrations?: MigrationsManifest;
    transforms?: Array<Transform<any, any>>;
    mergeLevel?: 1 | 2;
    storage: MMKVStorage;
}) => {
    const persistConfig = {
        key,
        storage,
        whitelist: persistedKeys as string[],
        version,
        migrate: createAsyncMigrate<TReducerInitialState>(migrations ?? {}),
        transforms,
        stateReconciler: (mergeLevel === 2 ? autoMergeLevel2 : autoMergeLevel1) as any,
        timeout: 0, // Disable default 5s timeout to prevent occasional data loss.
    };

    return persistReducer(persistConfig, reducer);
};
