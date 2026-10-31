import { useEffect } from 'react';

import { injectBluetooth } from '@suite/bluetooth';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@trezor/dependency-injection';
import { isMacOs } from '@trezor/env-utils';

export const PowerMonitorManager = () => {
    const { bluetooth, desktopApi } = useServices(injectDesktopApi, injectBluetooth);
    const isDesktopApiAvailable = desktopApi?.available === true;

    useEffect(() => {
        if (!isDesktopApiAvailable) return;

        // This is only useful for macOS
        if (!isMacOs()) return;

        const onPowerSuspend = () => {
            bluetooth.onPowerSuspend();
        };
        desktopApi.on('power-monitor/suspend', onPowerSuspend);

        return () => {
            desktopApi.removeAllListeners('power-monitor/suspend');
        };
    }, [bluetooth, desktopApi, isDesktopApiAvailable]);

    return null;
};
