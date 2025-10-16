import { Reducer } from '@reduxjs/toolkit';
import { Transform, createMigrate, persistReducer } from 'redux-persist';
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { initMmkvStorage } from './storage';

type ExclusiveMigrationsOrAsyncMigrate =
    | {
          migrations?: { [key: number]: (state: any) => any };
          asyncMigrate?: undefined;
      }
    | {
          migrations?: undefined;
          asyncMigrate?: (state: any, currentVersion: number) => Promise<any>;
      };

export const preparePersistReducer = async <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
    version,
    migrations,
    asyncMigrate,
    transforms,
    mergeLevel = 1,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
    version: number;
    transforms?: Array<Transform<any, any>>;
    mergeLevel?: 1 | 2;
} & ExclusiveMigrationsOrAsyncMigrate) => {
    const storage = await initMmkvStorage();
    const defaultMigrate = createMigrate(migrations ?? {}, { debug: false });

    const persistConfig = {
        key,
        storage,
        whitelist: persistedKeys as string[],
        version,
        migrate: asyncMigrate ?? defaultMigrate,
        transforms,
        stateReconciler: (mergeLevel === 2 ? autoMergeLevel2 : autoMergeLevel1) as any,
    };

    return persistReducer(persistConfig, reducer);
};
