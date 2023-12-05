import { configureStore, Middleware } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';

import { prepareFiatRatesMiddleware } from '@suite-native/fiat-rates';
import { logsMiddleware } from '@suite-common/logger';
import { logsMiddleware as nativeLogsMiddleware } from '@suite-native/logger';
import { messageSystemMiddleware } from '@suite-native/message-system';
import { prepareBlockchainMiddleware } from '@suite-common/wallet-core';
import { prepareButtonRequestMiddleware, prepareDeviceMiddleware } from '@suite-native/device';
import { prepareDiscoveryMiddleware } from '@suite-native/discovery';
import { prepareTransactionCacheMiddleware } from '@suite-native/accounts';

import { extraDependencies } from './extraDependencies';
import { prepareRootReducers } from './reducers';

const middlewares: Middleware[] = [
    nativeLogsMiddleware,
    messageSystemMiddleware,
    prepareBlockchainMiddleware(extraDependencies),
    prepareFiatRatesMiddleware(extraDependencies),
    logsMiddleware,
    prepareDeviceMiddleware(extraDependencies),
    prepareButtonRequestMiddleware(extraDependencies),
    prepareDiscoveryMiddleware(extraDependencies),
    prepareTransactionCacheMiddleware(extraDependencies),
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
