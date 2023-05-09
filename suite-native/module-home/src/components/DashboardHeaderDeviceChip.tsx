import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-common/icons';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { BottomSheet, Box, Text } from '@suite-native/atoms';

const chipStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: utils.spacings.small,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    width: 146,
    height: 48,
    borderRadius: 44,
}));

export const DashboardHeaderDeviceChip = () => {
    const [isDeviceModalVisible, setIsDeviceModalVisible] = useState<boolean>(false);
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <TouchableOpacity
                style={applyStyle(chipStyle)}
                onPress={() => setIsDeviceModalVisible(true)}
            >
                <Icon name="trezorT" />
                <Text>Trezor T</Text>
                <Box>
                    <Icon name="chevronUp" size="small" />
                    <Icon name="chevronDown" size="small" />
                </Box>
            </TouchableOpacity>
            <BottomSheet
                isVisible={isDeviceModalVisible}
                onClose={setIsDeviceModalVisible}
                title=""
            >
                <Text variant="body">TODO: list of all my watch only wallets</Text>
            </BottomSheet>
        </>
    );
};
