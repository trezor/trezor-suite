import { createMigrate, persistReducer } from 'redux-persist';
import { Reducer } from '@reduxjs/toolkit';

import { initMmkvStorage } from './storage';

export const preparePersistReducer = async <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
    version,
    migrations,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
    version: number;
    migrations?: { [key: string]: (state: any) => any };
}) => {
    const migrate = createMigrate(migrations ?? {}, { debug: false });

    const persistConfig = {
        key,
        storage: await initMmkvStorage(),
        whitelist: persistedKeys as string[],
        version,
        migrate,
    };

    return persistReducer(persistConfig, reducer);
};
