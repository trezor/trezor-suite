import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TabBarItem } from './TabBarItem';
import { RouteTabs } from '@suite-native/navigation-root';
import { Box } from '@suite-native/atoms';
import { TabsOption } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionTabItem } from './ActionTabBarItem';

interface TabBarProps extends BottomTabBarProps {
    tabItemOptions: TabsOption;
}

const tabBarStyle = prepareNativeStyle<{ insetLeft: number; insetRight: number }>(
    (utils, { insetLeft, insetRight }) => ({
        height: 86,
        width: '100%',
        backgroundColor: utils.colors.gray100,
        borderTopColor: utils.colors.gray300,
        borderTopWidth: utils.borders.widths.small,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 11,
        paddingLeft: Math.max(insetLeft, 33),
        paddingRight: Math.max(insetRight, 33),
    }),
);

export const TabBar = ({ state, navigation, tabItemOptions }: TabBarProps) => {
    const { applyStyle } = useNativeStyles();
    const insets = useSafeAreaInsets();

    return (
        <Box style={applyStyle(tabBarStyle, { insetLeft: insets.left, insetRight: insets.right })}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const { iconName, label } = tabItemOptions[route.name];

                const handleTabBarItemPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        // The `merge: true` option makes sure that the params inside the tab screen are preserved
                        navigation.navigate(route.name, { merge: true });
                    }
                };

                if (route.name === RouteTabs.Action) return <ActionTabItem key={route.key} />;

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
