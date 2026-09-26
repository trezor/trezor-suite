import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { type IconName } from '@suite-native/icons';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';

import { AppTabsRoutes } from '../routes';
import { type TabsOptions } from '../types';

export type TabBarProps = BottomTabBarProps & {
    tabItemOptions: TabsOptions;
};

export type TabBarItemData = {
    key: string;
    routeName: AppTabsRoutes;
    testID: string;
    title: string;
    iconName: IconName;
    focusedIconName: IconName;
    isFocused: boolean;
    onPress: () => void;
};

export const tabBarLabelTxKeys = {
    [AppTabsRoutes.HomeStack]: 'navigation.tabs.home',
    [AppTabsRoutes.AccountsStack]: 'navigation.tabs.accountsList',
    [AppTabsRoutes.TradeStack]: 'navigation.tabs.trade',
    [AppTabsRoutes.EarnStack]: 'navigation.tabs.earn',
    [AppTabsRoutes.Settings]: 'navigation.tabs.settings',
} as const satisfies Record<AppTabsRoutes, TxKeyPath>;

export const useTabBarItems = ({
    state,
    navigation,
    tabItemOptions,
}: TabBarProps): TabBarItemData[] => {
    const { translate } = useTranslate();

    return state.routes.flatMap((route, index) => {
        const tabOption = tabItemOptions[route.name];

        if (!tabOption) {
            return [];
        }

        const { routeName, iconName, focusedIconName, params } = tabOption;
        const isFocused = state.index === index;

        const onPress = () => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(routeName, { ...params });
            }
        };

        return [
            {
                key: route.key,
                routeName,
                testID: route.name,
                title: translate(tabBarLabelTxKeys[routeName]),
                iconName,
                focusedIconName,
                isFocused,
                onPress,
            },
        ];
    });
};
