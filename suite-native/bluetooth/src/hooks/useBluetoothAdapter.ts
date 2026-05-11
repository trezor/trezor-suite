import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { bluetoothActions, parseManufacturerData } from '@suite-common/bluetooth';
import { useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import { asBluetoothDeviceId } from '@trezor/connect';
import {
    type BluetoothDevice as TransportBluetoothDevice,
    bluetoothManager,
} from '@trezor/transport-native-bluetooth';

import {
    selectBluetoothAdapterStatus,
    selectBluetoothPermissionStatus,
    selectKnownBluetoothDevices,
    selectKnownConnectableBluetoothDevices,
} from '../selectors';
import { useBluetoothAlerts } from './useBluetoothAlerts';
import { useBluetoothDevice } from './useBluetoothDevice';
import { useBluetoothPermissions } from './useBluetoothPermissions';
import { useBluetoothScanner } from './useBluetoothScanner';

const toBluetoothDevice = (device: TransportBluetoothDevice) => ({
    ...device,
    id: asBluetoothDeviceId(device.id),
    manufacturerData: parseManufacturerData(device.manufacturerData),
});

export const useBluetoothAdapter = () => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const { translate } = useTranslate();

    const { checkBluetoothPermission } = useBluetoothPermissions();
    const { showPairingFailedAlert } = useBluetoothAlerts();
    const { startDeviceScan } = useBluetoothScanner();
    const { connectBluetoothDevice } = useBluetoothDevice();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);
    const knownBluetoothDevices = useSelector(selectKnownBluetoothDevices);
    const knownConnectableBluetoothDevices = useSelector(selectKnownConnectableBluetoothDevices);

    useEffect(() => {
        checkBluetoothPermission();

        // check the required permissions every time the app becomes active
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkBluetoothPermission();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [checkBluetoothPermission]);

    useEffect(() => {
        if (bluetoothPermissionStatus !== 'granted') {
            dispatch(bluetoothActions.adapterEventAction({ status: 'unknown' }));
        } else {
            const subscriptions = [
                bluetoothManager.onAdapterStatusChange(state => {
                    const status = state === 'PoweredOn' ? 'enabled' : 'disabled';
                    dispatch(bluetoothActions.adapterEventAction({ status }));
                }),
                bluetoothManager.onNearbyDevicesChange(nearbyDevices => {
                    dispatch(
                        bluetoothActions.nearbyDevicesUpdateAction({
                            nearbyDevices: nearbyDevices.map(toBluetoothDevice),
                        }),
                    );
                }),
                bluetoothManager.onDeviceConnectionStatusChange(event => {
                    dispatch(
                        bluetoothActions.updateDeviceConnectionStatus({
                            ...event,
                            deviceId: asBluetoothDeviceId(event.deviceId),
                        }),
                    );
                    if (['paired', 'connected'].includes(event.connectionStatus.type)) {
                        analytics.report({
                            type: events.deviceConnectionDevicePairedEvent.name,
                        });
                    } else if (event.connectionStatus.type === 'pairing-canceled') {
                        showToast({
                            message: translate('bluetooth.toasts.pairingCanceled'),
                            intent: 'neutral',
                        });
                    } else if (event.connectionStatus.type === 'pairing-error') {
                        showPairingFailedAlert();
                    }
                }),
            ];

            return () => {
                subscriptions.forEach(subscription => subscription.remove());
            };
        }
    }, [
        bluetoothPermissionStatus,
        dispatch,
        analytics,
        showPairingFailedAlert,
        showToast,
        translate,
    ]);

    useEffect(() => {
        if (bluetoothAdapterStatus === 'enabled' && knownBluetoothDevices.length > 0) {
            return startDeviceScan();
        }
    }, [bluetoothAdapterStatus, knownBluetoothDevices, startDeviceScan]);

    useEffect(() => {
        knownConnectableBluetoothDevices.forEach(connectBluetoothDevice);
    }, [knownConnectableBluetoothDevices, connectBluetoothDevice]);
};
