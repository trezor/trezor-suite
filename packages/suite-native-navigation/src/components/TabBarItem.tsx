import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon, IconName } from '@trezor/icons';

type TabBarItemProps = {
    isFocused: boolean;
    onPress: () => void;
    iconName: IconName;
};

export const TabBarItem = ({ isFocused, onPress, iconName }: TabBarItemProps) => (
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
    >
        <Icon name={iconName} size="large" color={isFocused ? 'black' : 'gray500'} />
    </TouchableOpacity>
);
