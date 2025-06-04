import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { bluetoothActions, parseManufacturerData } from '@suite-common/bluetooth';
import { useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import {
    BluetoothDevice as TransportBluetoothDevice,
    bluetoothManager,
} from '@trezor/transport-native-bluetooth';

import { isBluetoothEnabled } from '../featureFlag';
import {
    selectBluetoothAdapterStatus,
    selectBluetoothPermissionStatus,
    selectKnownBluetoothDevices,
    selectKnownConnectableBluetoothDevices,
} from '../selectors';
import { useBluetoothDevice } from './useBluetoothDevice';
import { useBluetoothPermissions } from './useBluetoothPermissions';

const toBluetoothDevice = (device: TransportBluetoothDevice) => ({
    ...device,
    manufacturerData: parseManufacturerData(device.manufacturerData),
});

export const useBluetoothAdapter = () => {
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const { translate } = useTranslate();

    const { checkBluetoothPermission } = useBluetoothPermissions();
    const { connectBluetoothDevice } = useBluetoothDevice();

    const bluetoothPermissionStatus = useSelector(selectBluetoothPermissionStatus);
    const bluetoothAdapterStatus = useSelector(selectBluetoothAdapterStatus);
    const knownBluetoothDevices = useSelector(selectKnownBluetoothDevices);
    const knownConnectableBluetoothDevices = useSelector(selectKnownConnectableBluetoothDevices);

    useEffect(() => {
        if (!isBluetoothEnabled) {
            return;
        }

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
                    dispatch(bluetoothActions.updateDeviceConnectionStatus(event));
                    if (event.connectionStatus.type === 'pairing-error') {
                        showToast({
                            message: translate('bluetooth.toasts.pairingCanceled'),
                            variant: 'default',
                        });
                    }
                }),
            ];

            return () => {
                subscriptions.forEach(subscription => subscription.remove());
            };
        }
    }, [bluetoothPermissionStatus, dispatch, showToast, translate]);

    useEffect(() => {
        if (bluetoothAdapterStatus === 'enabled' && knownBluetoothDevices.length > 0) {
            bluetoothManager.startDeviceScan();

            const subscription = AppState.addEventListener('change', nextAppState => {
                if (nextAppState === 'active') {
                    bluetoothManager.startDeviceScan();
                } else {
                    bluetoothManager.stopDeviceScan();
                }
            });

            return () => {
                subscription.remove();
                bluetoothManager.stopDeviceScan();
            };
        }
    }, [bluetoothAdapterStatus, knownBluetoothDevices]);

    useEffect(() => {
        knownConnectableBluetoothDevices.forEach(connectBluetoothDevice);
    }, [knownConnectableBluetoothDevices, connectBluetoothDevice]);
};
