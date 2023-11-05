import { useSelector } from 'react-redux';

import { Box, Button, HStack } from '@suite-native/atoms';
import { selectDevice } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

export const DeviceControlButtons = () => {
    const selectedDevice = useSelector(selectDevice);

    const { translate } = useTranslate();

    if (!selectedDevice) return null;

    const handleEject = () => {
        // TODO
    };

    const handleDeviceRedirect = () => {
        // TODO
    };

    return (
        <HStack>
            <Box flex={1}>
                <Button colorScheme="dangerElevation0" iconLeft="eject" onPress={handleEject}>
                    {translate('deviceManager.deviceButtons.eject')}
                </Button>
            </Box>
            <Box flex={2}>
                <Button colorScheme="tertiaryElevation0" onPress={handleDeviceRedirect}>
                    {translate('deviceManager.deviceButtons.deviceInfo')}
                </Button>
            </Box>
        </HStack>
    );
};
