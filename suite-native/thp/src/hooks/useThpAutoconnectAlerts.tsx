import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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

    const autoconnectCredentials = useSelector(selectDeviceAutoconnectCredentials);

    const turnOnAutoconnect = useCallback(() => {
        dispatch(startThpAutoconnectThunk());
    }, [dispatch]);

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
    }, [dispatch, showToast, autoconnectCredentials]);

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
