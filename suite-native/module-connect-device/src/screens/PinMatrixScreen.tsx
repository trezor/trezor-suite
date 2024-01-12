import { Image, VStack } from '@suite-native/atoms';
import { PinForm } from '@suite-native/device';

import { ConnectDeviceSreenView } from '../components/ConnectDeviceSreenView';

export const PinMatrixScreen = () => (
    <ConnectDeviceSreenView>
        <VStack spacing="medium" alignItems="center" flex={1} marginTop="large">
            <Image source={require('../assets/trezorPin.png')} width={161} height={194} />
            <PinForm />
        </VStack>
    </ConnectDeviceSreenView>
);
