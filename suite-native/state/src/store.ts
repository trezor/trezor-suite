import { Middleware, StoreEnhancer, configureStore } from '@reduxjs/toolkit';
import devToolsEnhancer from 'redux-devtools-expo-dev-plugin';
import { logger } from 'redux-logger';

import { prepareFiatRatesMiddleware } from '@suite-common/wallet-core';
import { blockchainMiddleware } from '@suite-native/blockchain';
import { prepareDeviceMiddleware } from '@suite-native/device';
import { prepareDiscoveryMiddleware } from '@suite-native/discovery';
import { messageSystemMiddleware } from '@suite-native/message-system';
import { sendFormMiddleware } from '@suite-native/module-send/src/sendFormMiddleware';
import { DeepPartial } from '@trezor/type-utils';

import { extraDependencies } from './extraDependencies';
import { prepareRootReducers } from './reducers';

type RootReducerShape = Awaited<ReturnType<typeof prepareRootReducers>>;
type FullPreloadedState = Parameters<RootReducerShape>[0];
export type PreloadedState = DeepPartial<FullPreloadedState> | undefined;

const ENABLE_REDUX_LOGGER = false;

const middlewares: Middleware[] = [
    messageSystemMiddleware,
    blockchainMiddleware,
    prepareFiatRatesMiddleware(extraDependencies),
    prepareDeviceMiddleware(extraDependencies),
    prepareDiscoveryMiddleware(extraDependencies),
    sendFormMiddleware,
];

const enhancers: Array<StoreEnhancer<any, any>> = [];

if (__DEV__) {
    enhancers.push(devToolsEnhancer({ maxAge: 150 })!);
    if (ENABLE_REDUX_LOGGER) {
        middlewares.push(logger);
    }
}

export const initStore = async (preloadedState?: PreloadedState) =>
    configureStore({
        preloadedState: preloadedState as FullPreloadedState,
        reducer: await prepareRootReducers(),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: extraDependencies,
                },
                serializableCheck: false,
                immutableCheck: false,
            }).concat(middlewares),
        enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(enhancers),
    });
