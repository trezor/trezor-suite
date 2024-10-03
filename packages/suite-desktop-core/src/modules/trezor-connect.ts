import { ipcMain } from 'electron';
import { WebSocketServer } from 'ws';

import TrezorConnect from '@trezor/connect';
import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';

import type { Module } from './index';

export const SERVICE_NAME = '@trezor/connect';

export const init: Module = ({ store, mainThreadEmitter }) => {
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
                    console.log('aprams, params', params);
                    const response = await TrezorConnect[method](...params);
                    await setProxy(true);

                    const wss = new WebSocketServer({
                        port: 8090,
                        perMessageDeflate: {
                            zlibDeflateOptions: {
                                // See zlib defaults.
                                chunkSize: 1024,
                                memLevel: 7,
                                level: 3,
                            },
                            zlibInflateOptions: {
                                chunkSize: 10 * 1024,
                            },
                            // Other options settable:
                            clientNoContextTakeover: true, // Defaults to negotiated value.
                            serverNoContextTakeover: true, // Defaults to negotiated value.
                            serverMaxWindowBits: 10, // Defaults to negotiated value.
                            // Below options specified as default values.
                            concurrencyLimit: 10, // Limits zlib concurrency for perf.
                            threshold: 1024, // Size (in bytes) below which messages
                            // should not be compressed if context takeover is disabled.
                        },
                    });

                    wss.on('connection', function connection(ws) {
                        ws.on('error', console.error);

                        ws.on('message', async function message(data) {
                            try {
                                const parsed = JSON.parse(data.toString());
                                const { method, ...rest } = parsed.payload;
                                console.log('method', method);
                                console.log('rest', rest);
                                // focus renderer window
                                mainThreadEmitter.emit('focus-window');
                                // @ts-expect-error
                                const response = await TrezorConnect[method](rest);
                                console.log('response', response);
                                ws.send(JSON.stringify(response));
                            } catch (err) {
                                console.log('=== err', err);
                            } finally {
                                // blur renderer window
                                mainThreadEmitter.emit('blur-window');
                            }
                        });

                        ws.send('ack');
                    });

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
