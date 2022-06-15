import * as React from 'react';

import { Box, Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';

const rectangleButtonStyle = prepareNativeStyle(() => ({
    height: 79,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
}));

// TODO figure out a better name for this component
export const ActionButtons = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box flexDirection="row">
            <Button colorScheme="gray" style={applyStyle(rectangleButtonStyle)}>
                <Box justifyContent="center" alignItems="center">
                    <Icon name="flag" />
                    <Text>EJECT DEVICE</Text>
                </Box>
            </Button>
            <Button colorScheme="gray" style={applyStyle(rectangleButtonStyle)}>
                <Box justifyContent="center" alignItems="center">
                    <Icon name="lock" />
                    <Text>LOCK APP</Text>
                </Box>
            </Button>
        </Box>
    );
};
