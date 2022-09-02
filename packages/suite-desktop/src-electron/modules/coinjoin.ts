/**
 * Adds a CSP (Content Security Policy) header to all requests
 */
import { app, ipcMain } from 'electron';
import { Module } from './index';
import { createIpcProxyHandler } from '@trezor/ipc-proxy';
import { CoinjoinBackend, CoinjoinClient } from '@trezor/coinjoin';

const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    const backends: CoinjoinBackend[] = [];
    const clients: CoinjoinClient[] = [];

    logger.debug('CJ', `Starting coinjoin module`);

    return () => {
        logger.debug('CJ', `Run up: ${ipcMain.eventNames().join(', ')}`);
        const unregisterBackendProxy = createIpcProxyHandler<CoinjoinBackend>(
            ipcMain,
            'CoinjoinBackend',
            {
                onCreateInstance: (settings: any) => {
                    backends.push(new CoinjoinBackend(settings));
                    return Promise.resolve();
                },
                onRequest: async (method, ...params) => {
                    // @ts-expect-error method name union
                    const response = await backends[0][method].call(backends[0], ...params);
                    return response;
                },
                onAddListener: (eventName, listener) => {
                    // logger.debug(SERVICE_NAME, `Add event listener ${eventName}`);
                    backends[0].on(eventName, listener);
                    return backends[0];
                },
                onRemoveListener: event => {
                    backends[0].removeAllListeners(event);
                },
                debug: console,
            },
        );

        const unregisterClientProxy = createIpcProxyHandler(ipcMain, 'CoinjoinClient', {
            onCreateInstance: (settings: any) => {
                clients.push(new CoinjoinClient(settings));
                return Promise.resolve();
            },
            onRequest: async (method, ...params) => {
                // @ts-expect-error method name union
                const response = await clients[0][method].call(null, ...params);
                return response;
            },
            onAddListener: (eventName, listener) => {
                clients[0].on(eventName, listener);
            },
            onRemoveListener: event => {
                clients[0].removeAllListeners(event);
            },
            debug: logger as any,
        });

        const dispose = () => {
            unregisterBackendProxy();
            unregisterClientProxy();
        };

        mainWindow.webContents.on('did-start-loading', () => {
            dispose();
        });

        // const { dispose } = initCoinjoinChannel({ ipcMain });
        // // start binary
        app.on('before-quit', dispose);
        ipcMain.on('app/restart', () => {
            logger.warn('CJ', 'App restart requested');
            dispose();
        });
        const loaded = true;
        return loaded;
    };
};

export default init;
