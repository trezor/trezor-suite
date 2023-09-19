import { Text, Image, VStack } from '@suite-native/atoms';

import { ConnectDeviceBackground } from '../components/ConnectDeviceBackground';

export const ConnectAndUnlockDeviceScreen = () => (
    <ConnectDeviceBackground>
        <VStack flex={1} justifyContent="flex-end">
            <Text variant="titleMedium" textAlign="center">
                Connect & unlock your Trezor
            </Text>
            <Image
                source={require('../assets/connectedTrezor.png')}
                accessibilityLabel="Connected Trezor"
            />
        </VStack>
    </ConnectDeviceBackground>
);
