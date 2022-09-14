import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';
import { Box } from '@suite-native/atoms';

const headerStyle = prepareNativeStyle(() => ({
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
}));

export const DashboardHeader = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(headerStyle)}>
            <Box flexDirection="row">
                <Box marginRight="medium">
                    <Icon name="eyeSlash" color="gray600" />
                </Box>
                <Icon name="notifications" color="gray600" />
            </Box>
        </Box>
    );
};
