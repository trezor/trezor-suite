import { useSelector } from 'react-redux';

import { HStack, Loader, Text, VStack, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { selectBluetoothAdapterStatus } from '@suite-native/bluetooth';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TurnOnDeviceAnimation } from './TurnOnDeviceAnimation';

const ANIMATION_HEIGHT = getScreenHeight() * 0.6;

type TurnOnAndUnlockDeviceScreenContentProps = {
    isStatusVisible?: boolean;
};

const statusStyle = prepareNativeStyle((_, { isStatusVisible }: { isStatusVisible: boolean }) => ({
    height: buttonSizeToDimensionsMap.medium.minHeight,
    alignItems: 'center',
    opacity: isStatusVisible ? 1 : 0, // use opacity to prevent layout shifts
}));

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

export const TurnOnAndUnlockDeviceScreenContent = ({
    isStatusVisible = true,
}: TurnOnAndUnlockDeviceScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);

    return (
        <VStack paddingTop="sp24" flex={1} justifyContent="space-between" alignItems="center">
            <VStack spacing="sp32">
                <Text variant="titleMedium" textAlign="center">
                    <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.title" />
                </Text>
                <HStack style={applyStyle(statusStyle, { isStatusVisible })}>
                    {bluetoothAdapterStatus === 'disabled' && (
                        <>
                            <Icon name="bluetoothSlash" color="iconAlertBlue" />
                            <Text variant="body" color="textAlertBlue">
                                <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.status.adapterDisabled" />
                            </Text>
                        </>
                    )}
                    {bluetoothAdapterStatus === 'enabled' && (
                        <>
                            <Loader color="iconAlertBlue" />
                            <Text variant="body" color="textAlertBlue">
                                <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.status.scanning" />
                            </Text>
                        </>
                    )}
                </HStack>
            </VStack>
            <TurnOnDeviceAnimation style={applyStyle(animationStyle)} />
        </VStack>
    );
};
