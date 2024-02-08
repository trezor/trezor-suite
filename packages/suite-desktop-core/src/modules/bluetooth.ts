/**
 * Uses @trezor/transport-bluetooth package in nodejs context
 */
import { exec } from 'child_process';

import { getFreePort } from '@trezor/node-utils';
import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import { isMacOs, isLinux, isWindows } from '@trezor/env-utils';
import { BluetoothIpcApi, BluetoothApiImpl as BluetoothApi } from '@trezor/transport-bluetooth';

import { BluetoothProcess } from '../libs/processes/BluetoothProcess';
import { ipcMain } from '../typed-electron';

import type { ModuleInit } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.handle('bluetooth/open-settings', () => {
        // TODO: catch exec errors, maybe move somewhere can be used to open camera settings
        if (isMacOs()) {
            exec('open "x-apple.systempreferences:com.apple.Bluetooth"', error => {
                if (error) {
                    console.error(`Error opening Bluetooth settings: ${error}`);

                    return { success: false, error: 'Unsupported os' };
                }
            });

            return { success: true };
        }

        if (isLinux()) {
            exec(
                'gnome-control-center bluetooth',
                { env: { ...process.env, DISPLAY: ':0', XDG_CURRENT_DESKTOP: 'GNOME' } },
                error => {
                    if (error) {
                        console.error(`Error opening Bluetooth settings: ${error}`);

                        return { success: false, error: 'Unsupported os' };
                    }
                },
            );

            return { success: true };
        }

        if (isWindows()) {
            exec('start ms-settings:bluetooth', error => {
                if (error) {
                    console.error(`Error opening Bluetooth settings: ${error}`);

                    return { success: false, error: 'Unsupported os' };
                }
            });

            return { success: true };
        }

        return { success: false, error: 'Unsupported os' };
    });

    const clientProxyOptions: IpcProxyHandlerOptions<BluetoothIpcApi> = {
        onCreateInstance() {
            const api = new BluetoothApi({}); // logger

            return {
                onRequest: (method, params) => {
                    logger.debug(SERVICE_NAME, `call ${method}`);

                    return (api[method] as any)(...params);
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `add listener ${eventName}`);

                    return api.on(eventName, listener);
                },
                onRemoveListener: (eventName: any) => {
                    logger.debug(SERVICE_NAME, `remove listener ${eventName}`);

                    // return Promise.resolve();
                    return api.removeAllListeners(eventName);
                },
            };
        },
    };

    const unregisterProxy = createIpcProxyHandler(ipcMain as any, 'Bluetooth', clientProxyOptions);

    let bluetoothProcess: BluetoothProcess | undefined;

    const getBluetoothProcess = async () => {
        if (!bluetoothProcess) {
            const port = await getFreePort();
            bluetoothProcess = new BluetoothProcess(port);
        }

        return bluetoothProcess;
    };

    const killBluetoothProcess = () => {
        if (bluetoothProcess) {
            bluetoothProcess.stop();
            bluetoothProcess = undefined;
        }
    };

    const onLoad = async () => {
        const btProcess = await getBluetoothProcess();
        await btProcess.start();
    };

    const onQuit = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        killBluetoothProcess();
        unregisterProxy();
    };

    return { onLoad, onQuit };
};
