import { HStack, Loader, Text, VStack, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TurnOnDeviceAnimation } from './TurnOnDeviceAnimation';

const ANIMATION_HEIGHT = getScreenHeight() * 0.6;

type TurnOnAndUnlockDeviceScreenContentProps = {
    isScanningInProgress: boolean;
};

const loaderStyle = prepareNativeStyle(
    (_, { isScanningInProgress }: { isScanningInProgress: boolean }) => ({
        height: buttonSizeToDimensionsMap.medium.minHeight,
        alignItems: 'center',
        opacity: isScanningInProgress ? 1 : 0, // use opacity to prevent layout shifts
    }),
);

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

export const TurnOnAndUnlockDeviceScreenContent = ({
    isScanningInProgress,
}: TurnOnAndUnlockDeviceScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack paddingTop="sp24" flex={1} justifyContent="space-between" alignItems="center">
            <VStack spacing="sp32">
                <Text variant="titleMedium" textAlign="center">
                    <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.title" />
                </Text>
                <HStack style={applyStyle(loaderStyle, { isScanningInProgress })}>
                    <Loader color="iconAlertBlue" />
                    <Text variant="body" color="textAlertBlue">
                        <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.scanningLoader" />
                    </Text>
                </HStack>
            </VStack>
            <TurnOnDeviceAnimation style={applyStyle(animationStyle)} />
        </VStack>
    );
};
