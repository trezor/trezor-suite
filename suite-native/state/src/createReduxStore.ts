import { type Middleware, type StoreEnhancer, configureStore } from '@reduxjs/toolkit';

import { type ExtraDependenciesStatic } from '@suite-common/extra-dependencies';
import { logsMiddleware } from '@suite-common/logger';
import {
    type ReducerState,
    type ReduxStoreWithThunk,
    type WithServices,
    createReduxExtra,
} from '@suite-common/redux-utils';
import { prepareSuiteSyncMiddleware } from '@suite-common/suite-sync';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import {
    prepareFiatRatesMiddleware,
    preparePushNotificationMiddleware,
} from '@suite-common/wallet-core';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { blockchainMiddleware } from '@suite-native/blockchain';
import { deviceConnectionMiddleware, prepareDeviceMiddleware } from '@suite-native/device';
import { prepareDiscoveryMiddleware } from '@suite-native/discovery';
import { messageSystemMiddleware } from '@suite-native/message-system';
import { sendFormMiddleware } from '@suite-native/send';
import {
    prepareTradingLastErrorSentryMiddleware,
    prepareTradingMiddleware,
} from '@suite-native/trading-state';
import { type DeepPartial } from '@trezor/type-utils';

import { type NativeServices } from './NativeServices';
import { type ExtraDependenciesNative } from './createNativeExtraDependencies';
import { type prepareRootReducers } from './reducers';

type RootReducerShape = ReturnType<typeof prepareRootReducers>;

export type FullPersistedAppState = ReducerState<RootReducerShape>;

type ExcludePersist<T> = Omit<T, '_persist'>;
type ExcludeChildPersists<T> = {
    [K in keyof T]: Omit<T[K], '_persist'>;
};

// Typescript hack: wallet is a nested combined reducer, so it has to be treated separately.
// If there would be more nested combined reducer, recursion would be needed.
type WalletCombinedPersistedReducer = NonNullable<FullPersistedAppState>['wallet'];
type WalletCombinedReducer = ExcludeChildPersists<WalletCombinedPersistedReducer>;
// Auxiliary type to strip _persist on the top level of rootReducer.
type CleanFullPersistedAppState = ExcludePersist<NonNullable<FullPersistedAppState>>;
// Complete state type of rootReducer, deeply stripped of all _persist keys
export type FullAppState = ExcludeChildPersists<
    Omit<CleanFullPersistedAppState, 'wallet'> & {
        wallet: WalletCombinedReducer;
    }
>;

export type PreloadedState = DeepPartial<FullPersistedAppState> | undefined;

const ENABLE_REDUX_LOGGER = false;
const enhancers: Array<StoreEnhancer<any, any>> = [];

type GetMiddlewaresDeps = WithServices<NativeAnalyticsDep & SuiteSyncDep>;

const getMiddlewares = (getExtra: () => GetMiddlewaresDeps | null) => {
    const middlewares: Middleware[] = [
        messageSystemMiddleware,
        blockchainMiddleware,
        prepareFiatRatesMiddleware(getExtra),
        prepareDeviceMiddleware(getExtra),
        prepareDiscoveryMiddleware(getExtra),
        sendFormMiddleware,
        prepareTradingMiddleware(getExtra),
        prepareTradingLastErrorSentryMiddleware(getExtra),
        preparePushNotificationMiddleware(getExtra),
        prepareSuiteSyncMiddleware(getExtra),
        logsMiddleware,
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

type ReduxStoreDeps = {
    reducer: ReturnType<typeof prepareRootReducers>;
    extraDependencies: ExtraDependenciesStatic;
    preloadedState?: PreloadedState;
};

export type NativeReduxStore = ReduxStoreWithThunk<FullPersistedAppState, ExtraDependenciesNative>;

export type NativeReduxStoreDep = { store: NativeReduxStore };

export type ReduxStore = {
    store: NativeReduxStore;
    injectServicesIntoReduxExtra: (services: NativeServices) => void;
};

export type ReduxStoreDep = { reduxStore: ReduxStore };

export const createReduxStore = (deps: ReduxStoreDeps): ReduxStore => {
    const { getExtra, thunkMiddleware, injectServicesIntoReduxExtra } = createReduxExtra<
        FullPersistedAppState,
        NativeServices,
        ExtraDependenciesStatic
    >({ extraDependencies: deps.extraDependencies });

    const store = configureStore({
        preloadedState: deps.preloadedState as FullPersistedAppState,
        reducer: deps.reducer,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: false,
                serializableCheck: false,
                immutableCheck: false,
            })
                .prepend(thunkMiddleware)
                .prepend(deviceConnectionMiddleware.middleware)
                .concat(getMiddlewares(getExtra)),
        devTools: false, // Rozenite DevTools will be used instead of default browser dev tools.
        enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(enhancers),
    });

    return {
        store,
        injectServicesIntoReduxExtra,
    };
};
