import { useCallback, useState } from 'react';
import { openSettings } from 'react-native-permissions';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { setShouldShowSystemUnpairingAlert } from '../bluetoothSlice';
import { selectBluetoothAdapterStatus, selectBluetoothPermissionStatus } from '../selectors';
import { useBluetoothPermissions } from './useBluetoothPermissions';
import { useBluetoothSettings } from './useBluetoothSettings';

export const useBluetoothAlerts = () => {
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { requestBluetoothPermission } = useBluetoothPermissions();
    const { openBluetoothSettings } = useBluetoothSettings();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);

    const [isBluetoothAlertShown, setIsBluetoothAlertShown] = useState(false);

    const showOrHideBluetoothAlert = useCallback(() => {
        if (bluetoothPermissionStatus === 'denied') {
            showAlert({
                title: translate('bluetooth.alerts.permissionDenied.title'),
                description: translate('bluetooth.alerts.permissionDenied.description'),
                primaryButtonTitle: translate('bluetooth.alerts.permissionDenied.primaryButton'),
                onPressPrimaryButton: requestBluetoothPermission,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                onPressSecondaryButton: navigation.goBack,
            });
            setIsBluetoothAlertShown(true);
        } else if (bluetoothPermissionStatus === 'blocked') {
            showAlert({
                title: translate('bluetooth.alerts.permissionBlocked.title'),
                description: translate('bluetooth.alerts.permissionBlocked.description'),
                primaryButtonTitle: translate('bluetooth.alerts.permissionBlocked.primaryButton'),
                onPressPrimaryButton: openSettings,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                onPressSecondaryButton: navigation.goBack,
            });
            setIsBluetoothAlertShown(true);
        } else if (bluetoothAdapterStatus === 'disabled') {
            showAlert({
                title: translate('bluetooth.alerts.adapterDisabled.title'),
                description: translate('bluetooth.alerts.adapterDisabled.description'),
                primaryButtonTitle: translate('bluetooth.alerts.adapterDisabled.primaryButton'),
                onPressPrimaryButton: openBluetoothSettings,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                onPressSecondaryButton: navigation.goBack,
            });
            setIsBluetoothAlertShown(true);
        } else if (bluetoothAdapterStatus === 'enabled') {
            if (isBluetoothAlertShown) {
                hideAlert();
                setIsBluetoothAlertShown(false);
            }
        }
    }, [
        bluetoothPermissionStatus,
        requestBluetoothPermission,
        bluetoothAdapterStatus,
        isBluetoothAlertShown,
        openBluetoothSettings,
        navigation,
        translate,
        showAlert,
        hideAlert,
    ]);

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
                dispatch(setShouldShowSystemUnpairingAlert(false));
                openBluetoothSettings();
            },
            secondaryButtonTitle: translate('bluetooth.alerts.systemUnpairing.secondaryButton'),
            onPressSecondaryButton: () => {
                dispatch(setShouldShowSystemUnpairingAlert(false));
            },
        });
    }, [showAlert, dispatch, openBluetoothSettings, translate]);

    return {
        showOrHideBluetoothAlert,
        showPairingFailedAlert,
        showSystemUnpairingAlert,
    };
};
