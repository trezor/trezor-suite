import {
    Image,
    Pressable as NativePressable,
    Text as NativeText,
    View as NativeView,
    Platform,
} from 'react-native';
import { type TabsHostProps, type TabsScreenProps } from 'react-native-screens';

import { useNavigation } from '@react-navigation/native';
import {
    type NativeStackHeaderItemButton,
    type NativeStackNavigationProp,
    createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { DeviceType } from 'expo-device';

import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { type IconName, icons } from '@suite-native/icons';
import { getTranslation } from '@suite-native/intl';
import {
    AccountsStackRoutes,
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import {
    act,
    fireEvent,
    mergePreloadedState,
    renderWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';
import { FirmwareType } from '@trezor/device-utils';

import { AppTabNavigator } from './AppTabNavigator';
import { type NativeTabIcons } from './useNativeTabIcons';

let mockDeviceModelName: string | null = null;
let mockDeviceType = DeviceType.PHONE;
let mockEarnStackContent: React.ReactNode = null;
const originalNativeTabsOverride = process.env.EXPO_PUBLIC_NATIVE_TABS;
const nativeIconNames: IconName[] = [
    'house',
    'houseFilled',
    'discover',
    'discoverFilled',
    'repeat',
    'piggyBank',
    'piggyBankFilled',
    'gear',
    'gearFilled',
];
const originalNativeTabIcons: NativeTabIcons = Object.fromEntries(
    nativeIconNames.map(iconName => [
        iconName,
        { uri: `file:///${iconName}.png`, width: 24, height: 24, scale: 3 },
    ]),
);
let mockNativeTabIcons = originalNativeTabIcons;

jest.mock('expo-device', () => ({
    ...jest.requireActual('expo-device'),
    get modelName() {
        return mockDeviceModelName;
    },
    get deviceType() {
        return mockDeviceType;
    },
}));
jest.mock('./useNativeTabIcons', () => ({
    useNativeTabIcons: () => mockNativeTabIcons,
}));
jest.mock('react-native-screens', () => {
    const { View } = require('react-native');

    return {
        ...jest.requireActual('react-native-screens'),
        Tabs: {
            Host: (props: TabsHostProps) => <View {...props} testID="@systemTabs" />,
            Screen: (props: TabsScreenProps) => (
                <View {...props} testID={`@systemTabs/${props.title}`} />
            ),
        },
    };
});

jest.mock('@suite-native/module-home', () => ({ HomeStackNavigator: () => null }));
jest.mock('@suite-native/module-accounts-management', () => ({
    AccountsStackNavigator: () => {
        const { View } = require('react-native');
        const { useRoute } = require('@react-navigation/native');
        const route = useRoute();

        return <View testID="@screen/Accounts" accessibilityLabel={route.params?.screen} />;
    },
}));
jest.mock('@suite-native/module-earn', () => ({
    EarnStackNavigator: () => mockEarnStackContent,
}));
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

const RootStack = createNativeStackNavigator<RootStackParamList>();
type TestEarnStackParamList = { Landing: undefined; Detail: undefined };
const TestEarnStack = createNativeStackNavigator<TestEarnStackParamList>();

type HeaderButtonProbeProps = { item: NativeStackHeaderItemButton };

const HeaderButtonProbe = ({ item }: HeaderButtonProbeProps) => (
    <NativePressable
        accessibilityRole="button"
        accessibilityLabel={item.accessibilityLabel}
        accessibilityState={{ selected: item.selected }}
        onPress={item.onPress}
        testID={item.identifier}
    >
        {item.icon?.type === 'image' && (
            <Image
                source={item.icon.source}
                tintColor={item.tintColor}
                testID={`${item.identifier}/icon`}
            />
        )}
        <NativeText>{item.label}</NativeText>
    </NativePressable>
);

const RootTabsFixture = () => (
    <RootStack.Navigator
        initialRouteName={RootStackRoutes.AppTabs}
        screenOptions={{ headerShown: false }}
        screenLayout={({ children, options }) => (
            <NativeView>
                <NativeView
                    testID="@parentHeader"
                    accessibilityLabel={options.headerShown ? 'shown' : 'hidden'}
                >
                    {options
                        .unstable_headerLeftItems?.({})
                        .map(item =>
                            item.type === 'button' ? (
                                <HeaderButtonProbe key={item.identifier} item={item} />
                            ) : null,
                        )}
                </NativeView>
                {children}
            </NativeView>
        )}
    >
        <RootStack.Screen name={RootStackRoutes.AppTabs}>
            {() => <AppTabNavigator />}
        </RootStack.Screen>
    </RootStack.Navigator>
);

const EarnLandingFixture = () => {
    const navigation = useNavigation<NativeStackNavigationProp<TestEarnStackParamList>>();

    return (
        <NativePressable testID="@earn/landing" onPress={() => navigation.navigate('Detail')}>
            <NativeText>Detail</NativeText>
        </NativePressable>
    );
};

const EarnDetailFixture = () => <NativeView testID="@earn/detail" />;

describe('AppTabNavigator', () => {
    const renderTabs = async (overrides: Record<string, unknown> = {}) =>
        await renderWithStoreProvider(<AppTabNavigator />, {
            preloadedState: mergePreloadedState(baseState, overrides),
            services,
        });

    const renderRootTabs = async (overrides: Record<string, unknown> = {}) =>
        await renderWithStoreProvider(<RootTabsFixture />, {
            preloadedState: mergePreloadedState(baseState, overrides),
            services,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockDeviceModelName = null;
        mockDeviceType = DeviceType.PHONE;
        mockEarnStackContent = null;
        mockNativeTabIcons = originalNativeTabIcons;
        delete process.env.EXPO_PUBLIC_NATIVE_TABS;
    });

    afterEach(() => {
        jest.restoreAllMocks();

        if (originalNativeTabsOverride === undefined) {
            delete process.env.EXPO_PUBLIC_NATIVE_TABS;
        } else {
            process.env.EXPO_PUBLIC_NATIVE_TABS = originalNativeTabsOverride;
        }
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

    it('keeps Expo UI tabs on Android even for the Duo model or development override', async () => {
        jest.replaceProperty(Platform, 'OS', 'android');
        mockDeviceModelName = 'iPhone Duo';
        process.env.EXPO_PUBLIC_NATIVE_TABS = '1';

        const { getByTestId, queryByTestId } = await renderTabs();

        expect(getByTestId('@tabBar/native')).toBeTruthy();
        expect(queryByTestId('@systemTabs')).toBeNull();
    });

    describe('iPhone Duo system tabs', () => {
        beforeEach(() => {
            jest.replaceProperty(Platform, 'OS', 'ios');
            mockDeviceModelName = 'iPhone Duo';
        });

        it('uses five parent header buttons to select tabs with original icons and single Trade analytics', async () => {
            const { getByTestId } = await renderRootTabs({
                featureFlags: { [FeatureFlag.IsTradingResidenceCheckEnabled]: false },
                messageSystem: mockMessageSystemStateWithFeatureFlags({
                    'trading.buy': false,
                    'trading.exchange': true,
                    'trading.sell': false,
                    'trading.concierge': false,
                }),
            });
            const expectedIcons = [
                { route: AppTabsRoutes.HomeStack, icon: 'houseFilled' },
                { route: AppTabsRoutes.AccountsStack, icon: 'discover' },
                { route: AppTabsRoutes.TradeStack, icon: 'repeat' },
                { route: AppTabsRoutes.EarnStack, icon: 'piggyBank' },
                { route: AppTabsRoutes.Settings, icon: 'gear' },
            ] as const;
            const selectedTint = getByTestId('@tabBar/HomeStack/icon').props.tintColor;
            const inactiveTint = getByTestId('@tabBar/AccountsStack/icon').props.tintColor;

            expect(getByTestId('@parentHeader').props.accessibilityLabel).toBe('shown');
            expect(getByTestId('@systemTabs').props.tabBarHidden).toBe(true);
            expect(selectedTint).toBeDefined();
            expect(inactiveTint).toBeDefined();
            expect(selectedTint).not.toEqual(inactiveTint);

            for (const { route, icon } of expectedIcons) {
                const selected = route === AppTabsRoutes.HomeStack;

                expect(getByTestId(`@tabBar/${route}`).props.accessibilityState.selected).toBe(
                    selected,
                );
                expect(getByTestId(`@tabBar/${route}/icon`).props.source).toEqual(
                    originalNativeTabIcons[icon],
                );
                expect(getByTestId(`@tabBar/${route}/icon`).props.tintColor).toEqual(
                    selected ? selectedTint : inactiveTint,
                );
            }

            await fireEvent.press(getByTestId('@tabBar/AccountsStack'));
            await fireEvent.press(getByTestId('@tabBar/AccountsStack'));

            expect(getByTestId('@screen/Accounts').props.accessibilityLabel).toBe(
                AccountsStackRoutes.Accounts,
            );
            expect(getByTestId('@tabBar/AccountsStack/icon').props.source).toEqual(
                originalNativeTabIcons.discoverFilled,
            );
            expect(getByTestId('@tabBar/AccountsStack').props.accessibilityState.selected).toBe(
                true,
            );

            await fireEvent.press(getByTestId('@tabBar/TradeStack'));

            const trade = getByTestId(`@systemTabs/${getTranslation('navigation.tabs.trade')}`);

            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: trade.props.screenKey,
                    provenance: 1,
                    actionOrigin: 'programmatic-js',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });

            expect(getByTestId('@screen/Trading')).toBeTruthy();
            expect(getByTestId('@tabBar/TradeStack').props.accessibilityState.selected).toBe(true);
            expect(services.analytics.report).toHaveBeenCalledTimes(1);
            expect(services.analytics.report).toHaveBeenCalledWith({
                type: events.tradingNavigateEvent.name,
                payload: { action: 'navigate', type: 'buy', from: 'trade' },
            });
        });

        it('pops a nested native stack to its root when pressing the selected header tab again', async () => {
            mockEarnStackContent = (
                <TestEarnStack.Navigator screenOptions={{ headerShown: false }}>
                    <TestEarnStack.Screen name="Landing" component={EarnLandingFixture} />
                    <TestEarnStack.Screen name="Detail" component={EarnDetailFixture} />
                </TestEarnStack.Navigator>
            );

            const { getByTestId, queryByTestId } = await renderRootTabs();

            await fireEvent.press(getByTestId('@tabBar/EarnStack'));
            await fireEvent.press(getByTestId('@earn/landing'));

            expect(getByTestId('@earn/detail')).toBeTruthy();

            await fireEvent.press(getByTestId('@tabBar/EarnStack'));

            await waitFor(() => expect(queryByTestId('@earn/detail')).toBeNull());
            expect(getByTestId('@earn/landing')).toBeTruthy();
            expect(getByTestId('@tabBar/EarnStack').props.accessibilityState.selected).toBe(true);
        });

        it('clears parent header options when switching back to ordinary iPhone tabs', async () => {
            const { getByTestId, queryByTestId, rerender } = await renderRootTabs();

            expect(getByTestId('@parentHeader').props.accessibilityLabel).toBe('shown');

            mockDeviceModelName = 'iPhone 17';
            await rerender(<RootTabsFixture />);

            expect(getByTestId('@parentHeader').props.accessibilityLabel).toBe('hidden');
            expect(queryByTestId('@tabBar/HomeStack')).toBeNull();
            expect(queryByTestId('@systemTabs')).toBeNull();
            expect(getByTestId('@tabBar/native')).toBeTruthy();
        });

        it('keeps the ordinary tab bar and no parent header on iPad with the development override', async () => {
            mockDeviceModelName = 'iPad Pro';
            mockDeviceType = DeviceType.TABLET;
            process.env.EXPO_PUBLIC_NATIVE_TABS = '1';

            const { getByTestId, queryByTestId } = await renderRootTabs();

            expect(getByTestId('@parentHeader').props.accessibilityLabel).toBe('hidden');
            expect(queryByTestId('@tabBar/HomeStack')).toBeNull();
            expect(queryByTestId('@systemTabs')).toBeNull();
            expect(getByTestId('@tabBar/native')).toBeTruthy();
        });

        it('uses original template images for regular and selected icons', async () => {
            const { getByTestId, queryByTestId } = await renderTabs({
                featureFlags: { [FeatureFlag.IsTradingResidenceCheckEnabled]: false },
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
                {
                    title: 'navigation.tabs.earn',
                    regular: 'piggyBank',
                    selected: 'piggyBankFilled',
                },
                { title: 'navigation.tabs.settings', regular: 'gear', selected: 'gearFilled' },
            ] as const;

            expect(getByTestId('@systemTabs')).toBeTruthy();
            expect(queryByTestId('@tabBar/native')).toBeNull();

            for (const tab of tabIcons) {
                const nativeTab = getByTestId(`@systemTabs/${getTranslation(tab.title)}`);

                expect(nativeTab.props.ios.icon).toEqual({
                    type: 'templateSource',
                    templateSource: originalNativeTabIcons[tab.regular],
                });
                expect(nativeTab.props.ios.selectedIcon).toEqual({
                    type: 'templateSource',
                    templateSource: originalNativeTabIcons[tab.selected],
                });
            }
        });

        it('switches to Accounts from a native selection and preserves its initial nested route', async () => {
            const { getByTestId, queryByTestId } = await renderTabs();
            const accounts = getByTestId(
                `@systemTabs/${getTranslation('navigation.tabs.accountsList')}`,
            );
            const home = getByTestId(`@systemTabs/${getTranslation('navigation.tabs.home')}`);

            expect(queryByTestId('@screen/Accounts')).toBeNull();

            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: accounts.props.screenKey,
                    provenance: 1,
                    actionOrigin: 'user',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });

            expect(getByTestId('@systemTabs').props.navStateRequest).toEqual({
                selectedScreenKey: accounts.props.screenKey,
                baseProvenance: 1,
            });
            expect(getByTestId('@screen/Accounts').props.accessibilityLabel).toBe(
                AccountsStackRoutes.Accounts,
            );

            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: home.props.screenKey,
                    provenance: 2,
                    actionOrigin: 'user',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });

            expect(getByTestId('@systemTabs').props.navStateRequest.selectedScreenKey).toBe(
                home.props.screenKey,
            );
            expect(getByTestId('@screen/Accounts')).toBeTruthy();
        });

        it('ignores stale native selections without mounting Trade or reporting analytics', async () => {
            const { getByTestId, queryByTestId } = await renderTabs({
                featureFlags: { [FeatureFlag.IsTradingResidenceCheckEnabled]: false },
                messageSystem: mockMessageSystemStateWithFeatureFlags({
                    'trading.buy': false,
                    'trading.exchange': true,
                    'trading.sell': false,
                    'trading.concierge': false,
                }),
            });
            const accounts = getByTestId(
                `@systemTabs/${getTranslation('navigation.tabs.accountsList')}`,
            );
            const trade = getByTestId(`@systemTabs/${getTranslation('navigation.tabs.trade')}`);

            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: accounts.props.screenKey,
                    provenance: 2,
                    actionOrigin: 'user',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });
            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: trade.props.screenKey,
                    provenance: 1,
                    actionOrigin: 'user',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });

            expect(getByTestId('@systemTabs').props.navStateRequest).toEqual({
                selectedScreenKey: accounts.props.screenKey,
                baseProvenance: 2,
            });
            expect(queryByTestId('@screen/Trading')).toBeNull();
            expect(services.analytics.report).not.toHaveBeenCalled();
        });

        it('keeps the latest native selection when two events arrive before rendering', async () => {
            const { getByTestId } = await renderTabs();
            const accounts = getByTestId(
                `@systemTabs/${getTranslation('navigation.tabs.accountsList')}`,
            );
            const home = getByTestId(`@systemTabs/${getTranslation('navigation.tabs.home')}`);
            const { onTabSelected } = getByTestId('@systemTabs').props;

            await act(() => {
                onTabSelected({
                    nativeEvent: {
                        selectedScreenKey: accounts.props.screenKey,
                        provenance: 1,
                        actionOrigin: 'user',
                        isRepeated: false,
                        hasTriggeredSpecialEffect: false,
                    },
                });
                onTabSelected({
                    nativeEvent: {
                        selectedScreenKey: home.props.screenKey,
                        provenance: 2,
                        actionOrigin: 'user',
                        isRepeated: false,
                        hasTriggeredSpecialEffect: false,
                    },
                });
            });

            expect(getByTestId('@systemTabs').props.navStateRequest).toEqual({
                selectedScreenKey: home.props.screenKey,
                baseProvenance: 2,
            });
        });

        it('reports Trade navigation once for a user selection and ignores programmatic acknowledgements', async () => {
            const { getByTestId } = await renderTabs({
                featureFlags: { [FeatureFlag.IsTradingResidenceCheckEnabled]: false },
                messageSystem: mockMessageSystemStateWithFeatureFlags({
                    'trading.buy': false,
                    'trading.exchange': true,
                    'trading.sell': false,
                    'trading.concierge': false,
                }),
            });
            const trade = getByTestId(`@systemTabs/${getTranslation('navigation.tabs.trade')}`);

            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: trade.props.screenKey,
                    provenance: 1,
                    actionOrigin: 'user',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });
            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: trade.props.screenKey,
                    provenance: 2,
                    actionOrigin: 'programmatic-js',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });

            expect(getByTestId('@screen/Trading')).toBeTruthy();
            expect(services.analytics.report).toHaveBeenCalledTimes(1);
            expect(services.analytics.report).toHaveBeenCalledWith({
                type: events.tradingNavigateEvent.name,
                payload: { action: 'navigate', type: 'buy', from: 'trade' },
            });
        });

        it('omits Trade when disabled and Earn for Bitcoin-only firmware without shifting Settings selection', async () => {
            const { getByTestId, queryByTestId } = await renderRootTabs({
                device: { selectedDevice: { firmwareType: FirmwareType.BitcoinOnly } },
                featureFlags: { [FeatureFlag.IsTradingResidenceCheckEnabled]: false },
                messageSystem: mockMessageSystemStateWithFeatureFlags({
                    'trading.buy': false,
                    'trading.exchange': false,
                    'trading.sell': false,
                    'trading.concierge': false,
                }),
            });
            const settings = getByTestId(
                `@systemTabs/${getTranslation('navigation.tabs.settings')}`,
            );

            expect(
                queryByTestId(`@systemTabs/${getTranslation('navigation.tabs.trade')}`),
            ).toBeNull();
            expect(
                queryByTestId(`@systemTabs/${getTranslation('navigation.tabs.earn')}`),
            ).toBeNull();
            expect(queryByTestId('@tabBar/TradeStack')).toBeNull();
            expect(queryByTestId('@tabBar/EarnStack')).toBeNull();

            await fireEvent(getByTestId('@systemTabs'), 'tabSelected', {
                nativeEvent: {
                    selectedScreenKey: settings.props.screenKey,
                    provenance: 1,
                    actionOrigin: 'user',
                    isRepeated: false,
                    hasTriggeredSpecialEffect: false,
                },
            });

            expect(getByTestId('@systemTabs').props.navStateRequest.selectedScreenKey).toBe(
                settings.props.screenKey,
            );
            expect(getByTestId('@tabBar/Settings').props.accessibilityState.selected).toBe(true);
        });

        it('uses native symbols while original icon images are unavailable', async () => {
            mockNativeTabIcons = {};

            const { getByTestId } = await renderTabs();
            const home = getByTestId(`@systemTabs/${getTranslation('navigation.tabs.home')}`);

            expect(home.props.ios.icon).toEqual({ type: 'sfSymbol', name: 'house' });
            expect(home.props.ios.selectedIcon).toEqual({ type: 'sfSymbol', name: 'house' });
        });

        it.each(['house', 'houseFilled'] as const)(
            'uses the available %s image for both native icon states when the other image is missing',
            async availableIcon => {
                const image = originalNativeTabIcons[availableIcon];

                mockNativeTabIcons = { [availableIcon]: image };

                const { getByTestId } = await renderTabs();
                const home = getByTestId(`@systemTabs/${getTranslation('navigation.tabs.home')}`);
                const expectedIcon = { type: 'templateSource', templateSource: image };

                expect(home.props.ios.icon).toEqual(expectedIcon);
                expect(home.props.ios.selectedIcon).toEqual(expectedIcon);
            },
        );
    });
});
