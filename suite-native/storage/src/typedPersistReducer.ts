import { persistReducer } from 'redux-persist';
import { Reducer } from '@reduxjs/toolkit';

import { mmkvStorage } from './storage';

export const typedPersistReducer = <TReducerInitialState>({
    reducer,
    persistedKeys,
    key,
}: {
    reducer: Reducer<TReducerInitialState>;
    persistedKeys: Array<keyof TReducerInitialState>;
    key: string;
}) => persistReducer({ key, storage: mmkvStorage, whitelist: persistedKeys as string[] }, reducer);
