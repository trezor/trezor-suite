import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import {
    fireEvent,
    mergePreloadedState,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { AppTabNavigator } from '../AppTabNavigator';

jest.mock('@suite-native/module-home', () => ({ HomeStackNavigator: () => null }));
jest.mock('@suite-native/module-accounts-management', () => ({
    AccountsStackNavigator: () => null,
}));
jest.mock('@suite-native/module-earn', () => ({ EarnStackNavigator: () => null }));
jest.mock('@suite-native/module-settings', () => ({ SettingsScreen: () => null }));
jest.mock('@suite-native/module-trading', () => {
    const { View } = require('react-native');

    return {
        TradingStackNavigator: () => <View testID="@screen/Trading" />,
    };
});

const baseState = {
    device: deviceInitialState,
    featureFlags: featureFlagsInitialState,
    messageSystem: messageSystemInitialState,
    wallet: {
        trading: { residence: { country: null, wasOnboardingVisited: false } },
    },
};

describe('AppTabNavigator', () => {
    const renderTabs = (overrides: Record<string, unknown> = {}) =>
        renderWithStoreProvider(<AppTabNavigator />, {
            preloadedState: mergePreloadedState(baseState, overrides),
        });

    it('should render 3 buttons', () => {
        const { getByText } = renderTabs();

        expect(getByText('Home')).toBeTruthy();
        expect(getByText('My assets')).toBeTruthy();
        expect(getByText('Settings')).toBeTruthy();
    });

    it('should not render Trade tab when all trading flags are disabled', () => {
        const { queryByText } = renderTabs({
            featureFlags: {
                [FeatureFlag.IsTradingBuyEnabled]: false,
                [FeatureFlag.IsTradingExchangeEnabled]: false,
                [FeatureFlag.IsTradingSellEnabled]: false,
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
            messageSystem: mockMessageSystemStateWithFeatureFlags({
                'trading.buy': false,
                'trading.exchange': false,
                'trading.sell': false,
            }),
        });

        expect(queryByText('Trade')).toBe(null);
    });

    it('should render Trade tab when at least one trading flag is enabled', () => {
        const { getByText, getByTestId } = renderTabs({
            featureFlags: {
                [FeatureFlag.IsTradingBuyEnabled]: true,
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
        });

        fireEvent.press(getByText('Trade'));

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });

    it('should render Earn tab', () => {
        const { queryByText } = renderTabs();

        expect(queryByText('Earn')).toBeTruthy();
    });
});
