import { useEffect, useState } from 'react';

import {
    type DiskSpace,
    type MonerodDownloadEvent,
    type MonerodStatus,
    type MonerodStatusEvent,
    type MonerodSyncEvent,
    desktopApi,
} from '@trezor/suite-desktop-api';

// Footprint of a pruned Monero blockchain plus headroom for growth.
export const MONERO_REQUIRED_BYTES = 100 * 1024 ** 3;

const toPercent = (current: number, total: number) =>
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

export interface MonerodSyncState {
    status: MonerodStatus;
    // False until the first status arrives from the main process. Distinguishes "node is genuinely
    // off" from "we haven't heard back yet", so the view can show a loader instead of flashing the
    // disk-space / start-sync screen while the daemon is still opening its (large) database.
    statusKnown: boolean;
    statusMessage: string | null;
    percent: number | null;
    blocks: { height: number; target: number } | null;
    diskSpace: DiskSpace | null;
}

/**
 * Subscribes to the local Monero node's status/progress and queries free disk space. Used by the
 * Monero account pre-flight + sync view. Desktop-only (Monero is a desktop-only network).
 */
export const useMonerodSync = () => {
    const [state, setState] = useState<MonerodSyncState>({
        status: 'Disabled',
        statusKnown: false,
        statusMessage: null,
        percent: null,
        blocks: null,
        diskSpace: null,
    });

    useEffect(() => {
        desktopApi.on('monerod/status', (event: MonerodStatusEvent) => {
            setState(prev => ({
                ...prev,
                status: event.type,
                statusKnown: true,
                statusMessage: event.message ?? null,
                ...(event.type === 'Disabled' ? { percent: null, blocks: null } : {}),
            }));
        });
        desktopApi.on('monerod/download-progress', (event: MonerodDownloadEvent) => {
            setState(prev => ({
                ...prev,
                percent: toPercent(event.progress.current, event.progress.total),
            }));
        });
        desktopApi.on('monerod/sync-progress', (event: MonerodSyncEvent) => {
            setState(prev => ({
                ...prev,
                percent: toPercent(event.progress.current, event.progress.total),
                blocks: { height: event.height, target: event.targetHeight },
            }));
        });

        desktopApi.getMonerodStatus();
        desktopApi.getDiskSpace().then(result => {
            if (result.success) {
                setState(prev => ({ ...prev, diskSpace: result.payload }));
            }
        });

        return () => {
            desktopApi.removeAllListeners('monerod/status');
            desktopApi.removeAllListeners('monerod/download-progress');
            desktopApi.removeAllListeners('monerod/sync-progress');
        };
    }, []);

    const start = () => {
        desktopApi.toggleMonerod(true);
    };

    return { ...state, start };
};
