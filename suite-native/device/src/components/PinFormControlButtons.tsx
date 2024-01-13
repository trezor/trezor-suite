import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Button, HStack, IconButton } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import TrezorConnect, { UI } from '@trezor/connect';
import { selectDevice, removeButtonRequests } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useOpenLink } from '@suite-native/link';

import { PIN_FORM_MIN_LENGTH, PIN_HELP_URL } from '../constants';

export const PinFormControlButtons = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    const openLink = useOpenLink();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const { handleSubmit, getValues, watch, setValue, reset } = useFormContext();
    const device = useSelector(selectDevice) ?? null;

    const handleInvalidPin = useCallback(() => {
        setIsSubmitting(false);
        showAlert({
            title: translate('device.pinScreen.wrongPinAlert.title'),
            description: translate('device.pinScreen.wrongPinAlert.description'),
            icon: 'warningCircle',
            pictogramVariant: 'red',
            primaryButtonTitle: translate('device.pinScreen.wrongPinAlert.button.tryAgain'),
            onPressPrimaryButton: reset,
            secondaryButtonTitle: translate('device.pinScreen.wrongPinAlert.button.help'),
            onPressSecondaryButton: () => {
                openLink(PIN_HELP_URL);
                reset();
            },
        });
    }, [reset, showAlert, translate, openLink]);

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
