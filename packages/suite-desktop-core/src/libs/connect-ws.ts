import { ipcMain, nativeImage } from 'electron';
import { WebSocketServer } from 'ws';

import {
    CORE_CALL,
    type CoreCallMessage,
    type Manifest,
    POPUP,
    type PopupClosedMessage,
    type PopupHandshake,
} from '@trezor/connect';
import { parseManifest, parseVersion } from '@trezor/connect/src/data/connectSettings';
import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';
import { type ProcessInfo, findProcessFromIncomingPort } from '@trezor/node-utils';
import { type ConnectPopupResponse } from '@trezor/suite-desktop-api/src/messages';
import { type Deferred, createDeferred, resolveAfter } from '@trezor/utils';

import { type createHttpReceiver } from './http-receiver';
import { getProcessIcon } from './process-icon';
import { type Dependencies } from '../modules';
import { app } from '../typed-electron';

const LOG_PREFIX = 'connect-ws';

/**
 * allowed message from connect-in-suite-desktop implementation
 */
type IncomingMessage =
    | (CoreCallMessage & { id: string })
    | (PopupHandshake & { id: string })
    | (PopupClosedMessage & { id: string })
    | { type: 'ping'; id: string };

const validateIncomingMessage = (message: any): message is IncomingMessage => {
    if (typeof message !== 'object' || typeof message.type !== 'string') {
        return false;
    }

    // message.id is a string parsable as int
    if (typeof message.id !== 'string' || isNaN(Number(message.id))) {
        return false;
    }

    if (message.type === 'ping') {
        return true;
    }

    if (message.type === POPUP.HANDSHAKE && message.payload?.settings) {
        return true;
    }

    if (message.type === POPUP.CLOSED) {
        return true;
    }

    // todo: this is incomplete validation
    if (message.type === CORE_CALL && message.payload?.method) {
        return true;
    }

    return false;
};

