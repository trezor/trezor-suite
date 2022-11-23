/**
 * Uses @trezor/coinjoin package in nodejs context
 */

import { app, ipcMain } from 'electron';

import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import { CoinjoinBackend, CoinjoinClient } from '@trezor/coinjoin';

import { CoinjoinProcess } from '../libs/processes/CoinjoinProcess';
import { PowerSaveBlocker } from '../libs/power-save-blocker';

import type { Module } from './index';

const SERVICE_NAME = '@trezor/coinjoin';

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    const backends: CoinjoinBackend[] = [];
    const clients: CoinjoinClient[] = [];

    const coinjoinMiddleware = new CoinjoinProcess();

    const powerSaveBlocker = new PowerSaveBlocker();

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
                    // TODO: remove/redact before public release. eventName contains xpub
                    logger.debug(SERVICE_NAME, `CoinjoinBackend add listener ${eventName}`);
                    return backend.on(eventName, listener);
                },
                onRemoveListener: eventName => {
                    // TODO: remove/redact before public release. eventName contains xpub
                    logger.debug(SERVICE_NAME, `CoinjoinBackend remove listener ${eventName}`);
                    return backend.removeAllListeners(eventName);
                },
            };
        },
    };

    const clientProxyOptions: IpcProxyHandlerOptions<CoinjoinClient> = {
        onCreateInstance: async (settings: ConstructorParameters<typeof CoinjoinClient>[0]) => {
            const port = await coinjoinMiddleware.getPort();
            // override default url in coinjoin settings
            settings.middlewareUrl = coinjoinMiddleware.getUrl();
            const client = new CoinjoinClient(settings);
            client.on('log', message => logger.debug(SERVICE_NAME, message));
            clients.push(client);
            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `CoinjoinClient call ${method}`);
                    if (method === 'enable') {
                        logger.debug(SERVICE_NAME, `CoinjoinClient binary enable on port ${port}`);
                        try {
                            await coinjoinMiddleware.start();
                        } catch (err) {
                            logger.error(SERVICE_NAME, `Start failed: ${err.message}`);
                            throw err; // pass this error to suite toast
                        }
                    }
                    if (method === 'disable') {
                        logger.debug(SERVICE_NAME, `CoinjoinClient binary stop`);
                        coinjoinMiddleware.stop();
                        powerSaveBlocker.stopBlockingPowerSave();
                    }
                    if (method === 'registerAccount') {
                        powerSaveBlocker.startBlockingPowerSave();
                    }
                    if (method === 'unregisterAccount') {
                        powerSaveBlocker.stopBlockingPowerSave();
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
            logger.info(SERVICE_NAME, 'Stopping (app quit)');
            coinjoinMiddleware.stop();
            powerSaveBlocker.stopBlockingPowerSave();
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
