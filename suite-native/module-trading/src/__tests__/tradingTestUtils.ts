import { type ReactElement } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { geolocationInitialState } from '@suite-common/geolocation';
import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    formDraftReducer,
    initialWalletSettingsState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { bluetoothInitialState } from '@suite-native/bluetooth';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { localeInitialState } from '@suite-native/intl';
import { appSettingsInitialState } from '@suite-native/settings';
import {
    type PreloadedStatePartial,
    type RenderHookOptionsExtended,
    type RenderOptionsExtended,
    createStaticReducer,
    createStoreFromPreloadedState,
    mergePreloadedState,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { tradingSlice } from '@suite-native/trading-state';

export type { PreloadedStatePartial } from '@suite-native/test-utils-store';

export type TradingTestTradeType = 'buy' | 'sell' | 'exchange';

const createBaseTradingPreloadedState = (tradeType: TradingTestTradeType) => ({
    appSettings: appSettingsInitialState,
    bluetooth: bluetoothInitialState,
    device: deviceInitialState,
    deviceAuthorization: deviceAuthorizationInitialState,
    geolocation: geolocationInitialState,
    featureFlags: featureFlagsInitialState,
    locale: localeInitialState,
    messageSystem: messageSystemInitialState,
    suiteSync: initialSuiteSyncState,
    suiteSyncData: initialSuiteSyncDataState,
    wallet: {
        ...getWalletState({ tradeType }),
        fees: {},
        formDrafts: {},
    },
});

export type TradingTestPreloadedState = ReturnType<typeof createBaseTradingPreloadedState>;

export const createTradingFeatureFlags = (
    overrides: Partial<typeof featureFlagsInitialState> = {},
) => ({
    ...featureFlagsInitialState,
    [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
    ...overrides,
});

export const createTradingPreloadedState = ({
    overrides = {},
    tradeType = 'buy',
}: {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
    tradeType?: TradingTestTradeType;
} = {}): TradingTestPreloadedState =>
    mergePreloadedState(createBaseTradingPreloadedState(tradeType), overrides);

export const createTradingTestStore = (args?: {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
    tradeType?: TradingTestTradeType;
}) => createStoreFromPreloadedState(createTradingPreloadedState(args));

/**
 * Creates a store with a real trading reducer (responds to dispatched actions)
 * plus static reducers for all other slices.
 * Use this for tests that dispatch trading actions and assert on state changes.
 */
export const createTradingLightStore = (args?: {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
    tradeType?: TradingTestTradeType;
}) => {
    const preloadedState = createTradingPreloadedState(args);

    const reducer = {
        appSettings: createStaticReducer(preloadedState.appSettings),
        bluetooth: createStaticReducer(preloadedState.bluetooth),
        device: createStaticReducer(preloadedState.device),
        deviceAuthorization: createStaticReducer(preloadedState.deviceAuthorization),
        featureFlags: createStaticReducer(preloadedState.featureFlags),
        geolocation: createStaticReducer(preloadedState.geolocation),
        locale: createStaticReducer(preloadedState.locale),
        messageSystem: createStaticReducer(preloadedState.messageSystem),
        suiteSync: createStaticReducer(preloadedState.suiteSync),
        suiteSyncData: createStaticReducer(preloadedState.suiteSyncData),
        wallet: combineReducers({
            settings: createStaticReducer(
                preloadedState.wallet.settings ?? initialWalletSettingsState,
            ),
            accounts: createStaticReducer(preloadedState.wallet.accounts ?? []),
            fiat: createStaticReducer(preloadedState.wallet.fiat ?? {}),
            fees: createStaticReducer(preloadedState.wallet.fees ?? {}),
            formDrafts: formDraftReducer,
            send: createStaticReducer(preloadedState.wallet.send ?? {}),
            transactions: createStaticReducer(transactionsInitialState),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    return configureMockStore({
        reducer,
        preloadedState: {
            wallet: {
                trading: preloadedState.wallet.trading,
                formDrafts: preloadedState.wallet.formDrafts ?? {},
            },
        },
    });
};

type TradingProviderOptions = {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
    tradeType?: TradingTestTradeType;
};

type RenderWithTradingProviderOptions = TradingProviderOptions &
    Omit<RenderOptionsExtended, 'preloadedState'>;

type RenderHookWithTradingProviderOptions<Props> = TradingProviderOptions &
    Omit<RenderHookOptionsExtended<Props>, 'preloadedState'>;

export const renderWithTradingProvider = (
    element: ReactElement,
    { overrides, tradeType, ...options }: RenderWithTradingProviderOptions = {},
) =>
    renderWithStoreProvider(element, {
        preloadedState: createTradingPreloadedState({ overrides, tradeType }),
        ...options,
    });

export const renderHookWithTradingProvider = <Result, Props>(
    callback: (props: Props) => Result,
    { overrides, tradeType, ...options }: RenderHookWithTradingProviderOptions<Props> = {},
) =>
    renderHookWithStoreProvider<Result, Props>(callback, {
        preloadedState: createTradingPreloadedState({ overrides, tradeType }),
        ...options,
    });
