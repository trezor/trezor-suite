import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import type {
    IsWrappedNativeTokenDep,
    NetworkIconDep,
    NetworkModuleRepositoryDep,
} from '@suite-common/networks';
import { mockNetworkIcon, mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';

import { TradingStackNavigator } from './TradingStackNavigator';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    createTradingTestStore,
    renderWithTradingProvider,
} from '../test-utils/tradingTestUtils';

type TradingStackNavigatorTestServices = NativeAnalyticsDep & {
    networks: NetworkModuleRepositoryDep & NetworkIconDep & IsWrappedNativeTokenDep;
};

const services: TradingStackNavigatorTestServices = {
    analytics: mockNativeAnalytics(),
    networks: {
        networkModuleRepository: mockNetworkModuleRepository(),
        networkIcon: mockNetworkIcon(),
        isWrappedNativeToken: () => false,
    },
};

const renderTradingStackNavigator = (
    overrides: PreloadedStatePartial<TradingTestPreloadedState>,
) => {
    const store = createTradingTestStore({ overrides });

    return renderWithTradingProvider<TradingStackNavigatorTestServices>(<TradingStackNavigator />, {
        services: {
            ...services,
            store: { ...store, dispatch: jest.fn() },
        },
    });
};

describe('TradingStackNavigator', () => {
    it('should render', async () => {
        const { getByTestId } = await renderTradingStackNavigator({
            featureFlags: createTradingFeatureFlags({}),
            messageSystem: mockMessageSystemStateWithFeatureFlags({}),
            wallet: {
                trading: {
                    isLoading: true,
                    info: { coins: undefined, platforms: undefined },
                },
            },
        });

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });

    it('should not render when all feature flags are disabled', async () => {
        const { queryByTestId } = await renderTradingStackNavigator({
            featureFlags: createTradingFeatureFlags({}),
            messageSystem: mockMessageSystemStateWithFeatureFlags({
                'trading.buy': false,
                'trading.exchange': false,
                'trading.sell': false,
                'trading.concierge': false,
            }),
        });

        expect(queryByTestId('@screen/Trading')).toBeFalsy();
    });
});
