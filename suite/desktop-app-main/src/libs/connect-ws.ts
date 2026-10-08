import { type Duplex } from 'stream';
import { WebSocketServer } from 'ws';

import {
    CORE_CALL,
    CORE_CALL_CANCEL,
    type CoreCallCancelMessage,
    type CoreCallMessage,
    type Manifest,
    POPUP,
    type PermissionRequest,
    type PopupClosedMessage,
    type PopupHandshake,
} from '@trezor/connect';
import { parseManifest, parseVersion } from '@trezor/connect-common/src/data/connectSettings';
import { isLinux } from '@trezor/env-utils';
import { type ProcessInfo, findProcessFromIncomingPort } from '@trezor/node-utils';
import { createDeferred, resolveAfter } from '@trezor/utils';

import { addMessage, deleteMessage, rejectMessage, setAppInit } from './connect-popup-messages';
import { type createHttpReceiver } from './http-receiver';
import { getProcessIcon } from './process-icon';
import { type Dependencies } from '../modules';

const LOG_PREFIX = 'connect-ws';
const HANDSHAKE_TIMEOUT_MS = 10000;
export const MAX_CONCURRENT_CONNECTIONS = 50;
export const MAX_CONNECTIONS_PER_ORIGIN = 5;
const MAX_MESSAGE_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Rejects an upgrade with a minimal HTTP response instead of a bare close.
 *
 * Used only for the capacity limits, where the peer is already on loopback and already knows the
 * endpoint exists, so the status leaks nothing it could not learn anyway - but it does surface the
 * reason in the caller's devtools console, which an opaque close does not. Still no `101` and no
 * WebSocket parser, so the socket never becomes a WebSocket. `end()` (not `write()` + `destroy()`)
 * so the response is flushed before the socket is closed.
 */
