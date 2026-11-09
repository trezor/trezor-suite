import { useSelector } from 'react-redux';

import { type BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { EarnStackNavigator } from '@suite-native/module-earn';
import { type AppTabsParamList, AppTabsRoutes, TabBar } from '@suite-native/navigation';
import { DEFAULT_TRADING_TYPE } from '@suite-native/trading-consts';
import { selectIsTradingEnabled } from '@suite-native/trading-state';
import { AccountsStackNavigator } from '@suite-native-app/module-accounts';
import { HomeStackNavigator } from '@suite-native-app/module-home';
import { SettingsScreen } from '@suite-native-app/module-settings';
import { TradingScreen } from '@suite-native-app/module-trading';
import { useServices } from '@trezor/dependency-injection';

import { rootTabsOptions, rootTabsOptionsWithoutEarn } from './routes';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabNavigator = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const isTradingEnabled = useSelector(selectIsTradingEnabled);
    const isBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    const tabItemOptions = isBitcoinOnlyFirmware ? rootTabsOptionsWithoutEarn : rootTabsOptions;

    const handleTradeTabPress = () => {
        analytics.report({
            type: events.tradingNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: DEFAULT_TRADING_TYPE,
                from: 'trade',
            },
        });
    };

    const handleAccountsTabPress = (isAccountsTabFocused: boolean) => {
        if (isAccountsTabFocused) return;

        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'account-list', from: 'tab' },
        });
    };

    return (
        <Tab.Navigator
            initialRouteName={AppTabsRoutes.HomeStack}
            screenOptions={{
                headerShown: false,
                popToTopOnBlur: true,
            }}
            tabBar={(props: BottomTabBarProps) => (
                <TabBar tabItemOptions={tabItemOptions} {...props} />
            )}
        >
            <Tab.Screen name={AppTabsRoutes.HomeStack} component={HomeStackNavigator} />
            <Tab.Screen
                name={AppTabsRoutes.AccountsStack}
                component={AccountsStackNavigator}
                listeners={({ navigation }) => ({
                    tabPress: () => handleAccountsTabPress(navigation.isFocused()),
                })}
            />
            {isTradingEnabled && (
                <Tab.Screen
                    name={AppTabsRoutes.Trading}
                    component={TradingScreen}
                    listeners={{
                        tabPress: handleTradeTabPress,
                    }}
                />
            )}
            <Tab.Screen name={AppTabsRoutes.EarnStack} component={EarnStackNavigator} />
            <Tab.Screen name={AppTabsRoutes.Settings} component={SettingsScreen} />
        </Tab.Navigator>
    );
};
