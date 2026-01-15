import { Middleware, MiddlewareAPI, StoreEnhancer, configureStore } from '@reduxjs/toolkit';

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
import { createEnsureEncryptionKey, createMMKVStorage } from '@suite-native/storage';
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
        thpMiddleware(getExtra),
        prepareTradingMiddleware(getExtra),
        preparePushNotificationMiddleware(getExtra),
        prepareSuiteSyncMiddleware(getExtra),
    ];

    if (__DEV__) {
        // eslint-disable-next-line import/no-extraneous-dependencies
        const { rozeniteDevToolsEnhancer } = require('@rozenite/redux-devtools-plugin');
        enhancers.push(rozeniteDevToolsEnhancer());

        if (ENABLE_REDUX_LOGGER) {
            const { createLogger } = require('redux-logger');
            middlewares.push(createLogger());
        }
    }

    return middlewares;
};

export const initStore = (preloadedState?: PreloadedState) => {
    let extra: ReturnType<typeof extraFactory> | null = null as ReturnType<
        typeof extraFactory
    > | null;

    const ensureEncryptionKey = createEnsureEncryptionKey();
    const mmkvStorage = createMMKVStorage({ ensureEncryptionKey });

    const extraFactory = (api: MiddlewareAPI) => ({
        ...extraDependencies,
        services: createNativeCompositionRoot({
            ...api,
            ensureEncryptionKey,
            mmkvStorage,
        }),
    });

    const store = configureStore({
        preloadedState: preloadedState as FullPreloadedState,
        reducer: prepareRootReducers({ mmkvStorage }),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                serializableCheck: false,
                immutableCheck: false,
            })
                .prepend(
                    createStoreWithExtraStoreMiddleware({
                        extraFactory,
                        onExtraCreated: (initializedExtra: ReturnType<typeof extraFactory>) => {
                            extra = initializedExtra;
                        },
                    }),
                )
                .prepend(deviceConnectionMiddleware.middleware)
                .concat(getMiddlewares(() => extra)),
        devTools: false, // Rozenite DevTools will be used instead of default browser dev tools
        enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(enhancers),
    });

    const castedStore = castExtraStore(store, extra);

    return {
        ...castedStore,
        services: castedStore.extra.services,
    };
};

export type StoreWithExtra = Awaited<ReturnType<typeof initStore>>;
export type Store = StoreWithExtra['store'];
