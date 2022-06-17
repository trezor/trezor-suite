import * as React from 'react';

import { Box, ActionIconButton } from '@suite-native/atoms';
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

export const ActionButtons = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row" style={applyStyle(buttonsWrapperStyle)}>
            <ActionIconButton
                iconName="eject"
                title="eject device"
                onPress={() => console.log('eject')}
                style={applyStyle(leftButtonStyle)}
            />
            <ActionIconButton
                iconName="lock"
                title="lock app"
                onPress={() => console.log('lock')}
                style={applyStyle(rightButtonStyle)}
            />
        </Box>
    );
};
