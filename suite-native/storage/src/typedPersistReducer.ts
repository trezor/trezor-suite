import { Reducer } from '@reduxjs/toolkit';
import { Transform, createMigrate, persistReducer } from 'redux-persist';
import autoMergeLevel1 from 'redux-persist/lib/stateReconciler/autoMergeLevel1';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { initMmkvStorage } from './storage';

export const preparePersistReducer = async <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
    version,
    migrations,
    initialMigration,
    transforms,
    mergeLevel = 1,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
    version: number;
    migrations?: { [key: string]: (state: any) => any };
    initialMigration?: () => any;
    transforms?: Array<Transform<any, any>>;
    mergeLevel?: 1 | 2;
}) => {
    const storage = await initMmkvStorage();
    const defaultMigrate = createMigrate(migrations ?? {}, { debug: false });
    const migrate = (state: any, currentVersion: number) => {
        if (!state && initialMigration) {
            return initialMigration();
        }

        return defaultMigrate(state, currentVersion);
    };

    const persistConfig = {
        key,
        storage,
        whitelist: persistedKeys as string[],
        version,
        migrate,
        transforms,
        stateReconciler: (mergeLevel === 2 ? autoMergeLevel2 : autoMergeLevel1) as any,
    };

    return persistReducer(persistConfig, reducer);
};
