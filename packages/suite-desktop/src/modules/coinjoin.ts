/**
 * Uses @trezor/coinjoin package in nodejs context
 */

import { app, ipcMain } from 'electron';

import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import { CoinjoinBackend, CoinjoinClient } from '@trezor/coinjoin';

import type { Module } from './index';

const SERVICE_NAME = '@trezor/coinjoin';

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    const backends: CoinjoinBackend[] = [];
    const clients: CoinjoinClient[] = [];

    logger.debug(SERVICE_NAME, `Starting service`);

    const backendProxyOptions: IpcProxyHandlerOptions<CoinjoinBackend> = {
        onCreateInstance: (settings: ConstructorParameters<typeof CoinjoinBackend>[0]) => {
            const backend = new CoinjoinBackend(settings);
            backends.push(backend);
            return {
                onRequest: (method, params) => {
                    logger.debug(SERVICE_NAME, `CoinjoinBackend call ${method}`);
                    // needs type casting
                    return (backend[method] as any)(...params);
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `CoinjoinBackend add listener ${eventName}`);
                    return backend.on(eventName, listener);
                },
                onRemoveListener: eventName => {
                    logger.debug(SERVICE_NAME, `CoinjoinBackend remove listener ${eventName}`);
                    return backend.removeAllListeners(eventName);
                },
            };
        },
    };

    const clientProxyOptions: IpcProxyHandlerOptions<CoinjoinClient> = {
        onCreateInstance: (settings: ConstructorParameters<typeof CoinjoinClient>[0]) => {
            const client = new CoinjoinClient(settings);
            clients.push(client);
            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `CoinjoinClient call ${method}`);
                    if (method === 'enable') {
                        logger.debug(SERVICE_NAME, `CoinjoinClient enable ${params}`);
                        const response = await client.enable();
                        // TODO: start coinjoin middleware binary
                        return response;
                    }
                    // needs type casting
                    return (client[method] as any)(...params); // bind method to instance context
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `CoinjoinClient add listener ${eventName}`);
                    return client.on(eventName, listener);
                },
                onRemoveListener: eventName => {
                    logger.debug(SERVICE_NAME, `CoinjoinClient remove listener ${eventName}`);
                    return client.removeAllListeners(eventName);
                },
            };
        },
    };

    return () => {
        const unregisterBackendProxy = createIpcProxyHandler(
            ipcMain,
            'CoinjoinBackend',
            backendProxyOptions,
        );

        const unregisterClientProxy = createIpcProxyHandler(
            ipcMain,
            'CoinjoinClient',
            clientProxyOptions,
        );

        const dispose = () => {
            backends.forEach(b => b.cancel());
            backends.splice(0, backends.length);

            clients.forEach(c => c.disable());
            clients.splice(0, clients.length);

            unregisterBackendProxy();
            unregisterClientProxy();
        };

        app.on('before-quit', dispose);
        mainWindow.webContents.on('did-start-loading', () => {
            dispose();
        });
        ipcMain.on('app/restart', () => {
            dispose();
        });
    };
};
