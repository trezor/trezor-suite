import { ipcMain } from 'electron';

import TrezorConnect from '@trezor/connect';
import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import { BluetoothTransport } from '@trezor/transport-bluetooth';

import type { Module } from './index';

export const SERVICE_NAME = '@trezor/connect';

export const init: Module = ({ store }) => {
    const { logger } = global;
    logger.info(SERVICE_NAME, `Starting service`);

    const setProxy = (ifRunning = false) => {
        const tor = store.getTorSettings();
        if (ifRunning && !tor.running) return Promise.resolve();
        const payload = tor.running ? { proxy: `socks://${tor.host}:${tor.port}` } : { proxy: '' };
        logger.info(SERVICE_NAME, `${tor.running ? 'Enable' : 'Disable'} proxy ${payload.proxy}`);

        return TrezorConnect.setProxy(payload);
    };

    const ipcProxyOptions: IpcProxyHandlerOptions<typeof TrezorConnect> = {
        onCreateInstance: () => ({
            onRequest: async (method, params) => {
                logger.debug(SERVICE_NAME, `call ${method}`);
                if (method === 'init') {
                    // if (params.transports?.includes('Web'))
                    const BTT = new BluetoothTransport({});
                    // @ts-expect-erro TODO?
                    params[0].transports = [BTT];

                    const response = await TrezorConnect[method](...params);
                    await setProxy(true);

                    return response;
                }

                return (TrezorConnect[method] as any)(...params);
            },
            onAddListener: (eventName, listener) => {
                logger.debug(SERVICE_NAME, `Add event listener ${eventName}`);

                return TrezorConnect.on(eventName, listener);
            },
            onRemoveListener: eventName => {
                logger.debug(SERVICE_NAME, `Remove event listener ${eventName}`);

                return TrezorConnect.removeAllListeners(eventName);
            },
        }),
    };

    const unregisterProxy = createIpcProxyHandler(ipcMain, 'TrezorConnect', ipcProxyOptions);

    const onLoad = () => {
        // reset previous instance, possible left over after renderer refresh (F5)
        TrezorConnect.dispose();
    };

    const onQuit = () => {
        unregisterProxy();
        TrezorConnect.dispose();
    };

    return { onLoad, onQuit };
};