const rejectWithStatus = (socket: Duplex, status: string) => {
    socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`, () =>
        socket.destroy(),
    );
};

// Per-connection id used to namespace the process-global response store. Each client numbers
// its requests on its own, so two connections can have a call with the same id in flight.
let connectionCounter = 0;

/**
 * allowed message from connect-in-suite-desktop implementation
 */
type IncomingMessage =
    | (CoreCallMessage & { id: string })
    | (PopupHandshake & { id: string })
    | (PopupClosedMessage & { id: string })
    | (CoreCallCancelMessage & { id: string })
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

    if (message.type === CORE_CALL_CANCEL) {
        return true;
    }

    // We need to handle `POPUP.CLOSED` for backward compatibility, for connect10 with older clients.
    if (message.type === POPUP.CLOSED) {
        return true;
    }

    // todo: this is incomplete validation
    if (message.type === CORE_CALL && message.payload?.method) {
        return true;
    }

    return false;
};

export type ExposeConnectWsParams = {
    mainThreadEmitter: Dependencies['mainThreadEmitter'];
    mainWindowProxy: Dependencies['mainWindowProxy'];
    httpReceiver: ReturnType<typeof createHttpReceiver>;
    store: Dependencies['store'];
    logger: Dependencies['logger'];
};

export const exposeConnectWs = ({
    mainThreadEmitter,
    mainWindowProxy,
    httpReceiver,
    store,
    logger,
}: ExposeConnectWsParams) => {
    const connectionsByOrigin = new Map<string, number>();
    const getActiveConnections = () =>
        Array.from(connectionsByOrigin.values()).reduce((acc, val) => acc + val, 0);

    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: MAX_MESSAGE_SIZE,
    });

    wss.on('listening', () => {
        logger.info(LOG_PREFIX, 'Websocket server is listening');
    });

    wss.on('connection', (ws, req) => {
        ws.on('error', err => {
            logger.error(LOG_PREFIX, err.message);
        });

        const connectionId = `ws-${++connectionCounter}`;
        // Namespaces a caller-supplied request id to this connection. Internal to the main
        // process; the original id is still echoed back to the client on the wire.
        const getStoreId = (id: string) => `${connectionId}:${id}`;
        // Namespaced store keys of this connection's in-flight calls.
        const connectionPendingMessages = new Set<string>();
        const ip = req.socket.remoteAddress;
        const port = req.socket.remotePort;
        if (!port) {
            // Unreachable: the upgrade handler already rejected sockets without a remote port.
            logger.error(LOG_PREFIX, `connection without remote port from ${ip}`);
            ws.terminate();

            return;
        }

        const { origin } = req.headers;
        const originKey = origin || 'unknown';

        const originConnections = connectionsByOrigin.get(originKey) ?? 0;
        const activeConnections = getActiveConnections();
        connectionsByOrigin.set(originKey, originConnections + 1);

        logger.info(
            LOG_PREFIX,
            `new connection from ${ip}:${port} (${activeConnections + 1}/${MAX_CONCURRENT_CONNECTIONS})`,
        );

        let processOnPort: ProcessInfo | undefined;

        let manifest: Manifest | undefined;
        let version: string | undefined;
        let requestedPermissions: PermissionRequest[] | undefined;
        let isHandshakeDone = false;

        // Close connection if handshake is not received within timeout
        const handshakeTimeout = setTimeout(() => {
            if (!isHandshakeDone) {
                logger.warn(LOG_PREFIX, `connection closed: handshake timeout from ${ip}:${port}`);
                req.socket.destroy();
            }
        }, HANDSHAKE_TIMEOUT_MS);

        logger.info(LOG_PREFIX, `origin: ${origin}`);

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

            if (!isHandshakeDone && message.type !== POPUP.HANDSHAKE) {
                logger.warn(LOG_PREFIX, `${message.type} rejected: handshake not completed`);

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
                requestedPermissions = message.payload.settings.requestedPermissions;
                isHandshakeDone = true;
                clearTimeout(handshakeTimeout);
                ws.send(JSON.stringify({ id: message.id, type: POPUP.HANDSHAKE, payload: 'ok' }));
            } else if (message.type === POPUP.CLOSED) {
                mainWindowProxy.getInstance()?.webContents.send('connect-popup/cancel', {
                    error: message.payload?.error,
                    callId: message.payload?.callId,
                    // the renderer acts only on this connection's own calls
                    connectionId,
                });
            } else if (message.type === CORE_CALL_CANCEL) {
                mainWindowProxy.getInstance()?.webContents.send('connect-popup/cancel', {
                    error: message.payload?.reason,
                    callId: message.payload?.callId,
                    // the renderer acts only on this connection's own calls
                    connectionId,
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

                const storeId = getStoreId(message.id);
                // Reject a request id that this connection already has in flight instead of
                // overwriting its deferred (which would leave the first call without a response).
                if (connectionPendingMessages.has(storeId)) {
                    logger.error(LOG_PREFIX, `duplicate in-flight id ${message.id}`);
                    ws.send(
                        JSON.stringify({
                            id: message.id,
                            success: false,
                            payload: { error: 'Duplicate in-flight request id' },
                        }),
                    );

                    return;
                }
                const deferred = addMessage(storeId);
                connectionPendingMessages.add(storeId);

                try {
                    // check window exists, if not wait for it to be created
                    if (!mainWindowProxy.getInstance()) {
                        mainThreadEmitter.emit('app/show');
                        logger.info(LOG_PREFIX, 'waiting for window to start');
                        const appInitDeferred = createDeferred<void>();
                        setAppInit(appInitDeferred);
                        // todo: do we actually need to clean this timeout?
                        const appInitTimeout = resolveAfter(10000);
                        await Promise.race([appInitDeferred.promise, appInitTimeout]);
                        setAppInit(undefined);
                    }

                    const mainWindow = mainWindowProxy.getInstance();
                    if (!mainWindow) {
                        logger.error(
                            LOG_PREFIX,
                            'Main window not available after initialization timeout',
                        );
                        deleteMessage(storeId);
                        connectionPendingMessages.delete(storeId);
                        ws.send(
                            JSON.stringify({
                                id: message.id,
                                success: false,
                                payload: {
                                    error: 'Main window not available',
                                },
                            }),
                        );

                        return;
                    }

                    // Send call to renderer. It echoes the namespaced `id` back on the response,
                    // which resolves this connection's deferred; `connectionId` marks the owner so
                    // that a cancel from another connection leaves the call alone.
                    mainWindow.webContents.send('connect-popup/call', {
                        id: storeId,
                        connectionId,
                        method,
                        payload: rest,
                        origin,
                        process: processOnPort
                            ? {
                                  name: processOnPort.name,
                                  fullPath: processOnPort.fullPath,
                                  warning: !!processOnPort.warning,
                                  icon: await getProcessIcon({
                                      path: processOnPort.fullPath,
                                      logger,
                                  }),
                              }
                            : undefined,
                        manifest: {
                            appName: manifest.appName,
                            appIcon: manifest.appIcon,
                            appUrl: manifest.appUrl,
                            email: manifest.email,
                            npmVersion: version,
                        },
                        requestedPermissions,
                    });

                    // wait for response
                    const response = await deferred.promise;

                    // Echo back the original (client-facing) id, not the namespaced store id.
                    ws.send(
                        JSON.stringify({
                            ...response,
                            id: message.id,
                        }),
                    );
                } catch (e) {
                    logger.error(LOG_PREFIX, 'error handling call: ' + e);
                } finally {
                    connectionPendingMessages.delete(storeId);
                }
            }
        });
        ws.on('close', () => {
            clearTimeout(handshakeTimeout);
            const currentOriginCount = connectionsByOrigin.get(originKey) ?? 1;
            if (currentOriginCount <= 1) {
                connectionsByOrigin.delete(originKey);
            } else {
                connectionsByOrigin.set(originKey, currentOriginCount - 1);
            }
            logger.info(
                LOG_PREFIX,
                `Connection closed (${getActiveConnections()}/${MAX_CONCURRENT_CONNECTIONS})`,
            );

            if (connectionPendingMessages.size > 0) {
                mainWindowProxy.getInstance()?.webContents.send('connect-popup/cancel', {
                    error: 'Connection closed',
                    // the renderer acts only on the closed connection's own calls
                    connectionId,
                });

                for (const id of connectionPendingMessages) {
                    // Reject (not just delete) so the awaiting message handler unblocks and
                    // releases its closure instead of waiting on a deferred nothing settles.
                    rejectMessage(id, new Error('Connection closed'));
                }
                connectionPendingMessages.clear();
            }
        });
    });
    wss.on('close', () => {
        logger.info(LOG_PREFIX, 'Websocket server closed');
    });

    httpReceiver.server.on('upgrade', (request, socket, head) => {
        if (!request?.url) {
            socket.destroy();

            return;
        }

        // The http server is shared, so match the route before applying connect-ws policy to it.
        // `new URL()` is not used here: it throws for request targets node accepts and delivers
        // verbatim (`//[` for example), and the throw would escape this listener and leak the
        // socket undestroyed and uncounted.
        const pathname = request.url.split('?')[0];
        if (pathname !== '/connect-ws') {
            socket.destroy();

            return;
        }

        const ip = request.socket.remoteAddress;
        const port = request.socket.remotePort;
        if ((ip !== '127.0.0.1' && ip !== '::1') || !port) {
            logger.error(LOG_PREFIX, `invalid connection attempt from ${ip}:${port}`);
            socket.destroy();

            return;
        }

        if (getActiveConnections() >= MAX_CONCURRENT_CONNECTIONS) {
            logger.warn(
                LOG_PREFIX,
                `connection rejected: limit (${MAX_CONCURRENT_CONNECTIONS}) exceeded`,
            );
            rejectWithStatus(socket, '503 Service Unavailable');

            return;
        }

        // Enforce per-origin connection limit to prevent single client monopolization
        const originKey = request.headers.origin || 'unknown';
        if ((connectionsByOrigin.get(originKey) ?? 0) >= MAX_CONNECTIONS_PER_ORIGIN) {
            logger.warn(
                LOG_PREFIX,
                `connection rejected: limit per origin (${MAX_CONNECTIONS_PER_ORIGIN}) exceeded for ${originKey}`,
            );
            rejectWithStatus(socket, '503 Service Unavailable');

            return;
        }

        wss.handleUpgrade(request, socket, head, ws => {
            wss.emit('connection', ws, request);
        });
    });
};
