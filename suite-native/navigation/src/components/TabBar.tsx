import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

import { TabBarItem } from './TabBarItem';
import { ActionTabItem } from './ActionTabBarItem';
import { TabsOptions } from '../types';

interface TabBarProps extends BottomTabBarProps {
    tabItemOptions: TabsOptions;
}

export const TAB_BAR_HEIGHT = 86;
const tabBarStyle = prepareNativeStyle<{ insetLeft: number; insetRight: number }>(
    (utils, { insetLeft, insetRight }) => ({
        height: TAB_BAR_HEIGHT,
        width: '100%',
        backgroundColor: utils.colors.gray100,
        borderTopColor: utils.colors.gray300,
        borderTopWidth: utils.borders.widths.small,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingLeft: Math.max(insetLeft, 20),
        paddingRight: Math.max(insetRight, 20),
    }),
);

export const TabBar = ({ state, navigation, tabItemOptions }: TabBarProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <Box style={applyStyle(tabBarStyle, { insetLeft: insets.left, insetRight: insets.right })}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const { routeName, iconName, label, isActionTabItem, params } =
                    tabItemOptions[route.name];

                if (isActionTabItem) return <ActionTabItem key={route.key} />;

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
                        title={label}
                        onPress={handleTabBarItemPress}
                    />
                );
            })}
        </Box>
    );
};
