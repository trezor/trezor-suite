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
const MAX_CONCURRENT_CONNECTIONS = 50;
const MAX_CONNECTIONS_PER_ORIGIN = 5;
const MAX_MESSAGE_SIZE = 2 * 1024 * 1024; // 2 MB

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

type ExposeConnectWsParams = {
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
        const connectionId = `ws-${++connectionCounter}`;
        // Namespaces a caller-supplied request id to this connection. Internal to the main
        // process; the original id is still echoed back to the client on the wire.
        const getStoreId = (id: string) => `${connectionId}:${id}`;
        // Namespaced store keys of this connection's in-flight calls.
        const connectionPendingMessages = new Set<string>();
        // Forwarding a call to the renderer waits for the window and the process icon. A cancel is
        // delivered after the calls received before it, so it cannot overtake the call it is meant
        // for and reach the renderer while that call is still unknown there.
        let lastForwarding: Promise<unknown> = Promise.resolve();
        const sendCancel = async (cancel: { error?: string; callId?: string }) => {
            await lastForwarding;
            mainWindowProxy.getInstance()?.webContents.send('connect-popup/cancel', {
                ...cancel,
                // the renderer acts only on this connection's own calls
                connectionId,
            });
        };
        const ip = req.socket.remoteAddress;
        const port = req.socket.remotePort;
        if ((ip !== '127.0.0.1' && ip !== '::1') || !port) {
            logger.error(LOG_PREFIX, `invalid connection attempt from ${ip}:${port}`);
            req.socket.destroy();

            return;
        }

        const { origin } = req.headers;
        const originKey = origin || 'unknown';

        // Enforce per-origin connection limit to prevent single client monopolization
        const originConnections = connectionsByOrigin.get(originKey) ?? 0;
        if (originConnections + 1 > MAX_CONNECTIONS_PER_ORIGIN) {
            logger.warn(
                LOG_PREFIX,
                `connection rejected: limit per origin (${MAX_CONNECTIONS_PER_ORIGIN}) exceeded for ${originKey}`,
            );
            req.socket.destroy();

            return;
        }

        const activeConnections = getActiveConnections();
        // Enforce global connection limit to prevent resource exhaustion
        if (activeConnections + 1 > MAX_CONCURRENT_CONNECTIONS) {
            logger.warn(
                LOG_PREFIX,
                `connection rejected: limit (${MAX_CONCURRENT_CONNECTIONS}) exceeded`,
            );
            req.socket.destroy();

            return;
        }
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
                await sendCancel({
                    error: message.payload?.error,
                    callId: message.payload?.callId,
                });
            } else if (message.type === CORE_CALL_CANCEL) {
                await sendCancel({
                    error: message.payload?.reason,
                    callId: message.payload?.callId,
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
                    // Hands the call to the renderer once the window and the process icon are
                    // ready. Registered in `lastForwarding` before it is awaited, so a cancel
                    // received after this call is delivered after it (see sendCancel).
                    const forwarding = (async () => {
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
                        if (!mainWindow) return false;

                        const icon = processOnPort
                            ? await getProcessIcon({ path: processOnPort.fullPath, logger })
                            : undefined;

                        // The connection closed while this call waited for the window or the
                        // icon. Its pending calls were rejected on close, so the renderer must
                        // not open it.
                        if (!connectionPendingMessages.has(storeId)) return false;

                        // Send call to renderer. It echoes the namespaced `id` back on the
                        // response, which resolves this connection's deferred; `connectionId`
                        // marks the owner so that a cancel from another connection leaves the
                        // call alone.
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
                                      icon,
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

                        return true;
                    })();
                    lastForwarding = Promise.allSettled([lastForwarding, forwarding]);

                    if (!(await forwarding)) {
                        // Closed while waiting: the call was already rejected on close.
                        if (!connectionPendingMessages.has(storeId)) return;

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

        const { pathname } = new URL(request.url, 'http://localhost');
        if (pathname === '/connect-ws') {
            wss.handleUpgrade(request, socket, head, ws => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });
};
