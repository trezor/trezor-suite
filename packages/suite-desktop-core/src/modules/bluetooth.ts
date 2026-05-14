import { exec } from 'child_process';
import { ipcMain } from 'electron';

import { isMacOs } from '@trezor/env-utils';
import { type IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { getFreePort } from '@trezor/node-utils';
import { type InvokeResult } from '@trezor/suite-desktop-api';
import {
    BluetoothIpc,
    type BluetoothIpcApi,
    BluetoothTransport,
} from '@trezor/transport-bluetooth';
import { createLazy, throwError } from '@trezor/utils';

import type { ModuleInit } from './module';
import { BluetoothProcess } from '../libs/processes/BluetoothProcess';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

// Export module state and use it trezor-connect module to override init + updateConnectSettings params
// getTransport function is reassigned in onLoad, onQuit
type BluetoothModuleState = {
    getTransport: () => BluetoothTransport | undefined;
};

export const bluetoothModuleState: BluetoothModuleState = {
    getTransport: () => undefined,
};

export const init: ModuleInit = () => {
    const { logger } = global;

    const desktopLogger: ConstructorParameters<typeof BluetoothTransport>[0]['logger'] = {
        info: (...args) => logger.info(SERVICE_NAME, args),
        debug: (...args) => logger.debug(SERVICE_NAME, args),
        log: (...args) => logger.debug(SERVICE_NAME, args),
        warn: (...args) => logger.warn(SERVICE_NAME, args),
        error: (...args) => logger.error(SERVICE_NAME, args),
    };

    const lazyBluetooth = createLazy(
        async () => {
            const [port] = await getFreePort();
            const process = new BluetoothProcess(port);
            await process.start();

            const client = new BluetoothIpc({
                url: process.getUrl(),
                logger: desktopLogger,
            });

            return { process, client };
        },
        ({ process }) => {
            process.stop();
        },
    );

    const getClient = () =>
        (lazyBluetooth.get() ?? throwError('BluetoothIpc api not initialized')).client;

    const getBluetoothTransport = () => {
        const api = lazyBluetooth.get();

        return api
            ? new BluetoothTransport({
                  id: 'BluetoothTransport',
                  url: api.process.getUrl(),
                  logger: desktopLogger,
                  // writeWithResponse: isMacOs(),
                  // writeWithDelay: isWindows(),
              })
            : undefined;
    };

    const proxyOptions: IpcProxyHandlerOptions<BluetoothIpcApi> = {
        onCreateInstance() {
            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `call ${method}`);
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

    const unregisterProxy = createIpcProxyHandler(ipcMain, 'Bluetooth', proxyOptions);
    const onLoad = () => {
        bluetoothModuleState.getTransport = getBluetoothTransport;
    };

    const onQuit = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        unregisterProxy();
        lazyBluetooth.dispose();
        bluetoothModuleState.getTransport = () => undefined;
    };

    return { onLoad, onQuit };
};
