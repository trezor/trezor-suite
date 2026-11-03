import { useContext, useState } from 'react';
import { type LayoutChangeEvent, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BottomTabBarHeightCallbackContext,
    type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { GlassBackground, isLiquidGlassAvailable } from '@suite-native/atoms';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AppTabsRoutes } from '../routes';
import { type TabsOptions } from '../types';
import { TabBarItem } from './TabBarItem';
import { TabBarSelectionIndicator } from './TabBarSelectionIndicator';

interface TabBarProps extends BottomTabBarProps {
    tabItemOptions: TabsOptions;
}

const tabBarContainerStyle = prepareNativeStyle<{
    insetLeft: number;
    insetRight: number;
    insetBottom: number;
}>((utils, { insetLeft, insetRight, insetBottom }) => ({
    // The bar floats above the screen content, so the content can scroll underneath it.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: Math.max(insetLeft, utils.spacings.sp20),
    paddingRight: Math.max(insetRight, utils.spacings.sp20),
    // On iOS, sit the bar within the home indicator area, the same way the system tab bar does.
    // On Android, the bar has to stay clear of the system navigation bar.
    paddingBottom:
        Platform.OS === 'ios'
            ? Math.max(insetBottom - utils.spacings.sp12, utils.spacings.sp12)
            : Math.max(insetBottom, utils.spacings.sp12),
}));

const tabBarPillStyle = prepareNativeStyle<{ hasGlassBackground: boolean }>(
    (utils, { hasGlassBackground }) => ({
        flexDirection: 'row',
        padding: utils.spacings.sp4,
        borderRadius: utils.borders.radii.round,
        extend: {
            condition: !hasGlassBackground,
            style: {
                backgroundColor: utils.colors.surfaceFillRaised,
                borderColor: utils.colors.surfaceBorderRaised,
                borderWidth: utils.borders.widths.small,
                ...utils.boxShadows.medium,
            },
        },
    }),
);

const TabBarLabelTxKeys = {
    [AppTabsRoutes.HomeStack]: 'navigation.tabs.home',
    [AppTabsRoutes.AccountsStack]: 'navigation.tabs.accountsList',
    [AppTabsRoutes.TradeStack]: 'navigation.tabs.trade',
    [AppTabsRoutes.EarnStack]: 'navigation.tabs.earn',
    [AppTabsRoutes.Settings]: 'navigation.tabs.settings',
} as const satisfies Record<AppTabsRoutes, TxKeyPath>;

export const TabBar = ({ state, navigation, tabItemOptions }: TabBarProps) => {
    const [pillContentWidth, setPillContentWidth] = useState(0);

    const { translate } = useTranslate();
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();
    const insets = useSafeAreaInsets();
    // Reports the real bar height to `useFloatingTabBarHeight` consumers, the bottom tab navigator
    // only knows the height of its default tab bar.
    const reportTabBarHeight = useContext(BottomTabBarHeightCallbackContext);

    const handleContainerLayout = (event: LayoutChangeEvent) => {
        reportTabBarHeight?.(event.nativeEvent.layout.height);
    };

    const handlePillLayout = (event: LayoutChangeEvent) => {
        setPillContentWidth(event.nativeEvent.layout.width - 2 * spacings.sp4);
    };

    const visibleRoutes = state.routes.filter(route => tabItemOptions[route.name]);
    const focusedRouteKey = state.routes[state.index]?.key;
    const selectedIndex = visibleRoutes.findIndex(route => route.key === focusedRouteKey);
    const itemWidth = visibleRoutes.length > 0 ? pillContentWidth / visibleRoutes.length : 0;

    return (
        <View
            pointerEvents="box-none"
            onLayout={handleContainerLayout}
            testID="@tabBar"
            style={applyStyle(tabBarContainerStyle, {
                insetLeft: insets.left,
                insetRight: insets.right,
                insetBottom: insets.bottom,
            })}
        >
            <View
                onLayout={handlePillLayout}
                style={applyStyle(tabBarPillStyle, {
                    hasGlassBackground: isLiquidGlassAvailable,
                })}
            >
                <GlassBackground shape="capsule" />
                {itemWidth > 0 && selectedIndex !== -1 && (
                    <TabBarSelectionIndicator itemWidth={itemWidth} selectedIndex={selectedIndex} />
                )}
                {visibleRoutes.map(route => {
                    const isFocused = route.key === focusedRouteKey;
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
            </View>
        </View>
    );
};
