import { Text, Image, VStack } from '@suite-native/atoms';

import { ConnectDeviceScreen } from '../components/ConnectDeviceScreen';

export const ConnectAndUnlockDeviceScreen = () => (
    <ConnectDeviceScreen>
        <VStack flex={1} justifyContent="flex-end">
            <Text variant="titleMedium" textAlign="center">
                Connect & unlock your Trezor
            </Text>
            <Image
                // eslint-disable-next-line global-require
                source={require('../assets/connectedTrezor.png')}
                accessibilityLabel="Connected Trezor"
            />
        </VStack>
    </ConnectDeviceScreen>
);
