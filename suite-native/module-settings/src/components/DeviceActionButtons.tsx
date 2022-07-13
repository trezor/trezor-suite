import React from 'react';

import { Box, TileButton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: utils.spacings.extraLarge,
    padding: utils.spacings.small,
}));

const leftButtonStyle = prepareNativeStyle(() => ({
    marginRight: 3,
}));

const rightButtonStyle = prepareNativeStyle(() => ({
    marginLeft: 3,
}));

export const DeviceActionButtons = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row" style={applyStyle(buttonsWrapperStyle)}>
            <TileButton
                iconName="eject"
                title="eject device"
                onPress={() => {}}
                style={applyStyle(leftButtonStyle)}
            />
            <TileButton
                iconName="lock"
                title="lock app"
                onPress={() => {}}
                style={applyStyle(rightButtonStyle)}
            />
        </Box>
    );
};
