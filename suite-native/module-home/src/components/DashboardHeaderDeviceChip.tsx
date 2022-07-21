import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@trezor/icons';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
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

export const DashboardHeaderDeviceChip = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity style={applyStyle(chipStyle)}>
            <Icon name="trezorT" />
            <Text>Trezor T</Text>
            <Box>
                <Icon name="chevronUp" size="small" />
                <Icon name="chevronDown" size="small" />
            </Box>
        </TouchableOpacity>
    );
};
