import { type ReactElement } from 'react';

import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState } from '@suite-common/suite-sync';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { localeInitialState } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    type RenderOptionsExtended,
    type RenderResult,
    mergePreloadedState,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

export type { PreloadedStatePartial } from '@suite-native/test-utils-store';

const createBaseTradingPreloadedState = () => ({
    device: deviceInitialState,
    featureFlags: featureFlagsInitialState,
    locale: localeInitialState,
    messageSystem: messageSystemInitialState,
    suiteSyncData: initialSuiteSyncDataState,
    wallet: {
        ...getWalletState({ tradeType: 'buy' }),
    },
});

export type TradingTestPreloadedState = ReturnType<typeof createBaseTradingPreloadedState>;

export const createTradingPreloadedState = ({
    overrides = {},
}: {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
} = {}): TradingTestPreloadedState =>
    mergePreloadedState(createBaseTradingPreloadedState(), overrides);

type TradingProviderOptions = {
    overrides?: PreloadedStatePartial<TradingTestPreloadedState>;
};

type RenderWithTradingProviderOptions = TradingProviderOptions &
    Omit<RenderOptionsExtended, 'preloadedState'>;

export const renderWithTradingHistoryProvider = (
    element: ReactElement,
    { overrides, ...options }: RenderWithTradingProviderOptions = {},
): RenderResult =>
    renderWithStoreProvider(element, {
        preloadedState: createTradingPreloadedState({ overrides }),
        ...options,
    });
