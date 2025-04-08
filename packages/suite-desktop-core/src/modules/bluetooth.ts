import { ipcMain } from 'electron';

import { IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { getFreePort } from '@trezor/node-utils';
import { BluetoothIpc, BluetoothIpcApi } from '@trezor/transport-bluetooth';

import { BluetoothProcess } from '../libs/processes/BluetoothProcess';

import type { ModuleInit } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

export const init: ModuleInit = () => {
    const { logger } = global;

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

    const initBluetoothIpc = async () => {
        const btProcess = await getBluetoothProcess();
        await btProcess.start();

        return new BluetoothIpc({
            // @ts-expect-error TODO BluetoothIpc params will be added in upcoming PR
            url: btProcess.getUrl(),
            logger,
        });
    };

    const proxyOptions: IpcProxyHandlerOptions<BluetoothIpcApi> = {
        onCreateInstance() {
            let api: BluetoothIpc | undefined;
            const apiError = new Error('BluetoothIpc api not initialized');

            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `call ${method}`);
                    if (method === 'init') {
                        api = await initBluetoothIpc();
                    }

                    if (!api) throw apiError;

                    if (method === 'dispose') {
                        killBluetoothProcess();
                    }

                    return (api[method] as any)(...params);
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `add listener ${eventName}`);
                    if (!api) throw apiError;

                    return api.on(eventName, listener);
                },
                onRemoveListener: (eventName: any) => {
                    logger.debug(SERVICE_NAME, `remove listener ${eventName}`);
                    if (!api) throw apiError;

                    return api.removeAllListeners(eventName);
                },
            };
        },
    };

    const unregisterProxy = createIpcProxyHandler(ipcMain, 'Bluetooth', proxyOptions);
    const onLoad = () => {
        // empty, binary starts after bluetoothIpc.init
    };

    const onQuit = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        unregisterProxy();
        killBluetoothProcess();
    };

    return { onLoad, onQuit };
};