export const exposeConnectWs = ({
    mainThreadEmitter,
    mainWindowProxy,
    httpReceiver,
    store,
}: {
    mainThreadEmitter: Dependencies['mainThreadEmitter'];
    mainWindowProxy: Dependencies['mainWindowProxy'];
    httpReceiver: ReturnType<typeof createHttpReceiver>;
    store: Dependencies['store'];
}) => {
    const { logger } = global;
    const messages: Record<string, Deferred<any, number>> = {};
    let appInit: Deferred<void> | undefined;

    const wss = new WebSocketServer({
        noServer: true,
    });

    wss.on('listening', () => {
        logger.info(LOG_PREFIX, 'Websocket server is listening');
    });

    wss.on('connection', (ws, req) => {
        const connectionPendingMessages = new Set<string>();
        const ip = req.socket.remoteAddress;
        const port = req.socket.remotePort;
        if ((ip !== '127.0.0.1' && ip !== '::1') || !port) {
            logger.error(LOG_PREFIX, `invalid connection attempt from ${ip}:${port}`);
            ws.close();

            return;
        }
        logger.info(LOG_PREFIX, `new connection from ${ip}:${port}`);

        let processOnPort: ProcessInfo | undefined;
        const { origin } = req.headers;

        let manifest: Manifest | undefined;
        let version: string | undefined;

        logger.info(LOG_PREFIX, `origin: ${origin}`);

        ws.on('error', err => {
            logger.error(LOG_PREFIX, err.message);
        });

        ws.on('message', async data => {
            const dataString = data.toString();
            logger.debug(LOG_PREFIX, dataString);
            let message;
            try {
                message = JSON.parse(dataString);
            } catch {
                logger.error(LOG_PREFIX, 'message is not valid JSON');

                return;
            }

            if (!validateIncomingMessage(message)) {
                logger.error(LOG_PREFIX, 'incoming message in invalid format');

                return;
            }

            if (message.type === 'ping') {
                ws.send(JSON.stringify({ id: message.id, type: 'pong' }));

                return;
            }
            if (message.type === POPUP.HANDSHAKE) {
                const filterSelf = !process.env.PLAYWRIGHT_RUN; // ignore own process, unless testing
                processOnPort = await findProcessFromIncomingPort(port, filterSelf).catch(() => {
                    logger.error(LOG_PREFIX, 'findProcessFromIncomingPort failed');

                    return undefined;
                });
                manifest = parseManifest(message.payload.settings.manifest);
                version = parseVersion(message.payload.settings.version);
                ws.send(JSON.stringify({ id: message.id, type: POPUP.HANDSHAKE, payload: 'ok' }));
            } else if (message.type === POPUP.CLOSED) {
                mainWindowProxy.getInstance()?.webContents.send('connect-popup/cancel', {
                    error: message.payload?.error,
                });
            } else if (message.type === CORE_CALL) {
                if (!processOnPort) {
                    // ts check, should be set
                    logger.error(LOG_PREFIX, 'processOnPort result not found');

                    if (!isLinux()) {
                        // we ignore missing process on linux because of AppImage/Flatpak sandboxing
                        return;
                    }
                }
                if (!manifest?.appName) {
                    // ts check, should be set - if not set, error should be returned client-side
                    logger.error(LOG_PREFIX, 'settings.manifest.appName not found');

                    return;
                }
                if (!origin) {
                    // ts check, should be set
                    logger.error(LOG_PREFIX, 'origin not found');

                    return;
                }

                store.setConnectSettings({
                    hasUsedConnectWs: true,
                });

                const { method, ...rest } = message.payload;

                messages[message.id] = createDeferred();
                connectionPendingMessages.add(message.id);

                try {
                    // check window exists, if not wait for it to be created
                    if (!mainWindowProxy.getInstance()) {
                        mainThreadEmitter.emit('app/show');
                        logger.info(LOG_PREFIX, 'waiting for window to start');
                        appInit = createDeferred();
                        // todo: do we actually need to clean this timeout?
                        const appInitTimeout = resolveAfter(10000);
                        await Promise.race([appInit.promise, appInitTimeout]);
                        appInit = undefined;
                    }

                    // send call to renderer
                    mainWindowProxy.getInstance()?.webContents.send('connect-popup/call', {
                        id: message.id,
                        method,
                        payload: rest,
                        origin,
                        process: processOnPort
                            ? {
                                  name: processOnPort.name,
                                  fullPath: processOnPort.fullPath,
                                  warning: !!processOnPort.warning,
                                  icon: await getProcessIcon(processOnPort.fullPath),
                              }
                            : undefined,
                        manifest: {
                            appName: manifest.appName,
                            appIcon: manifest.appIcon,
                            appUrl: manifest.appUrl,
                            email: manifest.email,
                            npmVersion: version,
                        },
                    });

                    // wait for response
                    const response = await messages[message.id].promise;

                    ws.send(
                        JSON.stringify({
                            ...response,
                            id: message.id,
                        }),
                    );
                } catch (e) {
                    logger.error(LOG_PREFIX, 'error handling call: ' + e);
                } finally {
                    connectionPendingMessages.delete(message.id);
                }
            }
        });
        ws.on('close', () => {
            logger.info(LOG_PREFIX, 'Connection closed');

            if (connectionPendingMessages.size > 0) {
                mainWindowProxy.getInstance()?.webContents.send('connect-popup/cancel', {
                    error: 'Connection closed',
                });
            }
        });
    });
    wss.on('close', () => {
        logger.info(LOG_PREFIX, 'Websocket server closed');
    });

    httpReceiver.server.on('upgrade', (request, socket, head) => {
        if (!request?.url) return;
        const { pathname } = new URL(request.url, 'http://localhost');
        if (pathname === '/connect-ws') {
            wss.handleUpgrade(request, socket, head, ws => {
                wss.emit('connection', ws, request);
            });
        }
    });

    ipcMain.handle('connect-popup/response', (_, response: ConnectPopupResponse) => {
        logger.info(LOG_PREFIX, 'received response from popup ' + JSON.stringify(response));
        if (!response || typeof response.id !== 'string') {
            logger.error(LOG_PREFIX, 'invalid response from popup');

            return;
        }

        if (!messages[response.id]) {
            logger.error(LOG_PREFIX, 'no deferred message found');

            return;
        }

        messages[response.id].resolve(response);
    });
    ipcMain.handle('connect-popup/ready', () => {
        appInit?.resolve();
    });
};
