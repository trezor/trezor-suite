import { Image, TextButton, VStack } from '@suite-native/atoms';
import { useBluetoothSettings } from '@suite-native/bluetooth';
import { Translation } from '@suite-native/intl';
import { isAndroid } from '@trezor/env-utils';

const imageSource = isAndroid()
    ? require('../../assets/bluetooth-settings-android.webp')
    : require('../../assets/bluetooth-settings-ios.webp');

export const BluetoothPairingSettings = () => {
    const { openBluetoothSettings } = useBluetoothSettings();

    return (
        <VStack spacing="sp24">
            <Image source={imageSource} height={150} contentFit="contain" />
            <TextButton
                intent="info"
                priority="primary"
                isUnderlined
                iconRight="arrowSquareOut"
                onPress={openBluetoothSettings}
            >
                <Translation id="moduleConnectDevice.helpModal.pairing.settings.goToSettingsButton" />
            </TextButton>
        </VStack>
    );
};
