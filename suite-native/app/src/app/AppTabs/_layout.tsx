/* eslint-disable import/no-default-export */
import { useSelector } from 'react-redux';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { AppTabsRoutes, TabBar } from '@suite-native/navigation';
import { selectIsTradingEnabled } from '@suite-native/trading-state';

import { rootTabsOptions } from '../../navigation/routes';

const AppTabsLayout = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const isTradingEnabled = useSelector(selectIsTradingEnabled);

    const handleTradeTabPress = () => {
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
        <Tabs
            initialRouteName={AppTabsRoutes.HomeStack}
            screenOptions={{
                headerShown: false,
                popToTopOnBlur: true,
            }}
            tabBar={(props: BottomTabBarProps) => (
                <TabBar tabItemOptions={rootTabsOptions} {...props} />
            )}
        >
            <Tabs.Screen name={AppTabsRoutes.HomeStack} />
            <Tabs.Screen name={AppTabsRoutes.AccountsStack} />
            <Tabs.Protected guard={Boolean(isTradingEnabled)}>
                <Tabs.Screen
                    name={AppTabsRoutes.TradeStack}
                    listeners={{
                        tabPress: handleTradeTabPress,
                    }}
                />
            </Tabs.Protected>
            <Tabs.Screen name={AppTabsRoutes.EarnStack} />
            <Tabs.Screen name={AppTabsRoutes.Settings} />
        </Tabs>
    );
};

export default AppTabsLayout;
