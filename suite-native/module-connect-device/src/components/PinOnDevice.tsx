import { useSelector } from 'react-redux';
import { Dimensions } from 'react-native';
import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Image, Box, Text } from '@suite-native/atoms';
import { DeviceModelInternal } from '@trezor/connect';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

export const deviceImageMap: Record<DeviceModelInternal, string> = {
    [DeviceModelInternal.T1B1]: require('../assets/pin-t1b1.png'),
    [DeviceModelInternal.T2T1]: require('../assets/pin-t2t1.png'),
    [DeviceModelInternal.T2B1]: require('../assets/pin-t2b1.png'),
    [DeviceModelInternal.T3T1]: require('../assets/pin-t3t1.png'),
};

const wrapperStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.large,
}));
const imageStyle = prepareNativeStyle(_ => ({
    maxHeight: SCREEN_HEIGHT * 0.6,
    width: 243,
    height: 550,
    alignItems: 'center',
    contentFit: 'contain',
}));

type PinOnDeviceProps = {
    deviceModel: DeviceModelInternal;
};

export const PinOnDevice = ({ deviceModel }: PinOnDeviceProps) => {
    const navigation = useNavigation();

    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const { applyStyle } = useNativeStyles();

    const handleSuccess = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);

    useEffect(() => {
        // hasDeviceRequestedPin is false when the user unlocks the device again
        // after it was already unlocked and then became locked.
        // (e.g., when attempting to verify the receive address with locked device).
        if (!hasDeviceRequestedPin) {
            handleSuccess();
        }
    }, [hasDeviceRequestedPin, handleSuccess]);

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Text variant="titleMedium" textAlign="center">
                <Translation id="moduleConnectDevice.pinScreen.title" />
            </Text>
            <Image source={deviceImageMap[deviceModel]} style={applyStyle(imageStyle)} />
        </Box>
    );
};
