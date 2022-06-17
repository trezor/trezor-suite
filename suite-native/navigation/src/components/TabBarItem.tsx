import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon, IconName } from '@trezor/icons';
import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TabBarItemProps = {
    isFocused: boolean;
    onPress: () => void;
    iconName: IconName;
    title: string;
};

const tabBarItemStyle = prepareNativeStyle(utils => ({
    color: utils.colors.forest,
}));

export const TabBarItem = ({ isFocused, onPress, iconName, title }: TabBarItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => {
                /*
             Calling in a function prevents Animation warning in iOS simulator
             see https://github.com/react-navigation/react-navigation/issues/7839#issuecomment-829438793
             */
                onPress();
            }}
            style={applyStyle(tabBarItemStyle)}
        >
            <Icon name={iconName} size="large" color={isFocused ? 'forest' : 'gray500'} />
            <Text color={isFocused ? 'forest' : 'gray500'}>{title}</Text>
        </TouchableOpacity>
    );
};
