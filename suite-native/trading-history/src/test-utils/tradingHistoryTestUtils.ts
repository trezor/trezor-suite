import { type ReactElement } from 'react';

import { type AnalyticsRootState, analyticsInitialState } from '@suite-common/analytics-redux';
import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { type GeolocationRootState, geolocationInitialState } from '@suite-common/geolocation';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { type SuiteSyncDataRootState, initialSuiteSyncDataState } from '@suite-common/suite-sync';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type SendRootState,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
import { type FeatureFlagsRootState, featureFlagsInitialState } from '@suite-native/feature-flags';
import { type LocaleSliceRootState, localeInitialState } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    type RenderOptionsExtended,
    type RenderResult,
    mergePreloadedState,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

export type { PreloadedStatePartial } from '@suite-native/test-utils-store';

const createBaseTradingPreloadedState = (): TradingTestPreloadedState => ({
    analytics: analyticsInitialState,
    device: deviceInitialState,
    featureFlags: featureFlagsInitialState,
    geolocation: geolocationInitialState,
    locale: localeInitialState,
    messageSystem: messageSystemInitialState,
    suiteSyncData: initialSuiteSyncDataState,
    wallet: {
        ...getWalletState({ tradeType: 'buy' }),
    },
});

export type TradingTestPreloadedState = AnalyticsRootState &
    DeviceRootState &
    FeatureFlagsRootState &
    GeolocationRootState &
    LocaleSliceRootState &
    MessageSystemRootState &
    SuiteSyncDataRootState &
    TradingRootState &
    AccountsRootState &
    WalletSettingsRootState &
    FiatRatesRootState &
    SendRootState;

export const createTradingPreloadedState = ({
    overrides = {},
}: {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
} = {}): TradingTestPreloadedState =>
    mergePreloadedState(createBaseTradingPreloadedState(), overrides);

type TradingProviderOptions = {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
};

type RenderWithTradingProviderOptions<TServices extends object> = TradingProviderOptions &
    Omit<RenderOptionsExtended<TServices>, 'preloadedState'>;

export const renderWithTradingHistoryProvider = <TServices extends object>(
    element: ReactElement,
    { overrides, ...options }: RenderWithTradingProviderOptions<TServices> = {},
): Promise<RenderResult> =>
    renderWithStoreProvider(element, {
        preloadedState: createTradingPreloadedState({ overrides }),
        ...options,
    });
