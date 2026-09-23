import { selectAdapterStatus, selectKnownDevices } from '@suite-common/bluetooth';
import { bluetoothIpc } from '@trezor/transport-bluetooth';
import { resolveAfter } from '@trezor/utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { isBluetoothDeviceReachable } from './isBluetoothDeviceReachable';

const BACKGROUND_SCAN_INTERVAL = 6_000;
const BACKGROUND_SCAN_DURATION = 2_000;

export type BackgroundScanDeps = {
    getState: () => WithBluetoothRootState;
};

export type BackgroundScan = {
    start: () => void;
    stop: () => void;
    restartIfNeeded: () => void;
};

export type BackgroundScanDep = {
    backgroundScan: BackgroundScan;
};

// TODO: add logger to deps
const logger = {
    warn: (message: string) => console.warn(`[Bluetooth BackgroundScan] ${message}`),
};

/**
 * Bluetooth internal dependency.
 */
export const createBackgroundScan = (deps: BackgroundScanDeps): BackgroundScan => {
    const { getState } = deps;

    let abortController: AbortController | undefined;
    let currentRun: Promise<void> | undefined;

    const isWindowVisible = () => document.visibilityState === 'visible';

    const hasDisconnectedKnownDevice = () =>
        selectKnownDevices<DesktopBluetoothDevice>(getState()).some(
            device => !isBluetoothDeviceReachable(device),
        );

    const shouldScan = () =>
        selectAdapterStatus(getState()) === 'enabled' && hasDisconnectedKnownDevice();

    const run = async (signal: AbortSignal) => {
        while (!signal.aborted && shouldScan()) {
            const startedAt = Date.now();

            if (isWindowVisible()) {
                try {
                    const result = await bluetoothIpc.startScan('background');
                    if (!result.success) {
                        logger.warn('start_scan failed');
                    }

                    await resolveAfter(BACKGROUND_SCAN_DURATION, signal);
                } catch (error) {
                    if (signal.aborted && error === signal.reason) {
                        throw error;
                    }

                    logger.warn('scanning failed');
                } finally {
                    await bluetoothIpc
                        .stopScan('background')
                        .then(result => {
                            if (!result.success) {
                                logger.warn('stop_scan failed');
                            }
                        })
                        .catch(() => {
                            logger.warn('stop_scan failed');
                        });
                }
            }

            const elapsedTime = Date.now() - startedAt;
            const remainingDelay = Math.max(0, BACKGROUND_SCAN_INTERVAL - elapsedTime);
            await resolveAfter(remainingDelay, signal);
        }
    };

    const stop = () => abortController?.abort();

    const start = () => {
        if (abortController && !abortController.signal.aborted) {
            return;
        }

        const nextController = new AbortController();
        abortController = nextController;

        const nextRun = currentRun
            ? currentRun.then(() => run(nextController.signal))
            : run(nextController.signal);

        currentRun = nextRun
            .catch(() => {
                if (!nextController.signal.aborted) {
                    logger.warn('scanning failed');
                }
            })
            .finally(() => {
                if (abortController === nextController) {
                    abortController = undefined;
                    currentRun = undefined;
                }
            });
    };

    const restartIfNeeded = () => {
        if (shouldScan()) {
            start();
        } else {
            stop();
        }
    };

    return { start, stop, restartIfNeeded };
};
