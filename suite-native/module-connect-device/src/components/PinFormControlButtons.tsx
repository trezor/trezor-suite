import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, HStack, IconButton } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import TrezorConnect, { UI } from '@trezor/connect';
import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsDeviceUnlocked, selectDeviceAuthFailed } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useOpenLink } from '@suite-native/link';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';

import { PIN_HELP_URL } from '../constants/pinFormConstants';

type NavigationProp = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.PinMatrix,
    RootStackParamList
>;

export const PinFormControlButtons = () => {
    const openLink = useOpenLink();
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProp>();
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const { showAlert } = useAlert();
    const { handleSubmit, getValues, watch, setValue, reset } = useFormContext();
    const hasDeviceAuthFailed = useSelector(selectDeviceAuthFailed);

    useEffect(() => {
        // Connect doesn't have an event for correct pin entry,
        // but we can subscribe to this property change instead
        // which gets changed after succesfull auth
        if (isDeviceUnlocked) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectingDevice,
            });
        }
    }, [isDeviceUnlocked, navigation]);

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
                    // Ask for new PIN entry after 3 wrong attempts.
                    requestPrioritizedDeviceAccess(() => dispatch(authorizeDevice()));
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
        // After third wrong PIN, UI.INVALID_PIN is no more reported
        // and selectedDevice.authFailed is set to true instead.
        if (hasDeviceAuthFailed) {
            handleInvalidPin();
        }
    }, [handleInvalidPin, hasDeviceAuthFailed]);

    useEffect(() => {
        // UI.INVALID_PIN is emitted when user enters wrong PIN for first 3 attempts.
        // See https://github.com/trezor/trezor-suite/blob/0498c2ef4c0a61ff56fc60cff0f545636592814d/packages/connect/src/core/index.ts#L598
        TrezorConnect.on(UI.INVALID_PIN, handleInvalidPin);

        return () => TrezorConnect.off(UI.INVALID_PIN, handleInvalidPin);
    }, [handleInvalidPin]);

    const onSubmit = handleSubmit(values => {
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
