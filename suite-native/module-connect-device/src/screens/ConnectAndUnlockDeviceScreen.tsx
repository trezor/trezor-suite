import { Text, Image, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { useDeviceConnect } from '@suite-native/device';

import { ConnectDeviceBackground } from '../components/ConnectDeviceBackground';

export const ConnectAndUnlockDeviceScreen = () => {
    const { translate } = useTranslate();
    useDeviceConnect();

    return (
        <ConnectDeviceBackground>
            <VStack flex={1} justifyContent="flex-end">
                <Text variant="titleMedium" textAlign="center">
                    {translate('moduleConnectDevice.connectAndUnlockScreen.title')}
                </Text>
                <Image
                    source={require('../assets/connectedTrezor.png')}
                    accessibilityLabel="Connected Trezor"
                />
            </VStack>
        </ConnectDeviceBackground>
    );
};
