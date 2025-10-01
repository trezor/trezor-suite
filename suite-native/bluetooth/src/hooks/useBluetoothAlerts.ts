import { useCallback } from 'react';
import { openSettings } from 'react-native-permissions';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { selectBluetoothAdapterStatus, selectBluetoothPermissionStatus } from '../selectors';
import { useBluetoothPermissions } from './useBluetoothPermissions';
// @ts-expect-error The definition of the hook is stored in platform-specific files (.ios.tsx for iOS, .android.tsx for Android).
import { useBluetoothPlatformSpecificAlerts } from './useBluetoothPlatformSpecificAlerts';
import { useBluetoothSettings } from './useBluetoothSettings';

export const useBluetoothAlerts = () => {
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();

    const { requestBluetoothPermission } = useBluetoothPermissions();
    const { openLocationServicesSettings } = useBluetoothSettings();
    const { showBluetoothAdapterDisabledAlert, showPairingFailedAlert, showSystemUnpairingAlert } =
        useBluetoothPlatformSpecificAlerts();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);

    const showOrHideBluetoothAlert = useCallback(() => {
        if (bluetoothPermissionStatus === 'denied') {
            showAlert({
                title: translate('bluetooth.alerts.permissionDenied.title'),
                type: 'bluetoothAdapter',
                description: translate('bluetooth.alerts.permissionDenied.description'),
                primaryButtonTitle: translate('bluetooth.alerts.permissionDenied.primaryButton'),
                onPressPrimaryButton: requestBluetoothPermission,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                onPressSecondaryButton: navigation.goBack,
            });
        } else if (bluetoothPermissionStatus === 'blocked') {
            showAlert({
                title: translate('bluetooth.alerts.permissionBlocked.title'),
                type: 'bluetoothAdapter',
                description: translate('bluetooth.alerts.permissionBlocked.description'),
                primaryButtonTitle: translate('bluetooth.alerts.permissionBlocked.primaryButton'),
                onPressPrimaryButton: openSettings,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                onPressSecondaryButton: navigation.goBack,
            });
        } else if (bluetoothAdapterStatus === 'disabled') {
            showBluetoothAdapterDisabledAlert();
        } else if (bluetoothAdapterStatus === 'enabled') {
            hideAlert('bluetoothAdapter');
        }
    }, [
        bluetoothPermissionStatus,
        requestBluetoothPermission,
        bluetoothAdapterStatus,
        navigation,
        translate,
        showAlert,
        showBluetoothAdapterDisabledAlert,
        hideAlert,
    ]);

    const showLocationServicesDisabledAlert = useCallback(() => {
        showAlert({
            title: translate('bluetooth.alerts.locationServicesDisabled.title'),
            description: translate('bluetooth.alerts.locationServicesDisabled.description'),
            primaryButtonTitle: translate(
                'bluetooth.alerts.locationServicesDisabled.primaryButton',
            ),
            onPressPrimaryButton: openLocationServicesSettings,
            secondaryButtonTitle: translate('generic.buttons.cancel'),
            onPressSecondaryButton: navigation.goBack,
        });
    }, [showAlert, openLocationServicesSettings, translate, navigation]);

    return {
        showOrHideBluetoothAlert,
        showLocationServicesDisabledAlert,
        showPairingFailedAlert,
        showSystemUnpairingAlert,
    };
};
