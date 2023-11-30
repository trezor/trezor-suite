import { useSelector } from 'react-redux';

import { selectIsConnectedDeviceUninitialized } from '@suite-common/wallet-core';
import { VStack, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const IncompatibleDeviceModalAppendix = () => {
    const isConnectedDeviceUninitialized = useSelector(selectIsConnectedDeviceUninitialized);

    return (
        <VStack>
            <Text variant="callout">
                <Translation id="moduleDevice.IncompatibleDeviceModalAppendix.title" />
            </Text>
            <Box>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.IncompatibleDeviceModalAppendix.lines.1" />
                </Text>
                <Text color="textSubdued">
                    <Translation id="moduleDevice.IncompatibleDeviceModalAppendix.lines.2" />
                </Text>
                <Text color="textSubdued">
                    <Translation
                        id={
                            isConnectedDeviceUninitialized
                                ? 'moduleDevice.IncompatibleDeviceModalAppendix.lines.3.setUp'
                                : 'moduleDevice.IncompatibleDeviceModalAppendix.lines.3.update'
                        }
                    />
                </Text>
            </Box>
        </VStack>
    );
};
