import { HStack, Loader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ConnectDeviceAnimation } from './ConnectDeviceAnimation';

export const ConnectAndUnlockDeviceScreenContent = () => (
    <VStack paddingTop="sp16" spacing="sp32" flex={1} justifyContent="space-between">
        <VStack spacing="sp32" alignItems="center">
            <Text variant="headline-md" textAlign="center">
                <Translation id="moduleConnectDevice.connectAndUnlockScreen.title" />
            </Text>
            <HStack margin="sp12">
                <Loader color="iconPrimaryDefault" />
                <Text variant="body-md" color="textPrimaryDefault">
                    <Translation id="moduleConnectDevice.connectAndUnlockScreen.status" />
                </Text>
            </HStack>
        </VStack>
        <ConnectDeviceAnimation />
    </VStack>
);
