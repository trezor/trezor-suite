import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';
import { Box, Text } from '@suite-native/atoms';

const headerStyle = prepareNativeStyle(() => ({
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
    alignItems: 'center',
}));

const controlButtonsStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
}));

export const DashboardHeader = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(headerStyle)}>
            <Box flexDirection="row" style={applyStyle(controlButtonsStyle)}>
                <Box marginRight="medium">
                    <Icon name="eyeSlash" color="gray600" />
                </Box>
                <Icon name="notifications" color="gray600" />
            </Box>
            <Text>Home</Text>
        </Box>
    );
};
