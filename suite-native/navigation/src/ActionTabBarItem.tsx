import React from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';

const actionTabItemStyle = prepareNativeStyle(utils => ({
    marginTop: -40,
    width: 58,
    height: 58,
    borderRadius: utils.borders.radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors.forest,
}));

export const ActionTabItem = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity style={applyStyle(actionTabItemStyle)} onPress={() => {}}>
            <Icon name="actionHorizontal" color="white" />
        </TouchableOpacity>
    );
};
