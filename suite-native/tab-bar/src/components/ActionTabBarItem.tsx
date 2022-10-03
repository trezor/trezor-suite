import React from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';
import { TabBarItemProps } from './TabBarItem';

type ActionTabBarItemProps = Pick<TabBarItemProps, 'isFocused' | 'onPress'>;

const actionTabItemStyle = prepareNativeStyle(utils => ({
    marginTop: -24, // Top padding value of tab bar + 13px (from figma)
    marginHorizontal: -15,
    width: 58,
    height: 58,
    borderRadius: utils.borders.radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors.forest,
}));

export const ActionTabItem = ({ isFocused, onPress }: ActionTabBarItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            style={applyStyle(actionTabItemStyle)}
            onPress={onPress}
        >
            <Icon name="actionHorizontal" color="gray0" />
        </TouchableOpacity>
    );
};
