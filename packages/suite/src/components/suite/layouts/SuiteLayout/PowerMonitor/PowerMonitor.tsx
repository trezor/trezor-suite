import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { useSelector } from '@suite-common/redux-utils';
import { isMacOs } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bluetoothDisconnectDeviceThunk } from 'src/actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { isBluetoothDeviceReachable } from 'src/actions/bluetooth/isBluetoothDeviceReachable';
export const PowerMonitorManager = () => {
    const dispatch = useDispatch();
    const knownDevices = useSelector(selectKnownDevices);
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
