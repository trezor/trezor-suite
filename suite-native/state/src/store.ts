import { Middleware, StoreEnhancer, configureStore } from '@reduxjs/toolkit';

import {
    ExtraDependencies,
    castExtraStore,
    createStoreWithExtraStoreMiddleware,
} from '@suite-common/redux-utils';
import { prepareSuiteSyncMiddleware } from '@suite-common/suite-sync';
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

import { createNativeCompositionRoot, extraDependencies } from './extraDependencies';
import { prepareRootReducers } from './reducers';

type RootReducerShape = Awaited<ReturnType<typeof prepareRootReducers>>;
type FullPreloadedState = Parameters<RootReducerShape>[0];
export type PreloadedState = DeepPartial<FullPreloadedState> | undefined;

const ENABLE_REDUX_LOGGER = false;
const enhancers: Array<StoreEnhancer<any, any>> = [];

const getMiddlewares = (getExtra: () => ExtraDependencies | null) => {
    const middlewares: Middleware[] = [
        messageSystemMiddleware,
        blockchainMiddleware,
        prepareFiatRatesMiddleware(getExtra),
        prepareDeviceMiddleware(getExtra),
        prepareDiscoveryMiddleware(getExtra),
        sendFormMiddleware,
        thpMiddleware,
        prepareTradingMiddleware(getExtra),
        preparePushNotificationMiddleware(getExtra),
        prepareSuiteSyncMiddleware(getExtra),
    ];

    if (__DEV__) {
        // eslint-disable-next-line import/no-extraneous-dependencies
        const { rozeniteDevToolsEnhancer } = require('@rozenite/redux-devtools-plugin');
        enhancers.push(rozeniteDevToolsEnhancer());

        if (ENABLE_REDUX_LOGGER) {
            const logger = require('redux-logger');
            middlewares.push(logger);
        }
    }

    return middlewares;
};

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
                            ...createNativeCompositionRoot(api),
                        }),
                        onExtraCreated: initializedExtra => {
                            extra = initializedExtra;
                        },
                    }),
                )
                .prepend(deviceConnectionMiddleware.middleware)
                .concat(getMiddlewares(() => extra)),
        devTools: false, // Rozenite DevTools will be used instead of default browser dev tools
        enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(enhancers),
    });

    return castExtraStore(store, extra);
};

export type StoreWithExtra = Awaited<ReturnType<typeof initStore>>;
export type Store = StoreWithExtra['store'];
