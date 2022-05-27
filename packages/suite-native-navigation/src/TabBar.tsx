import React from 'react';
import { View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TabBarItem } from './TabBarItem';
import { TabsOption } from './types';

interface TabBarProps extends BottomTabBarProps {
    tabItemOptions: TabsOption;
}

const tabBarStyle = prepareNativeStyle(utils => ({
    height: 86,
    backgroundColor: utils.colors.gray100,
    borderTopColor: utils.colors.gray300,
    borderTopWidth: utils.borders.widths.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20.5,
    paddingLeft: 51.5,
    paddingRight: 51.5,
}));

export const TabBar = ({ state, navigation, tabItemOptions }: TabBarProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(tabBarStyle)]}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const { iconName } = tabItemOptions[route.name];

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

                return (
                    <TabBarItem
                        key={route.key}
                        isFocused={isFocused}
                        iconName={iconName}
                        onPress={handleTabBarItemPress}
                    />
                );
            })}
        </View>
    );
};
