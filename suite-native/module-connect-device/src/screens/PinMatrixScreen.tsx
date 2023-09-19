import { Image, VStack } from '@suite-native/atoms';

import { ConnectDeviceScreen } from '../components/ConnectDeviceScreen';
import { PinForm } from '../components/PinForm';

export const PinMatrixScreen = () => (
    <ConnectDeviceScreen>
        <VStack spacing="medium" alignItems="center" flex={1} marginTop="large">
            {/* eslint-disable-next-line global-require */}
            <Image source={require('../assets/trezorPin.png')} width={161} height={194} />
            <PinForm />
        </VStack>
    </ConnectDeviceScreen>
);
