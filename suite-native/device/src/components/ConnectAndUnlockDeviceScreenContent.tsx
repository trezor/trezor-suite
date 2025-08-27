import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ConnectDeviceAnimation } from './ConnectDeviceAnimation';

type ConnectAndUnlockDeviceScreenContentProps = {
    onConnectViaBluetooth?: () => void;
};

export const ConnectAndUnlockDeviceScreenContent = ({
    onConnectViaBluetooth,
}: ConnectAndUnlockDeviceScreenContentProps) => (
    <VStack paddingTop="sp16" spacing="sp32" flex={1}>
        <VStack spacing="sp32" alignItems="center">
            <Text variant="titleMedium" textAlign="center">
                <Translation id="moduleConnectDevice.connectAndUnlockScreen.title" />
            </Text>
            {onConnectViaBluetooth && (
                <Button
                    size="medium"
                    colorScheme="blueBold"
                    viewLeft="bluetooth"
                    onPress={onConnectViaBluetooth}
                >
                    <Translation id="moduleConnectDevice.connectAndUnlockScreen.connectViaBluetoothButton" />
                </Button>
            )}
        </VStack>
        <Box flex={1} alignItems="center">
            <ConnectDeviceAnimation />
        </Box>
    </VStack>
);
