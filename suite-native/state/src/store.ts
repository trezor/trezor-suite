import { configureStore, Middleware } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';

import { prepareFiatRatesMiddleware } from '@suite-native/fiat-rates';
import { logsMiddleware } from '@suite-common/logger';
import { logsMiddleware as nativeLogsMiddleware } from '@suite-native/logger';
import { prepareBlockchainMiddleware } from '@suite-common/wallet-core';

import { extraDependencies } from './extraDependencies';
import { prepareRootReducers } from './reducers';

const middlewares: Middleware[] = [
    nativeLogsMiddleware,
    prepareBlockchainMiddleware(extraDependencies),
    prepareFiatRatesMiddleware(extraDependencies),
    logsMiddleware,
];

if (__DEV__) {
    const reduxFlipperDebugger = createDebugger();
    middlewares.push(reduxFlipperDebugger);
}

export const initStore = async () =>
    configureStore({
        reducer: await prepareRootReducers(),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: extraDependencies,
                },
                serializableCheck: false,
                immutableCheck: false,
            }).concat(middlewares),
    });
