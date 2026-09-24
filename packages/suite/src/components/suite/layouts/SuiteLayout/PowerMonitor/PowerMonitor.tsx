import { useEffect } from 'react';

import {
    type DesktopBluetoothDevice,
    bluetoothAdapterEventThunk,
    bluetoothDisconnectDeviceThunk,
    isBluetoothDeviceReachable,
} from '@suite/bluetooth';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { selectKnownDevices } from '@suite-common/bluetooth';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { isMacOs } from '@trezor/env-utils';

import { useSelector } from 'src/hooks/suite';

export const PowerMonitorManager = () => {
    const { desktopApi, dispatch } = useServices(injectDispatch, injectDesktopApi);
    const knownDevices = useSelector(selectKnownDevices<DesktopBluetoothDevice>);
    const isDesktopApiAvailable = desktopApi?.available === true;

    useEffect(() => {
        if (!isDesktopApiAvailable) return;

        // This is only useful for macOS
        if (!isMacOs()) return;

        const disconnectAllDevices = () => {
            dispatch(bluetoothAdapterEventThunk({ status: 'power-suspending' }));
            knownDevices.forEach(device => {
                if (isBluetoothDeviceReachable(device))
                    dispatch(bluetoothDisconnectDeviceThunk({ id: device.id }));
            });
        };
        desktopApi.on('power-monitor/suspend', disconnectAllDevices);

        return () => {
            desktopApi.removeAllListeners('power-monitor/suspend');
        };
    }, [desktopApi, dispatch, knownDevices, isDesktopApiAvailable]);

    return null;
};
