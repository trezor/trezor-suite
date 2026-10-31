import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type DesktopBluetoothDevice,
    bluetoothAdapterEventThunk,
    injectBluetooth,
    isBluetoothDeviceReachable,
} from '@suite/bluetooth';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { selectKnownDevices } from '@suite-common/bluetooth';
import { useServices } from '@trezor/dependency-injection';
import { isMacOs } from '@trezor/env-utils';
import { injectDispatch } from '@trezor/redux-utils';

export const PowerMonitorManager = () => {
    const { bluetooth, desktopApi, dispatch } = useServices(
        injectDispatch,
        injectDesktopApi,
        injectBluetooth,
    );
    const knownDevices = useSelector(selectKnownDevices<DesktopBluetoothDevice>);
    const isDesktopApiAvailable = desktopApi?.available === true;

    useEffect(() => {
        if (!isDesktopApiAvailable) return;

        // This is only useful for macOS
        if (!isMacOs()) return;

        const disconnectAllDevices = () => {
            dispatch(bluetoothAdapterEventThunk({ status: 'power-suspending' }));
            knownDevices.forEach(device => {
                if (isBluetoothDeviceReachable(device)) bluetooth.disconnectDevice(device.id);
            });
        };
        desktopApi.on('power-monitor/suspend', disconnectAllDevices);

        return () => {
            desktopApi.removeAllListeners('power-monitor/suspend');
        };
    }, [bluetooth, desktopApi, dispatch, knownDevices, isDesktopApiAvailable]);

    return null;
};
