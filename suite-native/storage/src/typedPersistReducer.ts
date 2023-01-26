import { persistReducer } from 'redux-persist';
import { Reducer } from '@reduxjs/toolkit';

import { initMmkvStorage } from './storage';

export const preparePersistReducer = async <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
}) =>
    persistReducer(
        { key, storage: await initMmkvStorage(), whitelist: persistedKeys as string[] },
        reducer,
    );
