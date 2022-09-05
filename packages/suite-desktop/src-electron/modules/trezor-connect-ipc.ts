import { app, ipcMain } from 'electron';
import TrezorConnect from '@trezor/connect';
import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import type { Module } from './index';

const SERVICE_NAME = 'trezor-connect-ipc';

const init: Module = ({ store }) => {
    const { logger } = global;
    logger.info(SERVICE_NAME, `Starting service`);

    const setProxy = (ifRunning = false) => {
        const tor = store.getTorSettings();
        if (ifRunning && !tor.running) return Promise.resolve();
        const payload = tor.running
            ? {
                  proxy: `socks://${tor.address}`,
                  useOnionLinks: true,
              }
            : { proxy: '', useOnionLinks: false };
        logger.info(SERVICE_NAME, `${tor.running ? 'Enable' : 'Disable'} proxy ${payload.proxy}`);
        return TrezorConnect.setProxy(payload);
    };

    const ipcProxyOptions: IpcProxyHandlerOptions<typeof TrezorConnect> = {
        onCreateInstance: () => Promise.resolve(),
        onRequest: async (method, ...params) => {
            // @ts-expect-error method name union
            const response = await TrezorConnect[method].call(null, ...params);
            if (method === 'init') {
                await setProxy(true);
            }
            return response;
        },
        onAddListener: (eventName, listener) => {
            logger.debug(SERVICE_NAME, `Add event listener ${eventName}`);
            TrezorConnect.on(eventName, listener);
        },
        onRemoveListener: event => {
            TrezorConnect.removeAllListeners(event);
        },
        debug: console,
    };

    const unregister = createIpcProxyHandler(ipcMain, 'TrezorConnect', ipcProxyOptions);

    app.on('before-quit', () => {
        unregister();
        TrezorConnect.dispose();
    });

    // It would be much easier to use ipcRenderer.invoke and return a promise directly from TrezorConnect[method]
    // BUT unfortunately ipcRenderer.invoke and ipcRenderer.on event listener works asynchronously and results with race conditions (possible electron bug)
    // instead of cycle of messages: START > progress > progress > progress > RESULT the Renderer process receives: START > progress > progress > RESULT > progress
    // ipcMain.handle('trezor-connect-call', (_event: any, [method, ...params]: Call) => {
    //     logger.info(SERVICE_NAME, `Call ${method}`);
    //     // @ts-ignore method name union
    //     return TrezorConnect[method](...params);
    // });

    return () => {
        // reset previous instance, possible left over after renderer refresh (F5)
        TrezorConnect.dispose();
    };
};

export default init;
