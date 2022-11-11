import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';

const headerStyle = prepareNativeStyle(() => ({
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
    alignItems: 'center',
}));

export const DashboardHeader = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(headerStyle)}>
            <Text>Home</Text>
        </Box>
    );
};
