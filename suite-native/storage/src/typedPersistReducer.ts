import { Reducer } from '@reduxjs/toolkit';
import { Transform, persistReducer } from 'redux-persist';
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { createAsyncMigrate } from './createAsyncMigrate';
import { MigrationsManifest } from './migrationTypes';
import { initMmkvStorage } from './storage';

export const preparePersistReducer = async <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
    version,
    migrations,
    transforms,
    mergeLevel = 1,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
    version: number;
    migrations?: MigrationsManifest;
    transforms?: Array<Transform<any, any>>;
    mergeLevel?: 1 | 2;
}) => {
    const storage = await initMmkvStorage();

    const persistConfig = {
        key,
        storage,
        whitelist: persistedKeys as string[],
        version,
        migrate: createAsyncMigrate<TReducerInitialState>(migrations ?? {}),
        transforms,
        stateReconciler: (mergeLevel === 2 ? autoMergeLevel2 : autoMergeLevel1) as any,
    };

    return persistReducer(persistConfig, reducer);
};
