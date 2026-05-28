import { View } from 'react-native';

import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import {
    StoreProviderForExpoRouterTests,
    mergePreloadedState,
} from '@suite-native/test-utils-store';

import AppTabsLayout from '../../app/AppTabs/_layout';

const baseState = {
    device: deviceInitialState,
    featureFlags: featureFlagsInitialState,
    messageSystem: messageSystemInitialState,
    wallet: {
        trading: { residence: { country: null, wasOnboardingVisited: false } },
    },
};

const renderTabs = (overrides: Record<string, unknown> = {}) => {
    const result = renderRouter(
        {
            _layout: AppTabsLayout,
            HomeStack: () => null,
            AccountsStack: () => null,
            TradeStack: () => <View testID="@screen/Trading" />,
            EarnStack: () => null,
            Settings: () => null,
        },
        {
            initialUrl: '/HomeStack',
            linking: { enabled: false },
            wrapper: ({ children }) => (
                <StoreProviderForExpoRouterTests
                    preloadedState={mergePreloadedState(baseState, overrides)}
                >
                    {children}
                </StoreProviderForExpoRouterTests>
            ),
        },
    );

    // renderRouter installs jest.useFakeTimers(); flush queued navigation effects synchronously
    // so subsequent queries can see the mounted tab bar without polling.
    act(() => {
        jest.runAllTimers();
    });

    return result;
};

describe('AppTabs layout', () => {
    afterEach(() => {
        // renderRouter calls jest.useFakeTimers(); restore real timers so cleanup() can settle.
        jest.useRealTimers();
    });

    it('should render Home, My assets, Earn, and Settings tabs', () => {
        renderTabs();

        expect(screen.getByText('Home')).toBeTruthy();
        expect(screen.getByText('My assets')).toBeTruthy();
        expect(screen.getByText('Earn')).toBeTruthy();
        expect(screen.getByText('Settings')).toBeTruthy();
    });

    it('should not render Trade tab when all trading flags are disabled', () => {
        renderTabs({
            featureFlags: {
                [FeatureFlag.IsTradingBuyEnabled]: false,
                [FeatureFlag.IsTradingExchangeEnabled]: false,
                [FeatureFlag.IsTradingSellEnabled]: false,
                [FeatureFlag.IsTradingConciergeEnabled]: false,
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
            messageSystem: mockMessageSystemStateWithFeatureFlags({
                'trading.buy': false,
                'trading.exchange': false,
                'trading.sell': false,
                'trading.concierge': false,
            }),
        });

        expect(screen.queryByText('Trade')).toBe(null);
    });

    it('should render Trade tab and navigate to it when at least one trading flag is enabled', () => {
        renderTabs({
            featureFlags: {
                [FeatureFlag.IsTradingBuyEnabled]: true,
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
        });

        act(() => {
            fireEvent.press(screen.getByText('Trade'));
            jest.runAllTimers();
        });

        expect(screen.getByTestId('@screen/Trading')).toBeTruthy();
    });
});
