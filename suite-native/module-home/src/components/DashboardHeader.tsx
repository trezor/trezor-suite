import React from 'react';

import { useAtom } from 'jotai';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, IconButton, isDiscreetModeOn, Text } from '@suite-native/atoms';

const headerStyle = prepareNativeStyle(() => ({
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
    alignItems: 'center',
}));

const iconStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    right: 0,
}));

export const DashboardHeader = () => {
    const { applyStyle } = useNativeStyles();
    const [isDiscreet, setIsDiscreet] = useAtom(isDiscreetModeOn);
    return (
        <Box style={applyStyle(headerStyle)}>
            <Text>Home</Text>
            <IconButton
                onPress={() => setIsDiscreet(!isDiscreet)}
                iconName={isDiscreet ? 'eyeglasses' : 'eyeSlash'}
                colorScheme="gray"
                size="large"
                style={applyStyle(iconStyle)}
                isRounded
            />
        </Box>
    );
};
