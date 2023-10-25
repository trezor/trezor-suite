import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, HStack, IconButton, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectSelectedDevicesName } from '@suite-common/wallet-core';

import { SCREEN_HEADER_HEIGHT } from '../constants';
import { useDeviceManager } from '../hooks/useDeviceManager';

const switchWrapperStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    height: SCREEN_HEADER_HEIGHT,
    paddingVertical: utils.spacings.small,
    paddingHorizontal: utils.spacings.medium,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.large,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

export const DeviceSwitch = () => {
    const deviceName = useSelector(selectSelectedDevicesName);

    const { applyStyle } = useNativeStyles();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const toggleDeviceManager = () => {
        setIsDeviceManagerVisible(!isDeviceManagerVisible);
    };

    return (
        <Pressable style={{ flex: 1 }} onPress={toggleDeviceManager}>
            <HStack alignItems="center">
                <Box style={applyStyle(switchWrapperStyle)}>
                    <HStack>
                        <Icon name="trezor" />
                        <Text>{deviceName}</Text>
                    </HStack>
                    <Icon name="chevronUpAndDown" />
                </Box>
                {isDeviceManagerVisible && (
                    <IconButton
                        colorScheme="tertiaryElevation0"
                        iconName="close"
                        onPress={toggleDeviceManager}
                    />
                )}
            </HStack>
        </Pressable>
    );
};
