import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { type BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Device from 'expo-device';

import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useTranslate } from '@suite-native/intl';
import { AccountsStackNavigator } from '@suite-native/module-accounts-management';
import { EarnStackNavigator } from '@suite-native/module-earn';
import { HomeStackNavigator } from '@suite-native/module-home';
import { SettingsScreen } from '@suite-native/module-settings';
import { TradingStackNavigator } from '@suite-native/module-trading';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    TabBar,
    tabBarLabelTxKeys,
} from '@suite-native/navigation';
import { selectIsTradingEnabled } from '@suite-native/trading-state';

import { type NativeTabsOptions, createNativeTabsNavigator } from './NativeTabsNavigator';
import { rootTabsOptions, rootTabsOptionsWithoutEarn } from './routes';
import { useNativeTabIcons } from './useNativeTabIcons';

const Tab = createBottomTabNavigator<AppTabsParamList>();
const NativeTab = createNativeTabsNavigator();

const nativeTabSymbols = {
    [AppTabsRoutes.HomeStack]: 'house',
    [AppTabsRoutes.AccountsStack]: 'wallet.bifold',
    [AppTabsRoutes.TradeStack]: 'arrow.left.arrow.right',
    [AppTabsRoutes.EarnStack]: 'banknote',
    [AppTabsRoutes.Settings]: 'gearshape',
} as const;

export const AppTabNavigator = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const isTradingEnabled = useSelector(selectIsTradingEnabled);
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const { translate } = useTranslate();
    // A system tab controller lets iPhone Duo place tabs outside the app window.
    // Expo Device reports a generic model in Simulator, so allow a development override.
    const useSystemTabs =
        Platform.OS === 'ios' &&
        (Device.modelName === 'iPhone Duo' ||
            (__DEV__ && process.env.EXPO_PUBLIC_NATIVE_TABS === '1'));
    const nativeTabIcons = useNativeTabIcons(useSystemTabs);

    const tabItemOptions = isBitcoinOnlyFirmware ? rootTabsOptionsWithoutEarn : rootTabsOptions;

    const handleTradeTabPress = () => {
        // Buy is the default tab when navigating to the Trading stack
        analytics.report({
            type: events.tradingNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'trade',
            },
        });
    };

    const screens = (
        <>
            <Tab.Screen name={AppTabsRoutes.HomeStack} component={HomeStackNavigator} />
            <Tab.Screen
                name={AppTabsRoutes.AccountsStack}
                component={AccountsStackNavigator}
                initialParams={rootTabsOptions[AppTabsRoutes.AccountsStack]?.params}
            />
            {isTradingEnabled && (
                <Tab.Screen
                    name={AppTabsRoutes.TradeStack}
                    component={TradingStackNavigator}
                    listeners={{
                        tabPress: handleTradeTabPress,
                    }}
                />
            )}
            {(!useSystemTabs || !isBitcoinOnlyFirmware) && (
                <Tab.Screen name={AppTabsRoutes.EarnStack} component={EarnStackNavigator} />
            )}
            <Tab.Screen name={AppTabsRoutes.Settings} component={SettingsScreen} />
        </>
    );

    if (useSystemTabs) {
        return (
            <NativeTab.Navigator
                initialRouteName={AppTabsRoutes.HomeStack}
                screenOptions={({ route }): NativeTabsOptions => {
                    const tabOption = tabItemOptions[route.name];

                    if (!tabOption) return {};

                    const { iconName, focusedIconName } = tabOption;
                    const regularImage = nativeTabIcons[iconName];
                    const focusedImage = nativeTabIcons[focusedIconName];
                    const image = regularImage ?? focusedImage;

                    return {
                        popToTopOnBlur: true,
                        title: translate(tabBarLabelTxKeys[route.name]),
                        icon: image
                            ? { type: 'templateSource', templateSource: regularImage ?? image }
                            : { type: 'sfSymbol', name: nativeTabSymbols[route.name] },
                        selectedIcon: image
                            ? { type: 'templateSource', templateSource: focusedImage ?? image }
                            : { type: 'sfSymbol', name: nativeTabSymbols[route.name] },
                    };
                }}
            >
                {screens}
            </NativeTab.Navigator>
        );
    }

    return (
        <Tab.Navigator
            initialRouteName={AppTabsRoutes.HomeStack}
            screenOptions={{ headerShown: false, popToTopOnBlur: true }}
            tabBar={(props: BottomTabBarProps) => (
                <TabBar tabItemOptions={tabItemOptions} {...props} />
            )}
        >
            {screens}
        </Tab.Navigator>
    );
};
