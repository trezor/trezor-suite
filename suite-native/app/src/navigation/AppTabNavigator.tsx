import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStackNavigator } from '@suite-native/module-home';
import { AccountsStackNavigator } from '@suite-native/module-accounts-management';
import { SettingsScreen } from '@suite-native/module-settings';
import { AppTabsParamList, AppTabsRoutes, TabBar } from '@suite-native/navigation';
import { useHandleDeviceRequestsPassphrase } from '@suite-native/device-authorization';

import { rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppTabNavigator = () => {
    useHandleDeviceRequestsPassphrase();

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
            <Tab.Screen name={AppTabsRoutes.Settings} component={SettingsScreen} />
        </Tab.Navigator>
    );
};
