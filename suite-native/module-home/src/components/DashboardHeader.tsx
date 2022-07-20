import React from 'react';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';

const chipStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: utils.spacings.small,
    backgroundColor: utils.colors.white,
    width: 146,
    height: 48,
    borderRadius: 44,
}));

export const DashboardHeader = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            style={{ width: '100%' }}
        >
            <Box style={applyStyle(chipStyle)}>
                <Icon name="trezorT" />
                <Text>Trezor T</Text>
                <Box>
                    <Icon name="chevronUp" size="small" />
                    <Icon name="chevronDown" size="small" />
                </Box>
            </Box>
            <Box flexDirection="row">
                <Box marginRight="medium">
                    <Icon name="eyeSlash" />
                </Box>
                <Icon name="notifications" />
            </Box>
        </Box>
    );
};
