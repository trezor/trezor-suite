import { useCallback, useEffect, useState } from 'react';
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
import { useToast } from '@suite-native/toasts';

import { PIN_FORM_MIN_LENGTH, PIN_HELP_URL } from '../constants';

export const PinFormControlButtons = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const openLink = useOpenLink();
    const { translate } = useTranslate();
    const { showAlert, hideAlert } = useAlert();
    const { showToast } = useToast();
    const { handleSubmit, getValues, watch, setValue, reset } = useFormContext();
    const device = useSelector(selectDevice) ?? null;
    const hasDeviceAuthFailed = useSelector(selectDeviceAuthFailed);

    const handleSuccess = useCallback(() => {
        if (isSubmitting && !hasDeviceAuthFailed) {
            setIsSubmitting(false);
            navigation.goBack();
        }
    }, [hasDeviceAuthFailed, navigation, isSubmitting]);

    const handleInvalidPin = useCallback(() => {
        setIsSubmitting(false);
        reset();
        showToast({
            variant: 'warning',
            icon: 'lock',
            message: translate('device.pinScreen.form.error.invalidPin'),
        });
    }, [reset, translate, showToast]);

    useEffect(() => {
        TrezorConnect.on(DEVICE.CHANGED, handleSuccess);

        return () => TrezorConnect.off(DEVICE.CHANGED, handleSuccess);
    }, [handleSuccess]);

    useEffect(() => {
        if (hasDeviceAuthFailed) {
            setIsSubmitting(false);
            reset();
            showAlert({
                title: translate('device.pinScreen.wrongPinAlert.title'),
                description: translate('device.pinScreen.wrongPinAlert.description'),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: translate('device.pinScreen.wrongPinAlert.button.tryAgain'),
                onPressPrimaryButton: () => {
                    dispatch(authorizeDevice());
                },
                secondaryButtonTitle: translate('device.pinScreen.wrongPinAlert.button.help'),
                onPressSecondaryButton: () => {
                    openLink(PIN_HELP_URL);
                },
            });
        }
    }, [dispatch, hasDeviceAuthFailed, hideAlert, openLink, reset, showAlert, translate]);

    useEffect(() => {
        TrezorConnect.on(UI.INVALID_PIN, handleInvalidPin);

        return () => TrezorConnect.off(UI.INVALID_PIN, handleInvalidPin);
    }, [handleInvalidPin]);

    const onSubmit = handleSubmit(values => {
        setIsSubmitting(true);
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
                <Button
                    isDisabled={pinLength < PIN_FORM_MIN_LENGTH || isSubmitting}
                    onPress={onSubmit}
                >
                    {isSubmitting
                        ? translate('device.pinScreen.form.submitting')
                        : translate('device.pinScreen.form.enterPin')}
                </Button>
            </Box>
        </HStack>
    );
};
