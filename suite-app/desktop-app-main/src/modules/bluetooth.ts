import { exec } from 'child_process';

import { type InvokeResult } from '@suite/desktop-app-api';
import { isMacOs } from '@trezor/env-utils';
import { type IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { getFreePort } from '@trezor/node-utils';
import {
    BluetoothIpc,
    type BluetoothIpcApi,
    BluetoothTransport,
} from '@trezor/transport-bluetooth';
import { createLazy, throwError } from '@trezor/utils';

import type { ModuleInit } from './module';
import { looselyTypedIpcMain } from '../ipcMain';
import { BluetoothProcess } from '../libs/processes/BluetoothProcess';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

const EARLY_START_RETRIES = 1;

// Export module state and use it trezor-connect module to override init + updateConnectSettings params
// getTransport function is reassigned in onLoad, onQuit
type BluetoothModuleState = {
    getTransport: () => BluetoothTransport | undefined;
    // Resolves once a helper start that is still in progress has settled, with the transport if it is up.
    getTransportWhenStarted: () => Promise<BluetoothTransport | undefined>;
};

export const bluetoothModuleState: BluetoothModuleState = {
    getTransport: () => undefined,
    getTransportWhenStarted: () => Promise.resolve(undefined),
};

export const init: ModuleInit = ({ logger }) => {
    // BluetoothTransport's Logger types args as unknown[]; Suite's global logger
    // expects string[]. In practice BluetoothTransport only ever passes strings.
    const desktopLogger: ConstructorParameters<typeof BluetoothTransport>[0]['logger'] = {
        info: (...args) => logger.info(SERVICE_NAME, args as string[]),
        debug: (...args) => logger.debug(SERVICE_NAME, args as string[]),
        log: (...args) => logger.debug(SERVICE_NAME, args as string[]),
        warn: (...args) => logger.warn(SERVICE_NAME, args as string[]),
        error: (...args) => logger.error(SERVICE_NAME, args as string[]),
    };

    const createHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

    const lazyBluetooth = createLazy(
        async () => {
            const [port] = await getFreePort();
            const process = new BluetoothProcess({ port, logger });
            await process.start();

            const client = new BluetoothIpc({
                url: process.getUrl(),
                logger: desktopLogger,
                headers: createHeaders(process.getToken()),
            });

            return { process, client };
        },
        ({ process }) => process.stop(),
        err => logger.error(SERVICE_NAME, `Failed to stop process: ${err}`),
    );

    let earlyStartError: unknown;
    let isQuitting = false;

    /**
     * The helper takes a few hundred milliseconds to come up, so it starts here,
     * in parallel with the window and the renderer boot, instead of once the renderer asks for it.
     * A failed start is retried once. If the retry fails too,
     * the renderer's init request starts the helper again and reports the failure to the user.
     */
    const startEarly = (retriesLeft: number) => {
        lazyBluetooth.getOrInit().catch(error => {
            // Quitting rejects a start that is still in progress, which is not a failure.
            if (isQuitting) return;

            earlyStartError = error;
            logger.warn(SERVICE_NAME, `Early helper start failed: ${error}`);

            /**
             * This handler is the first to learn about the failure,
             * so the retry is already pending when anyone else waiting for the start resumes.
             */
            if (retriesLeft > 0) startEarly(retriesLeft - 1);
        });
    };
    startEarly(EARLY_START_RETRIES);

    const getClient = () =>
        (lazyBluetooth.get() ?? throwError('BluetoothIpc api not initialized')).client;

    const getBluetoothTransport = () => {
        const api = lazyBluetooth.get();

        return api
            ? new BluetoothTransport({
                  id: 'BluetoothTransport',
                  url: api.process.getUrl(),
                  logger: desktopLogger,
                  headers: createHeaders(api.process.getToken()),
                  // writeWithResponse: isMacOs(),
                  // writeWithDelay: isWindows(),
              })
            : undefined;
    };

    /**
     * Settles once no helper start is in progress.
     * A settled start may be followed by another one, like the retry of a failed early start,
     * so the wait repeats until nothing is pending.
     */
    const waitForPendingStart = async () => {
        let pending = lazyBluetooth.getPending();
        while (pending) {
            await pending.catch(() => undefined);
            pending = lazyBluetooth.getPending();
        }
    };

    const getBluetoothTransportWhenStarted = async () => {
        // A start the renderer did not wait for may still be in progress.
        await waitForPendingStart();

        return getBluetoothTransport();
    };

    const describeHelperState = () => {
        const api = lazyBluetooth.get();
        if (api) return `Helper running at ${api.process.getUrl()}`;
        if (lazyBluetooth.getPending()) return 'Helper start in progress';

        return earlyStartError === undefined
            ? 'Helper not running'
            : `Helper not running, early start failed: ${earlyStartError}`;
    };

    const proxyOptions: IpcProxyHandlerOptions<BluetoothIpcApi> = {
        onCreateInstance() {
            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `call ${method}`);
                    /**
                     * The app renders without waiting for the init request,
                     * so any request may arrive while the helper is still starting.
                     * That start settles first, and init starts the helper again if it failed.
                     */
                    await waitForPendingStart();
                    if (method === 'init') {
                        await lazyBluetooth.getOrInit();
                    }

                    const client = getClient();

                    if (method === 'dispose') {
                        lazyBluetooth.dispose();
                    }

                    // Workaround for MacOS pairing flow:
                    // Unfortunately the "searchpartyuseragent" process interferes with the pairing PIN dialog and causes it to not show up.
                    // This is related to Apple's Find My feature and happens to users with Bluetooth devices such as AirPods paired to their Mac.
                    // We previously tried using NAPI to execute pairing inside the foreground Electron app process to handle MacOS security restrictions,
                    // but it still did not work in 100% of cases. So now we simply kill the process before attempting to connect to a device.
                    // The process will be automatically restarted by MacOS if needed and doesn't seem to cause any issues with Find My functionality.
                    if (method === 'connectDevice' && isMacOs()) {
                        try {
                            const devices = await client.enumerateDevices();
                            const isPaired = devices.find(d => d.id === params[0])?.paired;
                            if (!isPaired) {
                                await new Promise<InvokeResult>(resolve => {
                                    exec('pkill searchpartyuseragent', {}, error => {
                                        if (error) {
                                            resolve({ success: false, error: error.toString() });
                                        } else {
                                            resolve({ success: true });
                                        }
                                    });
                                });
                            }
                        } catch (error) {
                            logger.warn(SERVICE_NAME, `macos pairing workaround failed: ${error}`);
                        }
                    }

                    return (client[method] as any)(...params);
                },
                onRequestError: (method, error) => {
                    logger.error(SERVICE_NAME, `onRequestError: ${method}: ${error}`);

                    return {
                        success: false,
                        error: { message: String(error), code: 'unknown' },
                    };
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `add listener ${eventName}`);

                    return getClient().on(eventName, listener);
                },
                onRemoveListener: (eventName: any) => {
                    logger.debug(SERVICE_NAME, `remove listener ${eventName}`);

                    return getClient().removeAllListeners(eventName);
                },
            };
        },
    };

    const unregisterProxy = createIpcProxyHandler(looselyTypedIpcMain, 'Bluetooth', proxyOptions);
    const onLoad = () => {
        // Repeats the early start's outcome, which is logged before file logging is turned on.
        logger.info(SERVICE_NAME, describeHelperState());
        bluetoothModuleState.getTransport = getBluetoothTransport;
        bluetoothModuleState.getTransportWhenStarted = getBluetoothTransportWhenStarted;
    };

    const onQuit = async () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        isQuitting = true;
        unregisterProxy();
        await lazyBluetooth.dispose();
        bluetoothModuleState.getTransport = () => undefined;
        bluetoothModuleState.getTransportWhenStarted = () => Promise.resolve(undefined);
    };

    return { onLoad, onQuit };
};
