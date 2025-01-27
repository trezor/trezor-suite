import { useSelector } from 'react-redux';

import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useHandleDeviceRequestsPassphrase } from '@suite-native/device-authorization';
import { FeatureFlag, createSelectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import { AccountsStackNavigator } from '@suite-native/module-accounts-management';
import { HomeStackNavigator } from '@suite-native/module-home';
import { SettingsScreen } from '@suite-native/module-settings';
import { TradingStackNavigator } from '@suite-native/module-trading';
import { AppTabsParamList, AppTabsRoutes, TabBar } from '@suite-native/navigation';

import { rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabNavigator = () => {
    useHandleDeviceRequestsPassphrase();

    const isTradingEnabled = useSelector(
        createSelectIsFeatureFlagEnabled(FeatureFlag.IsTradingEnabled),
    );

    return (
        <Tab.Navigator
            initialRouteName={AppTabsRoutes.HomeStack}
            screenOptions={{
                headerShown: false,
                unmountOnBlur: true,
            }}
            tabBar={(props: BottomTabBarProps) => (
                <TabBar tabItemOptions={rootTabsOptions} {...props} />
            )}
        >
            <Tab.Screen name={AppTabsRoutes.HomeStack} component={HomeStackNavigator} />
            <Tab.Screen name={AppTabsRoutes.AccountsStack} component={AccountsStackNavigator} />
            {isTradingEnabled && (
                <Tab.Screen name={AppTabsRoutes.TradeStack} component={TradingStackNavigator} />
            )}
            <Tab.Screen name={AppTabsRoutes.Settings} component={SettingsScreen} />
        </Tab.Navigator>
    );
};
