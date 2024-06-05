import { configureStore, Middleware, StoreEnhancer } from '@reduxjs/toolkit';
import devToolsEnhancer from 'redux-devtools-expo-dev-plugin';

import { prepareFiatRatesMiddleware } from '@suite-common/wallet-core';
import { messageSystemMiddleware } from '@suite-native/message-system';
import { prepareButtonRequestMiddleware, prepareDeviceMiddleware } from '@suite-native/device';
import { prepareDiscoveryMiddleware } from '@suite-native/discovery';
import { prepareTransactionCacheMiddleware } from '@suite-native/accounts';
import { blockchainMiddleware } from '@suite-native/blockchain';

import { extraDependencies } from './extraDependencies';
import { prepareRootReducers } from './reducers';

const middlewares: Middleware[] = [
    messageSystemMiddleware,
    blockchainMiddleware,
    prepareFiatRatesMiddleware(extraDependencies),
    prepareDeviceMiddleware(extraDependencies),
    prepareButtonRequestMiddleware(extraDependencies),
    prepareDiscoveryMiddleware(extraDependencies),
    prepareTransactionCacheMiddleware(extraDependencies),
];

const enhancers: Array<StoreEnhancer<any, any>> = [];

if (__DEV__) {
    enhancers.push(devToolsEnhancer({ maxAge: 150 })!);
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
        enhancers: defaultEnhancers => defaultEnhancers.concat(enhancers),
    });
