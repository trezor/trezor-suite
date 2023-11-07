import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, HStack, IconButton, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectSelectedDeviceName } from '@suite-common/wallet-core';

import { SCREEN_HEADER_HEIGHT } from '../constants';
import { useDeviceManager } from '../hooks/useDeviceManager';

const switchStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SCREEN_HEADER_HEIGHT,
    paddingVertical: utils.spacings.small,
    paddingHorizontal: utils.spacings.medium,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.large,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

const switchWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const DeviceSwitch = () => {
    const deviceName = useSelector(selectSelectedDeviceName);

    const { applyStyle } = useNativeStyles();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const toggleDeviceManager = () => {
        setIsDeviceManagerVisible(!isDeviceManagerVisible);
    };

    return (
        <HStack alignItems="center">
            <Pressable onPress={toggleDeviceManager} style={applyStyle(switchWrapperStyle)}>
                <Box style={applyStyle(switchStyle)}>
                    <HStack>
                        <Icon name="trezor" />
                        <Text>{deviceName}</Text>
                    </HStack>
                    <Icon name="chevronUpAndDown" />
                </Box>
            </Pressable>
            {isDeviceManagerVisible && (
                <IconButton
                    colorScheme="tertiaryElevation0"
                    iconName="close"
                    onPress={toggleDeviceManager}
                />
            )}
        </HStack>
    );
};
