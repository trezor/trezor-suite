import { Image, Text, VStack } from '@suite-native/atoms';

import { ConnectDeviceScreen } from '../components/ConnectDeviceScreen';
import { PinForm } from '../components/PinForm';

export const PinMatrixScreen = () => (
    <ConnectDeviceScreen>
        <VStack spacing="extraLarge" alignItems="center" flex={1} marginTop="extraLarge">
            {/* eslint-disable-next-line global-require */}
            <Image source={require('../assets/trezorPin.png')} width={161} height={194} />
            <Text variant="hint">The keypad is displayed on your Trezor</Text>
            <PinForm />
        </VStack>
    </ConnectDeviceScreen>
);
