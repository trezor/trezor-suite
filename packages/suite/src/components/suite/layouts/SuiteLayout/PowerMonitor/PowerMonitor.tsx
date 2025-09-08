import { useEffect } from 'react';

import { selectKnownDevices } from '@suite-common/bluetooth';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bluetoothDisconnectDeviceThunk } from 'src/actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const PowerMonitorManager = () => {
    const dispatch = useDispatch();
    const knownDevices = useSelector(selectKnownDevices);
    const isDesktopApiAvailable = desktopApi?.available === true;

    useEffect(() => {
        if (!isDesktopApiAvailable) return;

        const disconnectAllDevices = () => {
            knownDevices.forEach(device => {
                if (device.connected) dispatch(bluetoothDisconnectDeviceThunk({ id: device.id }));
            });
        };
        desktopApi.on('power-monitor/screen-locked', disconnectAllDevices);

        return () => {
            desktopApi.removeAllListeners('power-monitor/screen-locked');
        };
    }, [dispatch, knownDevices, isDesktopApiAvailable]);

    return null;
};
