import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon, IconType } from '@trezor/atoms';

type TabBarItemProps = {
    isFocused: boolean;
    onPress: () => void;
    icon: IconType;
};

export const TabBarItem = ({ isFocused, onPress, icon }: TabBarItemProps) => (
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
        <Icon type={icon} size="big" color={isFocused ? 'black' : 'gray500'} />
    </TouchableOpacity>
);
