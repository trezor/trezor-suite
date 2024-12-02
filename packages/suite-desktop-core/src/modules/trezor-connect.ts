import { ipcMain } from 'electron';

import TrezorConnect, { DEVICE_EVENT } from '@trezor/connect';
import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';

import { ModuleInit, ModuleInitBackground } from './index';

export const SERVICE_NAME = '@trezor/connect';

export const initBackground: ModuleInitBackground = ({ mainThreadEmitter, store }) => {
    const { logger } = global;
    logger.info(SERVICE_NAME, `Starting service`);

    const setProxy = () => {
        const { running, host, port } = store.getTorSettings();
        const payload = running ? { proxy: `socks://${host}:${port}` } : { proxy: '' };
        logger.info(SERVICE_NAME, `${running ? 'Enable' : 'Disable'} proxy ${payload.proxy}`);

        return TrezorConnect.setProxy(payload);
    };

    const ipcProxyOptions: IpcProxyHandlerOptions<typeof TrezorConnect> = {
        onCreateInstance: () => ({
            onRequest: async (method, params) => {
                logger.debug(SERVICE_NAME, `call ${method}`);
                if (method === 'init') {
                    const response = await TrezorConnect[method](...params);
                    await setProxy();

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
        TrezorConnect.on(DEVICE_EVENT, event => {
            mainThreadEmitter.emit('module/trezor-connect/device-event', event);
        });
    };

    const onQuit = () => {
        unregisterProxy();
        TrezorConnect.dispose();
    };

    return { onLoad, onQuit };
};

export const init: ModuleInit = () => {
    const onLoad = () => {
        // reset previous instance, possible left over after renderer refresh (F5)
        TrezorConnect.dispose();
    };

    return { onLoad };
};
