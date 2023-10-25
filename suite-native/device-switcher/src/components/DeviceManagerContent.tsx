import { useSelector } from 'react-redux';

import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectDevices } from '@suite-common/wallet-core';

import { DeviceManagerModal } from './DeviceManagerModal';
import { DeviceItem } from './DeviceItem';
import { DeviceControlButtons } from './DeviceControlButtons';

const modalWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    borderBottomLeftRadius: utils.borders.radii.large,
    borderBottomRightRadius: utils.borders.radii.large,
}));

const contentWrapperStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.medium,
}));

export const DeviceManagerContent = () => {
    const devices = useSelector(selectDevices);

    const { applyStyle } = useNativeStyles();

    return (
        <DeviceManagerModal>
            <Box style={applyStyle(modalWrapperStyle)}>
                <VStack spacing="medium" style={applyStyle(contentWrapperStyle)}>
                    <DeviceControlButtons />
                    <VStack>
                        <Text variant="callout">Open</Text>
                        {devices.map(device => (
                            <DeviceItem id={device.id} key={device.id} />
                        ))}
                    </VStack>
                    <VStack>
                        <Text variant="callout">Connect Trezor device</Text>
                        <Button colorScheme="tertiaryElevation0">Connect</Button>
                    </VStack>
                </VStack>
            </Box>
        </DeviceManagerModal>
    );
};
