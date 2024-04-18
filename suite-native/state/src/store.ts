import { configureStore, Middleware } from '@reduxjs/toolkit';
import logger from 'redux-logger';

import { prepareFiatRatesMiddleware } from '@suite-common/wallet-core';
import { messageSystemMiddleware } from '@suite-native/message-system';
import { prepareButtonRequestMiddleware, prepareDeviceMiddleware } from '@suite-native/device';
import { prepareDiscoveryMiddleware } from '@suite-native/discovery';
import { prepareTransactionCacheMiddleware } from '@suite-native/accounts';
import { blockchainMiddleware } from '@suite-native/blockchain';

import { extraDependencies } from './extraDependencies';
import { prepareRootReducers } from './reducers';

const IS_REDUX_LOGGER_ENABLED = false;

const middlewares: Middleware[] = [
    messageSystemMiddleware,
    blockchainMiddleware,
    prepareFiatRatesMiddleware(extraDependencies),
    prepareDeviceMiddleware(extraDependencies),
    prepareButtonRequestMiddleware(extraDependencies),
    prepareDiscoveryMiddleware(extraDependencies),
    prepareTransactionCacheMiddleware(extraDependencies),
];

if (__DEV__) {
    const createDebugger = require('redux-flipper').default;
    middlewares.push(createDebugger());
    if (IS_REDUX_LOGGER_ENABLED) middlewares.push(logger);
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
