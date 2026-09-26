import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { icons } from '@suite-native/icons';
import { getTranslation } from '@suite-native/intl';
import {
    fireEvent,
    mergePreloadedState,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { AppTabNavigator } from './AppTabNavigator';

jest.mock('@suite-native/module-home', () => ({ HomeStackNavigator: () => null }));
jest.mock('@suite-native/module-accounts-management', () => ({
    AccountsStackNavigator: () => {
        const { View } = require('react-native');

        return <View testID="@screen/Accounts" />;
    },
}));
jest.mock('@suite-native/module-earn', () => ({ EarnStackNavigator: () => null }));
jest.mock('@suite-native/module-settings', () => ({ SettingsScreen: () => null }));
jest.mock('@suite-native/module-trading', () => {
    const { View } = require('react-native');

    return {
        TradingStackNavigator: () => <View testID="@screen/Trading" />,
    };
});
jest.mock('@expo/ui/swift-ui', () => {
    const { Pressable, Text, View } = require('react-native');

    return {
        Host: ({ children }: { children: React.ReactNode }) => (
            <View testID="@tabBar/native">{children}</View>
        ),
        HStack: View,
        VStack: View,
        Button: ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
            <Pressable onPress={onPress}>{children}</Pressable>
        ),
        Image: () => null,
        Text,
    };
});
jest.mock('@expo/ui/jetpack-compose', () => {
    const { Pressable, Text, View } = require('react-native');
    const NavigationBarItem = Object.assign(
        ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
            <Pressable onPress={onClick}>{children}</Pressable>
        ),
        { Icon: View, Label: View },
    );

    return {
        Host: ({ children }: { children: React.ReactNode }) => (
            <View testID="@tabBar/native">{children}</View>
        ),
        Icon: () => null,
        NavigationBar: View,
        NavigationBarItem,
        Text,
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
const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

describe('AppTabNavigator', () => {
    const renderTabs = async (overrides: Record<string, unknown> = {}) =>
        await renderWithStoreProvider(<AppTabNavigator />, {
            preloadedState: mergePreloadedState(baseState, overrides),
            services,
        });

    it('should render 3 buttons', async () => {
        const { getByText } = await renderTabs();

        expect(getByText(getTranslation('navigation.tabs.home'))).toBeTruthy();
        expect(getByText(getTranslation('navigation.tabs.accountsList'))).toBeTruthy();
        expect(getByText(getTranslation('navigation.tabs.settings'))).toBeTruthy();
    });

    it('uses native tabs to switch to Accounts', async () => {
        const { getByTestId, getByText } = await renderTabs();

        expect(getByTestId('@tabBar/native')).toBeTruthy();

        await fireEvent.press(getByText(getTranslation('navigation.tabs.accountsList')));

        expect(getByTestId('@screen/Accounts')).toBeTruthy();
    });

    it('shows the original icon for every tab in its selected and unselected states', async () => {
        const { getByText } = await renderTabs({
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
        const tabIcons = [
            { title: 'navigation.tabs.home', regular: 'house', selected: 'houseFilled' },
            {
                title: 'navigation.tabs.accountsList',
                regular: 'discover',
                selected: 'discoverFilled',
            },
            { title: 'navigation.tabs.trade', regular: 'repeat', selected: 'repeat' },
            { title: 'navigation.tabs.earn', regular: 'piggyBank', selected: 'piggyBankFilled' },
            { title: 'navigation.tabs.settings', regular: 'gear', selected: 'gearFilled' },
        ] as const;

        for (const activeTab of tabIcons) {
            await fireEvent.press(getByText(getTranslation(activeTab.title)));

            for (const tab of tabIcons) {
                const iconName = tab === activeTab ? tab.selected : tab.regular;

                expect(getByText(String.fromCodePoint(icons[iconName]))).toBeTruthy();
            }
        }
    });

    it('should not render Trade tab when all trading flags are disabled', async () => {
        const { queryByText } = await renderTabs({
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

    it('should render Trade tab when at least one trading flag is enabled', async () => {
        const { getByText, getByTestId } = await renderTabs({
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

        await fireEvent.press(getByText(getTranslation('navigation.tabs.trade')));

        expect(getByTestId('@screen/Trading')).toBeTruthy();
    });

    it('should render Earn tab', async () => {
        const { queryByText } = await renderTabs();

        expect(queryByText(getTranslation('navigation.tabs.earn'))).toBeTruthy();
    });
});
