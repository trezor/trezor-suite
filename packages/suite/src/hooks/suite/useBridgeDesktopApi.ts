import { useEffect, useState } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { isDesktop } from '@trezor/env-utils';
import { type BridgeSettings, selectDesktopApiDep } from '@trezor/suite-desktop-api';

interface Process {
    service: boolean;
    process: boolean;
}

export const useBridgeDesktopApi = () => {
    const { desktopApi } = useServices(selectDesktopApiDep);
    const [bridgeProcess, setBridgeProcess] = useState<Process>({ service: false, process: false });
    const [bridgeSettings, setBridgeSettings] = useState<BridgeSettings | null>(null);
    const [bridgeDesktopApiError, setBridgeDesktopApiError] = useState<string | null>(null);

    useEffect(() => {
        if (!isDesktop()) {
            return;
        }

        desktopApi.getBridgeStatus().then(result => {
            if (result.success) {
                setBridgeProcess(result.payload);
            }
        });

        desktopApi.on('bridge/status', (status: Process) => {
            setBridgeProcess(status);
        });

        desktopApi.getBridgeSettings().then(result => {
            if (result.success) {
                setBridgeSettings(result.payload);
            } else {
                setBridgeDesktopApiError(result.error);
            }
        });

        desktopApi.on('bridge/settings', (settings: BridgeSettings) => {
            setBridgeSettings(settings);
        });

        return () => {
            desktopApi.removeAllListeners('bridge/status');
            desktopApi.removeAllListeners('bridge/settings');
        };
    }, [desktopApi]);

    const changeBridgeSettings = (settings: Partial<BridgeSettings>) => {
        // main-process merges a partial into the current settings, so a single control can send
        // only its own field without clobbering the rest.
        desktopApi.changeBridgeSettings(settings);
    };

    const toggleBridge = () => {
        desktopApi.toggleBridge();
    };

    return {
        bridgeSettings,
        bridgeProcess,
        changeBridgeSettings,
        toggleBridge,
        bridgeDesktopApiError,
    };
};
