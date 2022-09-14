import { configureStore, Store, Middleware } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';
import { persistStore, FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist';

import { prepareFiatRatesMiddleware, prepareBlockchainMiddleware } from '@suite-common/wallet-core';

import { extraDependencies } from './extraDependencies';
import { rootReducers } from './reducers';

const middlewares: Middleware[] = [
    prepareBlockchainMiddleware(extraDependencies),
    prepareFiatRatesMiddleware(extraDependencies),
];

if (__DEV__) {
    const reduxFlipperDebugger = createDebugger();
    middlewares.push(reduxFlipperDebugger);
}

export const store: Store = configureStore({
    reducer: rootReducers,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: extraDependencies,
            },
            serializableCheck: {
                // ignore all action types which redux-persist dispatches
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(middlewares),
});

export type RootState = ReturnType<typeof store.getState>;

export const storePersistor = persistStore(store);
