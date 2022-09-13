import { configureStore, Store, Middleware } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';
import { persistReducer, persistStore } from 'redux-persist';

import { prepareFiatRatesMiddleware, prepareBlockchainMiddleware } from '@suite-common/wallet-core';

import { extraDependencies } from './extraDependencies';
import { reduxStorage } from './storage';
import { rootReducers } from './reducers';

const middlewares: Middleware[] = [
    prepareBlockchainMiddleware(extraDependencies),
    prepareFiatRatesMiddleware(extraDependencies),
];

if (__DEV__) {
    const reduxFlipperDebugger = createDebugger();
    middlewares.push(reduxFlipperDebugger);
}

const rootPersistConfig = {
    key: 'root',
    storage: reduxStorage,
    whitelist: ['appSettings', 'wallet'],
};

const persistedReducer = persistReducer(rootPersistConfig, rootReducers);

export const store: Store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: extraDependencies,
            },
        }).concat(middlewares),
});

export type RootState = ReturnType<typeof store.getState>;

export const persistor = persistStore(store);
