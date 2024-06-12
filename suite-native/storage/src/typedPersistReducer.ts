import { createMigrate, persistReducer, Transform } from 'redux-persist';
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import { Reducer } from '@reduxjs/toolkit';

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
    migrations?: { [key: string]: (state: any) => any };
    transforms?: Array<Transform<any, any>>;
    mergeLevel?: 1 | 2;
}) => {
    const migrate = createMigrate(migrations ?? {}, { debug: false });

    const persistConfig = {
        key,
        storage: await initMmkvStorage(),
        whitelist: persistedKeys as string[],
        version,
        migrate,
        transforms,
        stateReconciler: (mergeLevel === 2 ? autoMergeLevel2 : autoMergeLevel1) as any,
    };

    return persistReducer(persistConfig, reducer);
};
