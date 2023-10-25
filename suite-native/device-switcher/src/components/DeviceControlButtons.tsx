import { useDispatch, useSelector } from 'react-redux';

import { Box, Button, HStack } from '@suite-native/atoms';
import { deviceActions, selectDevice } from '@suite-common/wallet-core';

export const DeviceControlButtons = () => {
    const dispatch = useDispatch();

    const selectedDevice = useSelector(selectDevice);

    if (!selectedDevice) return null;

    const handleEject = () => {
        dispatch(deviceActions.forgetDevice(selectedDevice));
    };

    return (
        <HStack>
            <Box flex={1}>
                <Button colorScheme="dangerElevation0" iconLeft="eject" onPress={handleEject}>
                    Eject
                </Button>
            </Box>
            <Box flex={2}>
                <Button colorScheme="tertiaryElevation0">Device Info</Button>
            </Box>
        </HStack>
    );
};
