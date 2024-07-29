import { useDispatch, useSelector } from 'react-redux';
import { Dimensions } from 'react-native';
import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Image, Box, Text } from '@suite-native/atoms';
import { DeviceModelInternal } from '@trezor/connect';
import {
    selectDeviceRequestedPin,
    selectDeviceRequestedPassphrase,
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
    selectPassphraseError,
} from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

export const deviceImageMap: Record<DeviceModelInternal, string> = {
    [DeviceModelInternal.T1B1]: require('../../assets/connect/pin-t1b1.png'),
    [DeviceModelInternal.T2T1]: require('../../assets/connect/pin-t2t1.png'),
    [DeviceModelInternal.T2B1]: require('../../assets/connect/pin-t3b1.png'),
    [DeviceModelInternal.T3B1]: require('../../assets/connect/pin-t3b1.png'),
    [DeviceModelInternal.T3T1]: require('../../assets/connect/pin-t3t1.png'),
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
    const dispatch = useDispatch();
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const hasDeviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);
    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);
    const hasPassphraseError = !!useSelector(selectPassphraseError);

    const { applyStyle } = useNativeStyles();

    const navigation = useNavigation();

    const handlePinFlowFinish = useCallback(() => {
        const isNotPassphraseFlowActive = !hasDeviceRequestedPassphrase && !hasPassphraseError;

        // If the device asks for a passphrase after unlocking the PIN, we ignore this and let the passphrase flow handle the success / failure.
        if (navigation.canGoBack() && isNotPassphraseFlowActive) {
            // Remove unauthorized passphrase device if it was created before prompting the PIN in case of PIN flow exit.
            if (isCreatingNewWalletInstance)
                dispatch(cancelPassphraseAndSelectStandardDeviceThunk());

            navigation.goBack();
        }
    }, [
        hasDeviceRequestedPassphrase,
        hasPassphraseError,
        isCreatingNewWalletInstance,
        dispatch,
        navigation,
    ]);

    useEffect(() => {
        // hasDeviceRequestedPin is false when the user unlocks the device again
        // after it was already unlocked and then became locked.
        // (e.g., when attempting to verify the receive address with locked device).
        if (!hasDeviceRequestedPin) {
            handlePinFlowFinish();
        }
    }, [hasDeviceRequestedPin, handlePinFlowFinish]);

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Text variant="titleMedium" textAlign="center">
                <Translation id="moduleConnectDevice.pinScreen.title" />
            </Text>
            <Image source={deviceImageMap[deviceModel]} style={applyStyle(imageStyle)} />
        </Box>
    );
};
