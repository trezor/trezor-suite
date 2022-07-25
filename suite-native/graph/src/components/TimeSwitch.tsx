import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';

const timeSwitchStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const textStyle = prepareNativeStyle(utils => ({
    ...utils.typography.hint,
    color: utils.colors.gray500,
}));

export const TimeSwitch = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(timeSwitchStyle)}>
            <Text style={applyStyle(textStyle)}>D</Text>
            <Text style={applyStyle(textStyle)}>W</Text>
            <Text style={applyStyle(textStyle)}>M</Text>
            <Text style={applyStyle(textStyle)}>Y</Text>
        </Box>
    );
};
