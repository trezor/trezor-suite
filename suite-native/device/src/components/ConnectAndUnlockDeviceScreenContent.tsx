import { Button, Text, VStack } from '@suite-native/atoms';
import { ConnectDeviceAnimation } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ANIMATION_HEIGHT = getScreenHeight() * 0.6;

const screenContentStyle = prepareNativeStyle(({ spacings }) => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacings.sp24,
}));

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

type ConnectAndUnlockDeviceScreenContentProps = {
    onConnectViaBluetooth?: () => void; // TODO: Can we make mandatory?
};

export const ConnectAndUnlockDeviceScreenContent = ({
    onConnectViaBluetooth,
}: ConnectAndUnlockDeviceScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack style={applyStyle(screenContentStyle)}>
            <VStack spacing="sp32">
                <Text variant="titleMedium" textAlign="center">
                    <Translation id="moduleConnectDevice.connectAndUnlockScreen.title" />
                </Text>
                {onConnectViaBluetooth && (
                    <Button
                        size="small"
                        colorScheme="tertiaryElevation0"
                        viewLeft="bluetooth"
                        onPress={onConnectViaBluetooth}
                    >
                        <Translation id="moduleConnectDevice.connectAndUnlockScreen.connectViaBluetoothButton" />
                    </Button>
                )}
            </VStack>
            <ConnectDeviceAnimation style={applyStyle(animationStyle)} />
        </VStack>
    );
};
