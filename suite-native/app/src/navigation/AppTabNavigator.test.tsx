import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { getTranslation } from '@suite-native/intl';
import {
    fireEvent,
    mergePreloadedState,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { AppTabNavigator } from './AppTabNavigator';

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

        expect(getByText(getTranslation('navigation.tabs.home'))).toBeTruthy();
        expect(getByText(getTranslation('navigation.tabs.accountsList'))).toBeTruthy();
        expect(getByText(getTranslation('navigation.tabs.settings'))).toBeTruthy();
    });

    it('should not render Trade tab when all trading flags are disabled', () => {
        const { queryByText } = renderTabs({
            featureFlags: {
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
            messageSystem: mockMessageSystemStateWithFeatureFlags({
                'trading.buy': false,
                'trading.exchange': false,
                'trading.sell': false,
                'trading.concierge': false,
            }),
        });

        expect(queryByText(getTranslation('navigation.tabs.trade'))).toBe(null);
    });

    it('should render Trade tab when at least one trading flag is enabled', () => {
        const { getByText, getByTestId } = renderTabs({
            featureFlags: {
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
            },
            messageSystem: mockMessageSystemStateWithFeatureFlags({
                'trading.buy': false,
                'trading.exchange': true,
                'trading.sell': false,
                'trading.concierge': false,
            }),
        });

        fireEvent.press(getByText(getTranslation('navigation.tabs.trade')));

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });

    it('should render Earn tab', () => {
        const { queryByText } = renderTabs();

        expect(queryByText(getTranslation('navigation.tabs.earn'))).toBeTruthy();
    });
});
