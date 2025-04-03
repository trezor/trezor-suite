import { ipcMain } from 'electron';
import { WebSocketServer } from 'ws';

import {
    ConnectSettings,
    IFRAME,
    IFrameCallMessage,
    POPUP,
    PopupHandshake,
    parseConnectSettings,
} from '@trezor/connect';
import { ConnectPopupResponse } from '@trezor/suite-desktop-api/src/messages';
import { Deferred, createDeferred } from '@trezor/utils';

import { createHttpReceiver } from './http-receiver';
import { Dependencies } from '../modules';
import { ProcessInfo, findProcessFromIncomingPort } from './find-process-from-port';

const LOG_PREFIX = 'connect-ws';

/**
 * allowed message from connect-in-suite-desktop implementation
 */
type IncomingMessage =
    | (IFrameCallMessage & { id: string })
    | (PopupHandshake & { id: string })
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

    // todo: this is incomplete validation
    if (message.type === IFRAME.CALL && message.payload?.method) {
        return true;
    }

    return false;
};

export const exposeConnectWs = ({
    mainThreadEmitter,
    mainWindowProxy,
    httpReceiver,
}: {
    mainThreadEmitter: Dependencies['mainThreadEmitter'];
    mainWindowProxy: Dependencies['mainWindowProxy'];
    httpReceiver: ReturnType<typeof createHttpReceiver>;
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
        let settings: ConnectSettings;
        logger.info(LOG_PREFIX, `origin: ${origin}`);

        ws.on('error', err => {
            logger.error(LOG_PREFIX, err.message);
        });

        ws.on('message', async data => {
            logger.debug(LOG_PREFIX, data.toString());
            let message;
            try {
                message = JSON.parse(data.toString());
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
                processOnPort = await findProcessFromIncomingPort(port);
                settings = parseConnectSettings(message.payload.settings);
                ws.send(JSON.stringify({ id: message.id, type: POPUP.HANDSHAKE, payload: 'ok' }));
            } else if (message.type === IFRAME.CALL) {
                if (!processOnPort) {
                    logger.error(LOG_PREFIX, 'processOnPort result not found');

                    return;
                }

                const { method, ...rest } = message.payload;

                messages[message.id] = createDeferred();

                // focus renderer window
                mainThreadEmitter.emit('app/show');

                // check window exists, if not wait for it to be created
                if (!mainWindowProxy.getInstance()) {
                    logger.info(LOG_PREFIX, 'waiting for window to start');
                    appInit = createDeferred(10000);
                    await appInit.promise;
                    appInit = undefined;
                }

                // send call to renderer
                mainWindowProxy.getInstance()?.webContents.send('connect-popup/call', {
                    id: message.id,
                    method,
                    payload: rest,
                    origin,
                    processName: processOnPort?.name,
                    manifest: settings?.manifest,
                });

                // wait for response
                const response = await messages[message.id].promise;

                ws.send(
                    JSON.stringify({
                        ...response,
                        id: message.id,
                    }),
                );
            }
        });
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
