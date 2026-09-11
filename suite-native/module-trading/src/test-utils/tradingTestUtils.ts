import { type ReactElement } from 'react';

import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { type DiscreetModeRootState } from '@suite-common/discreet-mode';
import { type GeolocationRootState, geolocationInitialState } from '@suite-common/geolocation';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { type NetworksRootState } from '@suite-common/networks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type ReduxStoreWithThunk } from '@suite-common/redux-utils';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncState,
    initialSuiteSyncDataState,
    initialSuiteSyncState,
} from '@suite-common/suite-sync';
import { type NotificationsRootState } from '@suite-common/toast-notifications';
import {
    type TokenDefinitionsRootState,
    tokenDefinitionsInitialState,
} from '@suite-common/token-definitions';
import {
    type TradingRootStateWithDeviceAndAccounts,
    type TradingType,
} from '@suite-common/trading';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import {
    type FeesRootState,
    type FiatRatesRootState,
    type FormDraftRootState,
    type PhishingRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    formDraftReducer,
    initialWalletSettingsState,
    phishingInitialState,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { type NativeBluetoothRootState, bluetoothInitialState } from '@suite-native/bluetooth';
import {
    type DeviceAuthorizationRootState,
    deviceAuthorizationInitialState,
} from '@suite-native/device-authorization';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    type FeatureFlagsState,
    featureFlagsInitialState,
} from '@suite-native/feature-flags';
import { type LocaleSliceRootState, localeInitialState } from '@suite-native/intl';
import { type SettingsSliceRootState, appSettingsInitialState } from '@suite-native/settings';
import {
    type PreloadedStatePartial,
    type RenderHookOptionsExtended,
    type RenderOptionsExtended,
    createStaticReducer,
    mergePreloadedState,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { type TradingRootState, tradingSlice } from '@suite-native/trading-state';
import {
    type NativeSendRootState,
    sendFormInitialState,
} from '@suite-native/transaction-management';

export type { PreloadedStatePartial } from '@suite-native/test-utils-store';

const createBaseTradingPreloadedState = (tradeType: TradingType): TradingTestPreloadedState => {
    const wallet = getWalletState({ tradeType });

    return {
        networks: mockNetworksState(mockGetSupportedNetworks()),
        appSettings: appSettingsInitialState,
        bluetooth: bluetoothInitialState,
        device: deviceInitialState,
        discreetMode: { isActive: false },
        deviceAuthorization: deviceAuthorizationInitialState,
        geolocation: geolocationInitialState,
        featureFlags: featureFlagsInitialState,
        locale: localeInitialState,
        messageSystem: messageSystemInitialState,
        suiteSync: initialSuiteSyncState,
        suiteSyncData: initialSuiteSyncDataState,
        notifications: [],
        tokenDefinitions: tokenDefinitionsInitialState,
        wallet: {
            ...wallet,
            settings: { ...initialWalletSettingsState, ...wallet.settings },
            selectedAccount: { status: 'none' },
            send: { ...sendFormInitialState, ...wallet.send },
            fees: {},
            formDrafts: {},
            phishing: phishingInitialState,
            transactions: transactionsInitialState,
        },
    };
};

export type TradingTestPreloadedState = TradingRootState &
    NetworksRootState &
    TradingRootStateWithDeviceAndAccounts &
    WalletSettingsRootState &
    FiatRatesRootState &
    FeesRootState &
    FormDraftRootState &
    PhishingRootState &
    TransactionsRootState &
    NativeSendRootState &
    NativeBluetoothRootState &
    DeviceAuthorizationRootState &
    SettingsSliceRootState &
    FeatureFlagsRootState &
    LocaleSliceRootState &
    GeolocationRootState &
    MessageSystemRootState &
    WithSuiteSyncState &
    SuiteSyncDataRootState &
    TokenDefinitionsRootState &
    DiscreetModeRootState &
    NotificationsRootState;

type TradingProviderOptions = {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
    tradeType?: TradingType;
};

export const createTradingFeatureFlags = (
    overrides: Partial<FeatureFlagsState> = {},
): FeatureFlagsState => ({
    ...featureFlagsInitialState,
    [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
    ...overrides,
});

export const createTradingPreloadedState = ({
    overrides = {},
    tradeType = 'buy',
}: TradingProviderOptions = {}): TradingTestPreloadedState =>
    mergePreloadedState(createBaseTradingPreloadedState(tradeType), overrides);

export const createTradingTestStore = (
    args: TradingProviderOptions = {},
): ReduxStoreWithThunk<TradingTestPreloadedState, Record<never, never>> => {
    const preloadedState = createTradingPreloadedState(args);

    const reducer = {
        networks: createStaticReducer(preloadedState.networks),
        appSettings: createStaticReducer(preloadedState.appSettings),
        bluetooth: createStaticReducer(preloadedState.bluetooth),
        device: createStaticReducer(preloadedState.device),
        discreetMode: createStaticReducer(preloadedState.discreetMode),
        deviceAuthorization: createStaticReducer(preloadedState.deviceAuthorization),
        featureFlags: createStaticReducer(preloadedState.featureFlags),
        geolocation: createStaticReducer(preloadedState.geolocation),
        locale: createStaticReducer(preloadedState.locale),
        messageSystem: createStaticReducer(preloadedState.messageSystem),
        notifications: createStaticReducer(preloadedState.notifications),
        suiteSync: createStaticReducer(preloadedState.suiteSync),
        suiteSyncData: createStaticReducer(preloadedState.suiteSyncData),
        tokenDefinitions: createStaticReducer(preloadedState.tokenDefinitions),
        wallet: combineReducers({
            selectedAccount: createStaticReducer(preloadedState.wallet.selectedAccount),
            settings: createStaticReducer(preloadedState.wallet.settings),
            accounts: createStaticReducer(preloadedState.wallet.accounts),
            fiat: createStaticReducer(preloadedState.wallet.fiat),
            fees: createStaticReducer(preloadedState.wallet.fees),
            formDrafts: formDraftReducer,
            phishing: createStaticReducer(preloadedState.wallet.phishing),
            send: createStaticReducer(preloadedState.wallet.send),
            transactions: createStaticReducer(preloadedState.wallet.transactions),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    return configureStore({
        reducer,
        preloadedState,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: { extraArgument: {} },
                serializableCheck: false,
                immutableCheck: false,
            }),
    });
};

export const renderWithTradingProvider = <TServices extends object>(
    element: ReactElement,
    {
        overrides,
        tradeType,
        services,
        ...options
    }: TradingProviderOptions & Omit<RenderOptionsExtended<TServices>, 'preloadedState'> = {},
) =>
    renderWithStoreProvider(element, {
        ...options,
        services: {
            ...services,
            store: services?.store ?? createTradingTestStore({ overrides, tradeType }),
        },
    });

export const renderHookWithTradingProvider = <Result, Props, TServices extends object>(
    callback: (props: Props) => Result,
    {
        overrides,
        tradeType,
        services,
        ...options
    }: TradingProviderOptions &
        Omit<RenderHookOptionsExtended<Props, TServices>, 'preloadedState'> = {},
) =>
    renderHookWithStoreProvider(callback, {
        ...options,
        services: {
            ...services,
            store: services?.store ?? createTradingTestStore({ overrides, tradeType }),
        },
    });
