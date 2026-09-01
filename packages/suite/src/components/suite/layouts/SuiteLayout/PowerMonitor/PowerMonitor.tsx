import { useEffect } from 'react';

import { bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { useDispatch } from '@suite-common/redux-utils';
import { isMacOs } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { type DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothDisconnectDeviceThunk } from 'src/actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { isBluetoothDeviceReachable } from 'src/actions/bluetooth/isBluetoothDeviceReachable';
import { useSelector } from 'src/hooks/suite';

export const PowerMonitorManager = () => {
    const dispatch = useDispatch();
    const knownDevices = useSelector(selectKnownDevices<DesktopBluetoothDevice>);
    const isDesktopApiAvailable = desktopApi?.available === true;

    useEffect(() => {
        if (!isDesktopApiAvailable) return;

        // This is only useful for macOS
        if (!isMacOs()) return;

        const disconnectAllDevices = () => {
            dispatch(bluetoothActions.adapterEventAction({ status: 'power-suspending' }));
            knownDevices.forEach(device => {
                if (isBluetoothDeviceReachable(device))
                    dispatch(bluetoothDisconnectDeviceThunk({ id: device.id }));
            });
        };
        desktopApi.on('power-monitor/suspend', disconnectAllDevices);

        return () => {
            desktopApi.removeAllListeners('power-monitor/suspend');
        };
    }, [dispatch, knownDevices, isDesktopApiAvailable]);

    return null;
};
