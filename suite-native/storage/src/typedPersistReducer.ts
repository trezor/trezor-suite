import { persistReducer } from 'redux-persist';
import { Reducer } from '@reduxjs/toolkit';

import { initMmkvStorage } from './storage';

export const preparePersistReducer = async <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
    version,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
    version: number;
}) =>
    persistReducer(
        { key, storage: await initMmkvStorage(), whitelist: persistedKeys as string[], version },
        reducer,
    );
