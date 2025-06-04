import { useCallback } from 'react';
import { openSettings } from 'react-native-permissions';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { selectBluetoothAdapterStatus, selectBluetoothPermissionStatus } from '../selectors';
import { useBluetoothPermissions } from './useBluetoothPermissions';
import { useBluetoothSettings } from './useBluetoothSettings';

export const useBluetoothAlerts = () => {
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();

    const { requestBluetoothPermission } = useBluetoothPermissions();
    const { openBluetoothSettings } = useBluetoothSettings();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);

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
        } else if (bluetoothPermissionStatus === 'blocked') {
            showAlert({
                title: translate('bluetooth.alerts.permissionBlocked.title'),
                description: translate('bluetooth.alerts.permissionBlocked.description'),
                primaryButtonTitle: translate('bluetooth.alerts.permissionBlocked.primaryButton'),
                onPressPrimaryButton: openSettings,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                onPressSecondaryButton: navigation.goBack,
            });
        } else if (bluetoothAdapterStatus === 'disabled') {
            showAlert({
                title: translate('bluetooth.alerts.adapterDisabled.title'),
                description: translate('bluetooth.alerts.adapterDisabled.description'),
                primaryButtonTitle: translate('bluetooth.alerts.adapterDisabled.primaryButton'),
                onPressPrimaryButton: openBluetoothSettings,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                onPressSecondaryButton: navigation.goBack,
            });
        } else if (bluetoothAdapterStatus === 'enabled') {
            hideAlert();
        }
    }, [
        bluetoothPermissionStatus,
        requestBluetoothPermission,
        bluetoothAdapterStatus,
        openBluetoothSettings,
        navigation,
        translate,
        showAlert,
        hideAlert,
    ]);

    return {
        showOrHideBluetoothAlert,
    };
};
