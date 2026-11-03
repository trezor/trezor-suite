import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomTabBarHeightCallbackContext,
    type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { Box } from '@suite-native/atoms';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AppTabsRoutes } from '../routes';
import { type TabsOptions } from '../types';
import { TabBarItem } from './TabBarItem';

interface TabBarProps extends BottomTabBarProps {
    tabItemOptions: TabsOptions;
}

const tabBarStyle = prepareNativeStyle<{
    insetLeft: number;
    insetRight: number;
    insetsBottom: number;
}>((utils, { insetLeft, insetRight, insetsBottom }) => ({
    width: '100%',
    backgroundColor: utils.colors.surfaceFillModal,
    borderTopColor: utils.colors.surfaceBorderModal,
    borderTopWidth: utils.borders.widths.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: Math.max(insetLeft, utils.spacings.sp12),
    paddingRight: Math.max(insetRight, utils.spacings.sp12),
    paddingBottom: insetsBottom,
}));

const TabBarLabelTxKeys = {
    [AppTabsRoutes.HomeStack]: 'navigation.tabs.home',
    [AppTabsRoutes.AccountsStack]: 'navigation.tabs.accountsList',
    [AppTabsRoutes.TradeStack]: 'navigation.tabs.trade',
    [AppTabsRoutes.EarnStack]: 'navigation.tabs.earn',
    [AppTabsRoutes.Settings]: 'navigation.tabs.settings',
} as const satisfies Record<AppTabsRoutes, TxKeyPath>;

export const TabBar = ({ state, navigation, tabItemOptions }: TabBarProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
    const insets = useSafeAreaInsets();

    return (
        <Box
            onLayout={event => onHeightChange?.(event.nativeEvent.layout.height)}
            style={applyStyle(tabBarStyle, {
                insetLeft: insets.left,
                insetRight: insets.right,
                insetsBottom: insets.bottom,
            })}
        >
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const tabOption = tabItemOptions[route.name];
                if (!tabOption) return null;
                const { routeName, iconName, focusedIconName, params } = tabOption;
                const tabBarLabelTxKey = TabBarLabelTxKeys[routeName];

                const handleTabBarItemPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(routeName, { ...params });
                    }
                };

                return (
                    <TabBarItem
                        key={route.key}
                        isFocused={isFocused}
                        iconName={iconName}
                        focusedIconName={focusedIconName}
                        title={translate(tabBarLabelTxKey)}
                        onPress={handleTabBarItemPress}
                        testID={route.name}
                    />
                );
            })}
        </Box>
    );
};
