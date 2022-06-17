import React from 'react';
import { View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TabBarItem } from './TabBarItem';
import { RouteTabs } from '@suite-native/navigation-root';
import { Box, IconButton, Text } from '@suite-native/atoms';
import { TabsOption } from '../types';

interface TabBarProps extends BottomTabBarProps {
    tabItemOptions: TabsOption;
}

const tabBarStyle = prepareNativeStyle(utils => ({
    height: 86,
    backgroundColor: utils.colors.gray100,
    borderTopColor: utils.colors.gray300,
    borderTopWidth: utils.borders.widths.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20.5,
    paddingLeft: 51.5,
    paddingRight: 51.5,
}));

const ActionTabItem = () => {
    const { applyStyle } = useNativeStyles();

    const actionTabItemStyle = prepareNativeStyle(() => ({
        position: 'absolute',
        // top: -13,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
    }));

    return (
        <Box style={applyStyle(actionTabItemStyle)}>
            <IconButton
                iconName="action"
                onPress={() => console.log('Show actions')}
                size="extraLarge"
                isRounded
            />
        </Box>
    );
};

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

                if (route.name === RouteTabs.Action) return <ActionTabItem key={route.key} />;

                return (
                    <TabBarItem
                        key={route.key}
                        isFocused={isFocused}
                        iconName={iconName}
                        title="Ahoj"
                        onPress={handleTabBarItemPress}
                    />
                );
            })}
        </View>
    );
};
