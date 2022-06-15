import * as React from 'react';

import { Box, ActionIconButton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const rectangleButtonWrapperStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

export const ActionButtons = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row" style={applyStyle(rectangleButtonWrapperStyle)}>
            <ActionIconButton
                iconName="eject"
                title="eject device"
                onPress={() => console.log('eject')}
            />
            <ActionIconButton
                iconName="lock"
                title="lock app"
                onPress={() => console.log('lock')}
            />
        </Box>
    );
};
