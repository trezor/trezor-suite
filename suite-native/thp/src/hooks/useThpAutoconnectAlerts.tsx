import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { removeThpAutoconnectThunk, startThpAutoconnectThunk, thpActions } from '@suite-common/thp';
import { selectDeviceAutoconnectCredentials } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

export const useThpAutoconnectAlerts = () => {
    const dispatch = useDispatch();
    const { showAlert } = useAlert();
    const { showToast } = useToast();
    const navigation = useNavigation();

    const autoconnectCredentials = useSelector(selectDeviceAutoconnectCredentials);

    const turnOnAutoconnect = useCallback(async () => {
        const response = await dispatch(startThpAutoconnectThunk()).unwrap();

        if (isRejected(response)) {
            showToast({
                variant: 'error',
                message: response.error.message,
            });
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [dispatch, navigation, showToast]);

    const turnOffAutoconnect = useCallback(async () => {
        const result = await dispatch(
            removeThpAutoconnectThunk({
                credentials: autoconnectCredentials,
            }),
        ).unwrap();

        if (isRejected(result)) {
            showToast({
                variant: 'error',
                message: result.error.message,
            });
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation, dispatch, autoconnectCredentials, showToast]);

    const ignoreAutoconnect = useCallback(() => {
        dispatch(thpActions.finishThpFlow());
    }, [dispatch]);

    const showThpAutoconnectTurnOffAlert = useCallback(() => {
        showAlert({
            title: <Translation id="moduleDeviceSettings.autoconnect.disable.title" />,
            description: <Translation id="moduleDeviceSettings.autoconnect.disable.description" />,
            primaryButtonTitle: (
                <Translation id="moduleDeviceSettings.autoconnect.disable.turnOnButton" />
            ),
            onPressPrimaryButton: turnOffAutoconnect,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    }, [showAlert, turnOffAutoconnect]);

    const showThpAutoconnectTurnOnAlert = useCallback(() => {
        showAlert({
            title: <Translation id="moduleDeviceSettings.autoconnect.enable.title" />,
            description: <Translation id="moduleDeviceSettings.autoconnect.enable.description" />,
            primaryButtonTitle: (
                <Translation id="moduleDeviceSettings.autoconnect.enable.turnOnButton" />
            ),
            onPressPrimaryButton: turnOnAutoconnect,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    }, [showAlert, turnOnAutoconnect]);

    // this is a first-time alert to enable autoconnect
    const showThpAutoconnectEnableAlert = useCallback(() => {
        showAlert({
            title: <Translation id="thp.autoconnect.title" />,
            description: <Translation id="thp.autoconnect.description" />,
            primaryButtonTitle: <Translation id="thp.autoconnect.turnOnButton" />,
            onPressPrimaryButton: turnOnAutoconnect,
            secondaryButtonTitle: <Translation id="thp.autoconnect.noThanksButton" />,
            onPressSecondaryButton: ignoreAutoconnect,
        });
    }, [showAlert, turnOnAutoconnect, ignoreAutoconnect]);

    return {
        showThpAutoconnectEnableAlert,
        showThpAutoconnectTurnOffAlert,
        showThpAutoconnectTurnOnAlert,
    };
};
