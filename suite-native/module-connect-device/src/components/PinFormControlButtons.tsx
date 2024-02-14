import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, HStack, IconButton } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import TrezorConnect, { UI, DEVICE } from '@trezor/connect';
import {
    selectDevice,
    selectDeviceAuthFailed,
    removeButtonRequests,
    authorizeDevice,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useOpenLink } from '@suite-native/link';

import { PIN_HELP_URL } from '../constants/pinFormConstants';

export const PinFormControlButtons = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const openLink = useOpenLink();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const {
        handleSubmit,
        getValues,
        watch,
        setValue,
        reset,
        formState: { isSubmitted },
    } = useFormContext();
    const device = useSelector(selectDevice) ?? null;
    const hasDeviceAuthFailed = useSelector(selectDeviceAuthFailed);

    const handleSuccess = useCallback(() => {
        if (isSubmitted && !hasDeviceAuthFailed) {
            reset();
            navigation.goBack();
        }
    }, [hasDeviceAuthFailed, navigation, isSubmitted, reset]);

    const handleInvalidPin = useCallback(() => {
        reset();
        showAlert({
            title: translate('moduleConnectDevice.pinScreen.wrongPinAlert.title'),
            description: translate('moduleConnectDevice.pinScreen.wrongPinAlert.description'),
            icon: 'warningCircle',
            pictogramVariant: 'red',
            primaryButtonTitle: translate(
                'moduleConnectDevice.pinScreen.wrongPinAlert.button.tryAgain',
            ),
            onPressPrimaryButton: () => {
                if (hasDeviceAuthFailed) {
                    dispatch(authorizeDevice());
                }
            },
            secondaryButtonTitle: translate(
                'moduleConnectDevice.pinScreen.wrongPinAlert.button.help',
            ),
            onPressSecondaryButton: () => {
                openLink(PIN_HELP_URL);
            },
        });
    }, [dispatch, hasDeviceAuthFailed, openLink, reset, showAlert, translate]);

    useEffect(() => {
        TrezorConnect.on(DEVICE.CHANGED, handleSuccess);

        return () => TrezorConnect.off(DEVICE.CHANGED, handleSuccess);
    }, [handleSuccess]);

    useEffect(() => {
        if (hasDeviceAuthFailed) {
            handleInvalidPin();
        }
    }, [handleInvalidPin, hasDeviceAuthFailed]);

    useEffect(() => {
        TrezorConnect.on(UI.INVALID_PIN, handleInvalidPin);

        return () => TrezorConnect.off(UI.INVALID_PIN, handleInvalidPin);
    }, [handleInvalidPin]);

    const onSubmit = handleSubmit(values => {
        dispatch(removeButtonRequests({ device }));
        TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: values.pin });
    });

    const handleDelete = () => {
        const pin = getValues('pin');
        setValue('pin', pin.slice(0, -1));
    };

    const pinLength = watch('pin').length;

    return (
        <HStack spacing="medium">
            {!!pinLength && (
                <IconButton
                    onPress={handleDelete}
                    iconName="backspace"
                    colorScheme="tertiaryElevation1"
                />
            )}
            <Box flex={1}>
                <Button onPress={onSubmit}>
                    {translate('moduleConnectDevice.pinScreen.form.enterPin')}
                </Button>
            </Box>
        </HStack>
    );
};
