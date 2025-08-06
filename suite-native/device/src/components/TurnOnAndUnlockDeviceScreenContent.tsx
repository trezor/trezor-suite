import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TurnOnDeviceAnimation } from './TurnOnDeviceAnimation';

const ANIMATION_HEIGHT = getScreenHeight() * 0.6;

type TurnOnAndUnlockDeviceScreenContentProps = {
    onConnectViaCable?: () => void;
};

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

export const TurnOnAndUnlockDeviceScreenContent = ({
    onConnectViaCable,
}: TurnOnAndUnlockDeviceScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack paddingTop="sp24" flex={1} justifyContent="space-between" alignItems="center">
            <VStack spacing="sp32">
                <Text variant="titleMedium" textAlign="center">
                    <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.title" />
                </Text>
                {onConnectViaCable && (
                    <Button
                        size="small"
                        colorScheme="tertiaryElevation0"
                        viewLeft="cableUsbC"
                        onPress={onConnectViaCable}
                    >
                        <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.connectViaCableButton" />
                    </Button>
                )}
            </VStack>
            <TurnOnDeviceAnimation style={applyStyle(animationStyle)} />
        </VStack>
    );
};
