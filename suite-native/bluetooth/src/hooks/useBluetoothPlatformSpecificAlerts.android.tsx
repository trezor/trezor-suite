// This is Android version, see the file name.

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { bluetoothActions } from '@suite-common/bluetooth';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { useBluetoothSettings } from './useBluetoothSettings';

export const useBluetoothPlatformSpecificAlerts = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const { openBluetoothSettings } = useBluetoothSettings();

    const showBluetoothAdapterDisabledAlert = useCallback(() => {
        showAlert({
            type: 'bluetoothAdapter',
            title: translate('bluetooth.alerts.adapterDisabled.title'),
            description: translate('bluetooth.alerts.adapterDisabled.description.android'),
            primaryButtonTitle: translate('bluetooth.alerts.adapterDisabled.primaryButton'),
            onPressPrimaryButton: openBluetoothSettings,
            secondaryButtonTitle: translate('generic.buttons.cancel'),
            onPressSecondaryButton: navigation.goBack,
        });
    }, [showAlert, navigation.goBack, openBluetoothSettings, translate]);

    const showPairingFailedAlert = useCallback(() => {
        showAlert({
            title: translate('bluetooth.alerts.pairingFailed.title'),
            description: translate('bluetooth.alerts.pairingFailed.description'),
            primaryButtonTitle: translate('bluetooth.alerts.pairingFailed.primaryButton'),
            onPressPrimaryButton: openBluetoothSettings,
            secondaryButtonTitle: translate('bluetooth.alerts.pairingFailed.secondaryButton'),
        });
    }, [showAlert, openBluetoothSettings, translate]);

    const showSystemUnpairingAlert = useCallback(() => {
        showAlert({
            title: translate('bluetooth.alerts.systemUnpairing.title'),
            description: translate('bluetooth.alerts.systemUnpairing.description'),
            primaryButtonTitle: translate('bluetooth.alerts.systemUnpairing.primaryButton'),
            onPressPrimaryButton: () => {
                dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(false));
                openBluetoothSettings();
            },
            secondaryButtonTitle: translate('bluetooth.alerts.systemUnpairing.secondaryButton'),
            onPressSecondaryButton: () => {
                dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(false));
            },
        });
    }, [showAlert, dispatch, openBluetoothSettings, translate]);

    return {
        showBluetoothAdapterDisabledAlert,
        showPairingFailedAlert,
        showSystemUnpairingAlert,
    };
};
