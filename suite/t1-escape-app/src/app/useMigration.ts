import { useEffect, useState, useSyncExternalStore } from 'react';

import { getRandomInt } from '@trezor/utils';

import { type MigrationController, createMigrationController } from './createMigrationController';
import { hasUnsettledTransfers } from './migrationState';
import { createBlockbookBackend } from '../backend/createBlockbookBackend';
import { createBridgeConnection } from '../device/createBridgeConnection';
import { queryLocalNetworkAccess } from '../preflight/localNetworkAccess';

/** How often the network is asked about the signed and the pending transfers. */
const TRANSFER_REFRESH_INTERVAL_MS = 30_000;

const createController = (): MigrationController =>
    createMigrationController({
        bridge: createBridgeConnection(),
        backend: createBlockbookBackend(),
        getEnvironmentInfo: () => ({
            userAgent: navigator.userAgent,
            maxTouchPoints: navigator.maxTouchPoints,
        }),
        queryLocalNetworkAccess,
        getRandomInt,
    });

export const useMigration = () => {
    // The controller holds the device session and must be created exactly once per page.
    const [controller] = useState(createController);
    const state = useSyncExternalStore(controller.subscribe, controller.getState);

    const hasTransfersToTrack = hasUnsettledTransfers(state);

    useEffect(() => {
        if (!hasTransfersToTrack) return;

        const interval = setInterval(() => {
            void controller.refreshTransfers();
        }, TRANSFER_REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [controller, hasTransfersToTrack]);

    useEffect(() => {
        window.addEventListener('pagehide', controller.releaseOnUnload);

        return () => window.removeEventListener('pagehide', controller.releaseOnUnload);
    }, [controller]);

    return { state, controller };
};
