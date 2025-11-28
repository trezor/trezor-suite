import { Middleware, StoreEnhancer, configureStore } from '@reduxjs/toolkit';
import devToolsEnhancer from 'redux-devtools-expo-dev-plugin';
import { logger } from 'redux-logger';

import {
    ExtraDependencies,
    castExtraStore,
    createStoreWithExtraStoreMiddleware,
} from '@suite-common/redux-utils';
import {
    prepareFiatRatesMiddleware,
    preparePushNotificationMiddleware,
} from '@suite-common/wallet-core';
import { blockchainMiddleware } from '@suite-native/blockchain';
import { deviceConnectionMiddleware, prepareDeviceMiddleware } from '@suite-native/device';
import { prepareDiscoveryMiddleware } from '@suite-native/discovery';
import { messageSystemMiddleware } from '@suite-native/message-system';
import { sendFormMiddleware } from '@suite-native/send';
import { thpMiddleware } from '@suite-native/thp';
import { prepareTradingMiddleware } from '@suite-native/trading-state';
import { DeepPartial } from '@trezor/type-utils';

import { extraDependencies, nativeExtraFactory } from './extraDependencies';
import { prepareRootReducers } from './reducers';

type RootReducerShape = Awaited<ReturnType<typeof prepareRootReducers>>;
type FullPreloadedState = Parameters<RootReducerShape>[0];
export type PreloadedState = DeepPartial<FullPreloadedState> | undefined;

const middlewares: Middleware[] = [
    messageSystemMiddleware,
    blockchainMiddleware,
    prepareFiatRatesMiddleware(extraDependencies),
    prepareDeviceMiddleware(extraDependencies),
    prepareDiscoveryMiddleware(extraDependencies),
    sendFormMiddleware,
    thpMiddleware,
    prepareTradingMiddleware(extraDependencies),
    preparePushNotificationMiddleware(extraDependencies),
];

const enhancers: Array<StoreEnhancer<any, any>> = [];

const ENABLE_REDUX_LOGGER = false;

if (__DEV__) {
    enhancers.push(devToolsEnhancer({ maxAge: 150 })!);
    if (ENABLE_REDUX_LOGGER) {
        middlewares.push(logger);
    }
}

export const initStore = async (preloadedState?: PreloadedState) => {
    let extra: ExtraDependencies | null = null as ExtraDependencies | null;

    const store = configureStore({
        preloadedState: preloadedState as FullPreloadedState,
        reducer: await prepareRootReducers(),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                serializableCheck: false,
                immutableCheck: false,
            })
                .prepend(
                    createStoreWithExtraStoreMiddleware({
                        extraFactory: api => ({
                            ...extraDependencies,
                            ...nativeExtraFactory(api),
                        }),
                        onExtraCreated: initializedExtra => {
                            extra = initializedExtra;
                        },
                    }),
                )
                .prepend(deviceConnectionMiddleware.middleware)
                .concat(middlewares),
        enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(enhancers),
    });

    return castExtraStore(store, extra);
};
