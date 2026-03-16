import { useEffect, useState } from 'react';

import { isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { type BridgeSettings } from '@trezor/suite-desktop-api/src/messages';

interface Process {
    service: boolean;
    process: boolean;
}

export const useBridgeDesktopApi = () => {
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
    }, []);

    const changeBridgeSettings = (settings: BridgeSettings) => {
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
