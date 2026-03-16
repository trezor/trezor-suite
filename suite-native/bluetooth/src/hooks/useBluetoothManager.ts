import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';

import { type BleError, BleErrorCode } from '@trezor/transport-native-bluetooth';

import { selectBluetoothAdapterStatus, selectBluetoothPermissionStatus } from '../selectors';
import { useBluetoothAlerts } from './useBluetoothAlerts';
import { useBluetoothPermissions } from './useBluetoothPermissions';
import { useBluetoothScanner } from './useBluetoothScanner';

export const useBluetoothManager = () => {
    const { requestBluetoothPermission } = useBluetoothPermissions();
    const { showOrHideBluetoothAlert, showLocationServicesDisabledAlert } = useBluetoothAlerts();
    const { startDeviceScan } = useBluetoothScanner();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);

    const [hasPermissionBeenRequested, setHasPermissionBeenRequested] = useState(false);

    const scanErrorHandler = useCallback(
        (error: BleError) => {
            if (error.errorCode === BleErrorCode.LocationServicesDisabled) {
                showLocationServicesDisabledAlert();
            }
        },
        [showLocationServicesDisabledAlert],
    );

    useEffect(() => {
        // Auto-request the permission only once when the screen is shown.
        if (bluetoothPermissionStatus === 'denied' && !hasPermissionBeenRequested) {
            requestBluetoothPermission();
            setHasPermissionBeenRequested(true);
        } else {
            showOrHideBluetoothAlert();
        }
    }, [
        bluetoothPermissionStatus,
        hasPermissionBeenRequested,
        requestBluetoothPermission,
        showOrHideBluetoothAlert,
    ]);

    useEffect(() => {
        // Ensure that the right alert is possibly shown again after returning to the app.
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                showOrHideBluetoothAlert();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [showOrHideBluetoothAlert]);

    useEffect(() => {
        if (bluetoothAdapterStatus === 'enabled') {
            return startDeviceScan(scanErrorHandler);
        }
    }, [bluetoothAdapterStatus, startDeviceScan, scanErrorHandler]);
};
