import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Image, Text } from '@suite-native/atoms';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectDeviceRequestedPassphrase,
    selectDeviceRequestedPin,
    selectIsCreatingNewPassphraseWallet,
    selectPassphraseError,
} from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { DeviceModelInternal } from '@trezor/connect';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { deviceImageMap } from '../../constants/deviceImageConstants';

const SCREEN_HEIGHT = getScreenHeight();

const wrapperStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.sp24,
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
