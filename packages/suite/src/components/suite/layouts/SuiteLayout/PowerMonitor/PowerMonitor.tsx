import { useEffect } from 'react';

import { selectKnownDevices } from '@suite-common/bluetooth';
import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { bluetoothDisconnectDeviceThunk } from 'src/actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const PowerMonitorManager = () => {
    const dispatch = useDispatch();
    const knownDevices = useSelector(selectKnownDevices);

    useEffect(() => {
        if (typeof window === 'undefined' || !isDesktop) {
            return;
        }

        const disconnectAllDevices = () => {
            knownDevices.forEach(device => {
                if (device.connected) dispatch(bluetoothDisconnectDeviceThunk({ id: device.id }));
            });
        };
        desktopApi.on('power-monitor/screen-locked', disconnectAllDevices);

        return () => {
            desktopApi.removeAllListeners('power-monitor/screen-locked');
        };
    }, [dispatch, knownDevices]);

    return null;
};
