import { useSelector } from 'react-redux';

import { selectIsDeviceProtectedByPin, selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, CardWithIconLayout, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { DevicePinActionButton } from './DevicePinActionButton';

export const DevicePinProtectionCard = () => {
    const device = useSelector(selectSelectedDevice);
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);

    if (!device) {
        return;
    }

    return (
        <CardWithIconLayout
            icon="password"
            title={<Translation id="moduleDeviceSettings.pinProtection.title" />}
        >
            <VStack marginTop="sp2" spacing="sp16">
                <Text variant="body" color="textSubdued">
                    <Translation id="moduleDeviceSettings.pinProtection.content" />
                </Text>
                {!isDeviceProtectedByPin ? (
                    <DevicePinActionButton type="enable">
                        <Translation id="generic.buttons.enable" />
                    </DevicePinActionButton>
                ) : (
                    <HStack>
                        <DevicePinActionButton type="disable" colorScheme="redElevation0">
                            <Translation id="generic.buttons.disable" />
                        </DevicePinActionButton>
                        <Box flex={1}>
                            <DevicePinActionButton type="change" colorScheme="tertiaryElevation0">
                                <Translation id="moduleDeviceSettings.pinProtection.changeButton" />
                            </DevicePinActionButton>
                        </Box>
                    </HStack>
                )}
            </VStack>
        </CardWithIconLayout>
    );
};
