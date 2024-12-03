import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';

import { ReceiveStackNavigator } from '@suite-native/module-receive';
import { HomeStackNavigator } from '@suite-native/module-home';
import { AccountsStackNavigator } from '@suite-native/module-accounts-management';
import { SettingsStackNavigator } from '@suite-native/module-settings';
import { AppTabsRoutes } from '@suite-native/navigation';
import { useHandleDeviceRequestsPassphrase } from '@suite-native/device-authorization';
import { useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';

const Tab = createNativeBottomTabNavigator();

export const AppTabNavigator = () => {
    useHandleDeviceRequestsPassphrase();
    const { utils } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <Tab.Navigator
            initialRouteName={AppTabsRoutes.HomeStack}
            tabLabelStyle={{
                fontFamily: utils.typography.label.fontFamily,
                fontSize: utils.typography.label.fontSize,
            }}
            barTintColor={utils.colors.backgroundSurfaceElevation0}
            tabBarActiveTintColor={utils.colors.iconPrimaryDefault}
            activeIndicatorColor={utils.colors.backgroundNeutralDisabled}
            tabBarInactiveTintColor={utils.colors.iconDisabled}
            // disable page animations because it looks strange with device switcher
            // we should try to move device switcher outside of navigator
            disablePageAnimations
            labeled={true}
        >
            <Tab.Screen
                name={AppTabsRoutes.HomeStack}
                component={HomeStackNavigator}
                options={{
                    tabBarIcon: ({ focused }: { focused: boolean }) =>
                        focused
                            ? require('@suite-common/icons/assets/houseFilled.svg')
                            : require('@suite-common/icons/assets/house.svg'),
                    tabBarLabel: translate('tabBar.home'),
                    tabBarButtonTestID: `@tabBar/${AppTabsRoutes.HomeStack}`,
                }}
                testID={`@tabBar/${AppTabsRoutes.HomeStack}`}
            />
            <Tab.Screen
                name={AppTabsRoutes.AccountsStack}
                component={AccountsStackNavigator}
                options={{
                    tabBarIcon: ({ focused }: { focused: boolean }) =>
                        focused
                            ? require('@suite-common/icons/assets/discoverFilled.svg')
                            : require('@suite-common/icons/assets/discover.svg'),
                    tabBarLabel: translate('tabBar.accounts'),
                    tabBarButtonTestID: `@tabBar/${AppTabsRoutes.AccountsStack}`,
                }}
                testID={`@tabBar/${AppTabsRoutes.AccountsStack}`}
            />
            <Tab.Screen
                name={AppTabsRoutes.ReceiveStack}
                component={ReceiveStackNavigator}
                options={{
                    // filled arrow looks ugly, let's use the same icon for both focused and non-focused
                    tabBarIcon: () => require('@suite-common/icons/assets/arrowLineDown.svg'),
                    tabBarLabel: translate('tabBar.receive'),
                    tabBarButtonTestID: `@tabBar/${AppTabsRoutes.ReceiveStack}`,
                }}
                testID={`@tabBar/${AppTabsRoutes.ReceiveStack}`}
            />
            <Tab.Screen
                name={AppTabsRoutes.SettingsStack}
                component={SettingsStackNavigator}
                options={{
                    tabBarIcon: ({ focused }: { focused: boolean }) =>
                        focused
                            ? require('@suite-common/icons/assets/gearFilled.svg')
                            : require('@suite-common/icons/assets/gear.svg'),
                    tabBarLabel: translate('tabBar.settings'),
                    tabBarButtonTestID: `@tabBar/${AppTabsRoutes.SettingsStack}`,
                }}
                testID={`@tabBar/${AppTabsRoutes.SettingsStack}`}
            />
        </Tab.Navigator>
    );
};
