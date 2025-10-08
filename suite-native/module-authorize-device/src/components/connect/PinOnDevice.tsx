import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { Box, Text } from '@suite-native/atoms';
import { ConnectorImage } from '@suite-native/device';
import {
    DevicePinImage,
    selectDeviceRequestedPassphrase,
    selectDeviceRequestedPin,
} from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const DEVICE_IMAGE_MAX_HEIGHT = 0.42 * getScreenHeight();
const CONNECTOR_IMAGE_MAX_HEIGHT = 0.18 * getScreenHeight();

const wrapperStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: utils.spacings.sp24,
}));

type PinOnDeviceProps = {
    deviceModel: DeviceModelInternal;
};

export const PinOnDevice = ({ deviceModel }: PinOnDeviceProps) => {
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const hasDeviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);

    const { applyStyle } = useNativeStyles();

    const navigateToInitialScreen = useNavigateToInitialScreen();

    useFocusEffect(
        useCallback(() => {
            // hasDeviceRequestedPin is false when the user unlocks the device again
            // after it was already unlocked and then became locked.
            // (e.g., when attempting to verify the receive address with locked device).
            if (!hasDeviceRequestedPin && !hasDeviceRequestedPassphrase) {
                navigateToInitialScreen();
            }
        }, [hasDeviceRequestedPin, hasDeviceRequestedPassphrase, navigateToInitialScreen]),
    );

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Text variant="titleMedium" textAlign="center">
                <Translation id="moduleConnectDevice.pinScreen.title" />
            </Text>
            <Box alignItems="center" justifyContent="flex-end">
                <DevicePinImage deviceModel={deviceModel} maxHeight={DEVICE_IMAGE_MAX_HEIGHT} />
                <ConnectorImage maxHeight={CONNECTOR_IMAGE_MAX_HEIGHT} />
            </Box>
        </Box>
    );
};
