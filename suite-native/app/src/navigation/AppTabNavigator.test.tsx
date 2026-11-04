import { type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { deviceInitialState } from '@suite-common/device';
import { Feature, messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    appSettingsInitialState,
    appSettingsReducer,
    toggleExperimentalFeature,
} from '@suite-native/settings';
import {
    act,
    createLightStore,
    createStaticReducer,
    fireEvent,
    mergePreloadedState,
    renderWithStoreProvider,
    within,
} from '@suite-native/test-utils-store';
import { FirmwareType } from '@trezor/device-utils';

import { AppTabNavigator } from './AppTabNavigator';

type NativeTabItemMockProps = PropsWithChildren<{
    selected: boolean;
    onClick?: () => void;
}>;

jest.mock(
    '../../../navigation/src/components/AdaptiveBottomTabNavigator/AdaptiveBottomTabView',
    () =>
        jest.requireActual(
            '../../../navigation/src/components/AdaptiveBottomTabNavigator/AdaptiveBottomTabView.tsx',
        ),
);

jest.mock('@expo/ui/jetpack-compose', () => {
    const { Fragment } = require('react');
    const { Pressable, Text, View } = require('react-native');

    return {
        Host: View,
        NavigationBar: View,
        Text,
        NavigationBarItem: Object.assign(
            ({ children, selected, onClick }: NativeTabItemMockProps) => (
                <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={onClick}
                >
                    {children}
                </Pressable>
            ),
            { Icon: Fragment, Label: Fragment },
        ),
    };
});

jest.mock('@suite-native/module-home', () => ({ HomeStackNavigator: () => null }));
jest.mock('@suite-native/module-accounts', () => ({
    AccountsStackNavigator: () => null,
}));
jest.mock('@suite-native/module-earn', () => ({ EarnStackNavigator: () => null }));
jest.mock('@suite-native/module-settings', () => {
    const { View } = require('react-native');

    return { SettingsScreen: () => <View testID="@screen/Settings" /> };
});
jest.mock('@suite-native/module-trading', () => {
    const { View } = require('react-native');

    return {
        TradingStackNavigator: () => <View testID="@screen/Trading" />,
    };
});

const baseState = {
    appSettings: appSettingsInitialState,
    device: deviceInitialState,
    featureFlags: featureFlagsInitialState,
    messageSystem: messageSystemInitialState,
    wallet: {
        trading: { residence: { country: null, wasOnboardingVisited: false } },
    },
};
const services = { analytics: mockNativeAnalytics() } satisfies NativeAnalyticsDep;

describe('AppTabNavigator', () => {
    afterEach(() => jest.restoreAllMocks());

    const renderTabs = (overrides: Record<string, unknown> = {}) =>
        renderWithStoreProvider(<AppTabNavigator />, {
            preloadedState: mergePreloadedState(baseState, overrides),
            services,
        });

    it('renders the existing tab bar by default', async () => {
        const { getByText, queryAllByRole } = await renderTabs();

        expect(getByText(getTranslation('navigation.tabs.home'))).toBeTruthy();
        expect(getByText(getTranslation('navigation.tabs.accountsList'))).toBeTruthy();
        expect(getByText(getTranslation('navigation.tabs.settings'))).toBeTruthy();
        expect(queryAllByRole('tab')).toHaveLength(0);
    });

    it('should not render Trade tab when all trading flags are disabled', async () => {
        const { queryByText } = await renderTabs({
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

    it('should not render Trade tab when the region is restricted', async () => {
        const { queryByText } = await renderTabs({
            messageSystem: mockMessageSystemStateWithFeatureFlags(
                { [Feature.regions.presenceRestriction]: true },
                { [Feature.regions.presenceRestriction]: { countries: ['US'] } },
            ),
        });

        expect(queryByText(getTranslation('navigation.tabs.trade'))).toBe(null);
    });

    it('should render Earn tab', async () => {
        const { queryByText } = await renderTabs();

        expect(queryByText(getTranslation('navigation.tabs.earn'))).toBeTruthy();
    });

    it('hides Earn for Bitcoin-only firmware', async () => {
        const { queryByText } = await renderTabs({
            device: {
                selectedDevice: mockSuiteDevice({ firmwareType: FirmwareType.BitcoinOnly }),
            },
        });

        expect(queryByText(getTranslation('navigation.tabs.earn'))).toBeNull();
    });

    it('uses native tabs when enabled and reports each Trade press once', async () => {
        jest.replaceProperty(Platform, 'OS', 'android');
        services.analytics.report.mockClear();

        const { getByText, getByTestId, getAllByRole, queryByText } = await renderTabs({
            appSettings: { experimentalFeatures: ['native-navigation'] },
            device: {
                selectedDevice: mockSuiteDevice({ firmwareType: FirmwareType.BitcoinOnly }),
            },
            messageSystem: mockMessageSystemStateWithFeatureFlags({ 'trading.buy': true }),
        });

        expect(getAllByRole('tab')).toHaveLength(4);
        expect(queryByText(getTranslation('navigation.tabs.earn'))).toBeNull();

        const tradeTab = getByText(getTranslation('navigation.tabs.trade'));
        await fireEvent.press(tradeTab);

        expect(getByTestId('@screen/Trading')).toBeTruthy();
        expect(services.analytics.report).toHaveBeenCalledTimes(1);

        await fireEvent.press(tradeTab);

        expect(services.analytics.report).toHaveBeenCalledTimes(2);
    });

    it('switches the tab bar live while keeping Settings selected', async () => {
        jest.replaceProperty(Platform, 'OS', 'android');
        const store = createLightStore({
            reducer: {
                appSettings: appSettingsReducer,
                locale: localeReducer,
                device: createStaticReducer(baseState.device),
                featureFlags: createStaticReducer(baseState.featureFlags),
                messageSystem: createStaticReducer(baseState.messageSystem),
                wallet: createStaticReducer({
                    ...baseState.wallet,
                    settings: initialWalletSettingsState,
                }),
            },
        });
        const { getByText, getByTestId, getByRole } = await renderWithStoreProvider(
            <AppTabNavigator />,
            { services: { ...services, store } },
        );
        await fireEvent.press(getByText(getTranslation('navigation.tabs.settings')));

        await act(() => {
            store.dispatch(toggleExperimentalFeature('native-navigation'));
        });

        expect(
            within(getByRole('tab', { selected: true })).getByText(
                getTranslation('navigation.tabs.settings'),
            ),
        ).toBeOnTheScreen();
        expect(getByTestId('@screen/Settings')).toBeOnTheScreen();

        await act(() => {
            store.dispatch(toggleExperimentalFeature('native-navigation'));
        });

        expect(getByTestId('@tabBar/Settings')).toBeSelected();
        expect(getByTestId('@screen/Settings')).toBeOnTheScreen();
    });
});
