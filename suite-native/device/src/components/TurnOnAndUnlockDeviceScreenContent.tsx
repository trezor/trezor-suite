import { useSelector } from 'react-redux';

import { HStack, Loader, Text, VStack, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { selectBluetoothAdapterStatus } from '@suite-native/bluetooth';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TurnOnDeviceAnimation } from './TurnOnDeviceAnimation';

type TurnOnAndUnlockDeviceScreenContentProps = {
    isStatusVisible?: boolean;
};

const statusStyle = prepareNativeStyle((_, { isStatusVisible }: { isStatusVisible: boolean }) => ({
    height: buttonSizeToDimensionsMap.medium.minHeight,
    alignItems: 'center',
    opacity: isStatusVisible ? 1 : 0, // use opacity to prevent layout shifts
}));

export const TurnOnAndUnlockDeviceScreenContent = ({
    isStatusVisible = true,
}: TurnOnAndUnlockDeviceScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);

    return (
        <VStack paddingTop="sp16" spacing="sp32" flex={1} justifyContent="space-between">
            <VStack spacing="sp32" alignItems="center">
                <Text variant="headline-md" textAlign="center">
                    <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.title" />
                </Text>
                <HStack style={applyStyle(statusStyle, { isStatusVisible })}>
                    {bluetoothAdapterStatus === 'disabled' && (
                        <>
                            <Icon name="bluetoothSlash" color="iconAlertBlue" />
                            <Text variant="body-md" color="textAlertBlue">
                                <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.status.adapterDisabled" />
                            </Text>
                        </>
                    )}
                    {bluetoothAdapterStatus === 'enabled' && (
                        <>
                            <Loader color="iconPrimaryDefault" />
                            <Text variant="body-md" color="textPrimaryDefault">
                                <Translation id="moduleConnectDevice.turnOnAndUnlockScreen.status.scanning" />
                            </Text>
                        </>
                    )}
                </HStack>
            </VStack>
            <TurnOnDeviceAnimation />
        </VStack>
    );
};
