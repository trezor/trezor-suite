import { Image, VStack } from '@suite-native/atoms';

import { ConnectDeviceBackground } from '../components/ConnectDeviceBackground';
import { PinForm } from '../components/PinForm';

export const PinMatrixScreen = () => (
    <ConnectDeviceBackground>
        <VStack spacing="m" alignItems="center" flex={1} marginTop="large">
            <Image source={require('../assets/trezorPin.png')} width={161} height={194} />
            <PinForm />
        </VStack>
    </ConnectDeviceBackground>
);
