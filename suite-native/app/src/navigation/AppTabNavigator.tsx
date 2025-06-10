import { useSelector } from 'react-redux';

import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { EventType, analytics } from '@suite-native/analytics';
import { useHandleDeviceRequestsPassphrase } from '@suite-native/device-authorization';
import { AccountsStackNavigator } from '@suite-native/module-accounts-management';
import { HomeStackNavigator } from '@suite-native/module-home';
import { SettingsScreen } from '@suite-native/module-settings';
import {
    TradingStackNavigator,
    selectIsTradingBuyEnabled,
    selectIsTradingEnabled,
    selectIsTradingExchangeEnabled,
    selectIsTradingSellEnabled,
} from '@suite-native/module-trading';
import { AppTabsParamList, AppTabsRoutes, TabBar } from '@suite-native/navigation';

import { rootTabsOptions } from './routes';

const Tab = createBottomTabNavigator<AppTabsParamList>();

const getTradingAnalyticsType = (
    isTradingBuyEnabled: boolean,
    isTradingExchangeEnabled: boolean,
    isTradingSellEnabled: boolean,
) => {
    if (isTradingBuyEnabled) {
        return 'buy';
    }
    if (isTradingExchangeEnabled) {
        return 'exchange';
    }
    if (isTradingSellEnabled) {
        return 'sell';
    }

    return null;
};

export const AppTabNavigator = () => {
    useHandleDeviceRequestsPassphrase();

    const isTradingEnabled = useSelector(selectIsTradingEnabled);
    const isTradingBuyEnabled = useSelector(selectIsTradingBuyEnabled);
    const isTradingExchangeEnabled = useSelector(selectIsTradingExchangeEnabled);
    const isTradingSellEnabled = useSelector(selectIsTradingSellEnabled);

    const handleTradeTabPress = () => {
        const tradingType = getTradingAnalyticsType(
            isTradingBuyEnabled,
            isTradingExchangeEnabled,
            isTradingSellEnabled,
        );

        if (!tradingType) return;

        analytics.report({
            type: EventType.TradingNavigate,
            payload: {
                action: 'navigate',
                type: tradingType,
                from: 'trade',
            },
        });
    };

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
