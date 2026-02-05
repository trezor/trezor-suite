import { useSelector } from 'react-redux';

import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { AccountsStackNavigator } from '@suite-native/module-accounts-management';
import { EarnStackNavigator } from '@suite-native/module-earn';
import { HomeStackNavigator } from '@suite-native/module-home';
import { SettingsScreen } from '@suite-native/module-settings';
import { TradingStackNavigator } from '@suite-native/module-trading';
import { AppTabsParamList, AppTabsRoutes, TabBar } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { selectIsTradingEnabled } from '@suite-native/trading-state';

import { rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabNavigator = () => {
    const analytics = useAnalytics();
    const isTradingEnabled = useSelector(selectIsTradingEnabled);

    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);
    const isEarnEnabled = useFeatureFlag(FeatureFlag.IsEarnEnabled);

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

    return (
        <Tab.Navigator
            initialRouteName={AppTabsRoutes.HomeStack}
            screenOptions={{
                headerShown: false,
                popToTopOnBlur: true,
            }}
            tabBar={(props: BottomTabBarProps) => (
                <TabBar tabItemOptions={rootTabsOptions} {...props} />
            )}
        >
            <Tab.Screen name={AppTabsRoutes.HomeStack} component={HomeStackNavigator} />
            <Tab.Screen name={AppTabsRoutes.AccountsStack} component={AccountsStackNavigator} />
            {!isBtcOnly && isEarnEnabled && (
                <Tab.Screen name={AppTabsRoutes.EarnStack} component={EarnStackNavigator} />
            )}
            {isTradingEnabled && (
                <Tab.Screen
                    name={AppTabsRoutes.TradeStack}
                    component={TradingStackNavigator}
                    listeners={{
                        tabPress: handleTradeTabPress,
                    }}
                />
            )}
            <Tab.Screen name={AppTabsRoutes.Settings} component={SettingsScreen} />
        </Tab.Navigator>
    );
};
