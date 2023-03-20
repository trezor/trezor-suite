/**
 * Uses @trezor/coinjoin package in nodejs context
 */

import { app, ipcMain } from 'electron';
import { captureMessage, withScope } from '@sentry/electron';

import { coinjoinReportTag, coinjoinNetworktTag } from '@suite-common/sentry';
import { createIpcProxyHandler, IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import { CoinjoinBackend, CoinjoinClient } from '@trezor/coinjoin';

import { CoinjoinProcess } from '../libs/processes/CoinjoinProcess';
import { PowerSaveBlocker } from '../libs/power-save-blocker';

import type { Module } from './index';

const SERVICE_NAME = '@trezor/coinjoin';
const CLIENT_CHANNEL = 'CoinjoinClient';
const BACKEND_CHANNEL = 'CoinjoinBackend';

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
            backend.on('log', ({ level, payload }) => {
                logger[level](SERVICE_NAME, `${BACKEND_CHANNEL} ${payload}`);
            });
            backends.push(backend);
            return {
                onRequest: (method, params) => {
                    logger.debug(SERVICE_NAME, `${BACKEND_CHANNEL} call ${method}`);
                    // needs type casting
                    return (backend[method] as any)(...params);
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `${BACKEND_CHANNEL} add listener ${eventName}`);
                    return backend.on(eventName, listener);
                },
                onRemoveListener: (eventName: any) => {
                    logger.debug(SERVICE_NAME, `${BACKEND_CHANNEL} remove listener ${eventName}`);
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
            client.on('log', ({ level, payload }) => {
                if (level === 'error') {
                    withScope(scope => {
                        scope.clear(); // scope is also cleared in beforeSend sentry handler, this is just to be safe.
                        scope.setTag(coinjoinReportTag, true);
                        scope.setTag(coinjoinNetworktTag, settings.network);
                        captureMessage(payload, scope);
                    });
                }
                logger[level](SERVICE_NAME, `${CLIENT_CHANNEL} ${payload}`);
            });
            clients.push(client);
            return {
                onRequest: async (method, params) => {
                    logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} call ${method}`);
                    if (method === 'enable') {
                        logger.debug(
                            SERVICE_NAME,
                            `${CLIENT_CHANNEL} binary enable on port ${port}`,
                        );
                        try {
                            await coinjoinMiddleware.start();
                        } catch (err) {
                            logger.error(SERVICE_NAME, `Start failed: ${err.message}`);
                            throw err; // pass this error to suite toast
                        }
                    }
                    if (method === 'disable') {
                        clients.splice(clients.indexOf(client), 1);

                        if (clients.length === 0) {
                            logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} binary stop`);
                            coinjoinMiddleware.stop();
                        }
                        if (!clients.some(cli => cli.getAccounts().length > 0)) {
                            powerSaveBlocker.stopBlockingPowerSave();
                        }
                    }
                    if (method === 'registerAccount') {
                        powerSaveBlocker.startBlockingPowerSave();
                    }
                    if (method === 'unregisterAccount') {
                        if (!clients.some(cli => cli.getAccounts().length > 0)) {
                            powerSaveBlocker.stopBlockingPowerSave();
                        }
                    }
                    // needs type casting
                    return (client[method] as any)(...params); // bind method to instance context
                },
                onAddListener: (eventName, listener) => {
                    logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} add listener ${eventName}`);
                    return client.on(eventName, listener);
                },
                onRemoveListener: eventName => {
                    logger.debug(SERVICE_NAME, `${CLIENT_CHANNEL} remove listener ${eventName}`);
                    return client.removeAllListeners(eventName);
                },
            };
        },
    };

    return () => {
        const unregisterBackendProxy = createIpcProxyHandler(
            ipcMain,
            BACKEND_CHANNEL,
            backendProxyOptions,
        );

        const unregisterClientProxy = createIpcProxyHandler(
            ipcMain,
            CLIENT_CHANNEL,
            clientProxyOptions,
        );

        const dispose = () => {
            backends.forEach(b => b.disable());
            backends.splice(0, backends.length);

            clients.forEach(cli => {
                // emit unexpected app close before disabling the client
                if (cli.getRoundsInCriticalPhase().length > 0) {
                    cli.emit('log', {
                        level: 'error',
                        payload: 'Suite closed in critical phase',
                    });
                }
                cli.disable();
            });
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
