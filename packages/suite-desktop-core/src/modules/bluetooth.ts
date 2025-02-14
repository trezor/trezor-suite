import { ipcMain } from 'electron';

import { IpcProxyHandlerOptions, createIpcProxyHandler } from '@trezor/ipc-proxy';
import { BluetoothIpc, BluetoothIpcApi } from '@trezor/transport-bluetooth';

import type { ModuleInit } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

export const init: ModuleInit = () => {
    const { logger } = global;

    const proxyOptions: IpcProxyHandlerOptions<BluetoothIpcApi> = {
        onCreateInstance() {
            const api = new BluetoothIpc();

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

                    return api.removeAllListeners(eventName);
                },
            };
        },
    };

    const unregisterProxy = createIpcProxyHandler(ipcMain, 'Bluetooth', proxyOptions);
    const onLoad = () => {
        // TODO: start binary
    };

    const onQuit = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        unregisterProxy();
    };

    return { onLoad, onQuit };
};
