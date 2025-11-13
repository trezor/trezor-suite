import fs from 'fs/promises';
import stringify from 'json-stable-stringify';
import path from 'path';
import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

import { WebUSB } from 'usb';

import {
    HttpServer,
    ParamsValidatorHandler,
    RequestHandler,
    RequestWithParams,
    Response,
    parseBodyJSON,
    parseBodyText,
} from '@trezor/node-utils';
import { checkOrigin } from '@trezor/node-utils/src/http';
import { AbstractApi } from '@trezor/transport/src/api/abstract';
import { UNEXPECTED_ERROR } from '@trezor/transport/src/errors';
import { Descriptor, PathPublic, Session } from '@trezor/transport/src/types';
import { validateProtocolMessage } from '@trezor/transport/src/utils/bridgeProtocolMessage';
import { Log, Throttler, arrayPartition } from '@trezor/utils';
import { createLegacyBridge } from './legacy';
import { SessionsBackground, SessionsClient, UsbApi } from '@trezor/transport';

const str = (value: Record<string, any> | string) =>
    typeof value === 'string' ? value : JSON.stringify(value);

const validateDescriptorsJSON: RequestHandler<JSON, Descriptor[]> = (request, response, next) => {
    if (Array.isArray(request.body)) {
        next({ ...request, body: request.body }, response);
    } else {
        response.statusCode = 400;
        response.end(str({ error: 'Invalid body' }));
    }
};

const validateAcquireParams: ParamsValidatorHandler<{
    path: PathPublic;
    previous: Session | 'null';
}> = (request, response, next) => {
    if (
        typeof request.params.path === 'string' &&
        /^[1-9][0-9]*$/.test(request.params.path) &&
        typeof request.params.previous === 'string' &&
        /^\d+$|^null$/.test(request.params.previous)
    ) {
        next(request as Parameters<typeof next>[0], response);
    } else {
        response.statusCode = 400;
        response.end(str({ error: 'Invalid params' }));
    }
};

const validateSessionParams: ParamsValidatorHandler<{
    session: Session;
}> = (request, response, next) => {
    if (typeof request.params.session === 'string' && /^\d+$/.test(request.params.session)) {
        next(request as Parameters<typeof next>[0], response);
    } else {
        response.statusCode = 400;
        response.end(str({ error: 'Invalid params' }));
    }
};

const validateProtocolMessageBody =
    (
        withData: boolean,
        protocolMessages: boolean,
    ): RequestHandler<string, ReturnType<typeof validateProtocolMessage>> =>
    (request, response, next) => {
        try {
            const body = validateProtocolMessage(request.body, withData);
            if (!protocolMessages && body.protocol) {
                throw new Error('BridgeProtocolMessage support is disabled');
            }

            return next({ ...request, body }, response);
        } catch (error) {
            response.statusCode = 400;
            response.end(str({ error: UNEXPECTED_ERROR, message: error.message }));
        }
    };

const COMPATIBILITY_PORT = 21325;

type WebSocketMessage = {
    id: string;
    method: string;
    type?: string; // only ping from base websocket client
    params?: any;
};

type WebSocketClient = {
    ws: WebSocket;
    isAlive: boolean;
    subscriptions: Set<string>;
};

const sessionsBackground = new SessionsBackground();
const sessionsClient = new SessionsClient(sessionsBackground);
export class TrezordNode {
    version = '3.2.0';
    bundledVersion?: string;
    serviceName = 'trezord-node';
    /** server start timestamp */
    private startedAt: number = Date.now();
    /** last known descriptors state */
    private descriptors: Descriptor[] = [];
    /** last known sessions descriptors (session layer) */
    private sessionsDescriptors: Descriptor[] = [];
    /** pending /listen subscriptions that are supposed to be resolved whenever descriptors change is detected */
    private listenSubscriptions: {
        descriptors: Descriptor[];
        req: Parameters<RequestHandler<unknown, unknown>>[0];
        res: Response;
    }[];
    /** WebSocket clients */
    private wsClients: Map<WebSocket, WebSocketClient> = new Map();
    private wss?: WebSocketServer;
    private readonly requestedPort: number;
    private port?: number;
    // todo: why public?
    public server: HttpServer<never>[] = [];
    private legacyBridge: ReturnType<typeof createLegacyBridge>;
    private serverApi?: UsbApi; // Separate API instance for WebSocket API handlers
    private logger: Log;
    private assetPrefix: string;
    private protocolMessages: boolean;
    private throttler = new Throttler(500);
    private statusBroadcastInterval?: ReturnType<typeof setInterval>;

    constructor({
        api,
        assetPrefix = '',
        logger,
        protocolMessages,
        bundledVersion,
        port = 21328,
    }: {
        api: 'usb' | 'udp' | AbstractApi;
        assetPrefix?: string;
        logger: Log;
        protocolMessages?: boolean;
        bundledVersion?: string;
        port?: number;
    }) {
        this.logger = logger;
        this.bundledVersion = bundledVersion;

        this.listenSubscriptions = [];

        this.legacyBridge = createLegacyBridge({
            apiArg: api,
            logger: this.logger,
            sessionsClient,
        });

        this.assetPrefix = assetPrefix;
        this.protocolMessages = protocolMessages ?? true;
        this.requestedPort = port;
    }

    private checkAffectedSubscriptions() {
        const [aborted, notAborted] = arrayPartition(
            this.listenSubscriptions,
            subscription => subscription.res.destroyed,
        );

        if (aborted.length) {
            this.logger?.debug(
                `http: resolving listen subscriptions. n of aborted subscriptions: ${aborted.length}`,
            );
        }

        const [affected, unaffected] = arrayPartition(
            notAborted,
            // TODO this may be tricky comparison, e.g. when client send something extra in the descriptors
            subscription => stringify(subscription.descriptors) !== stringify(this.descriptors),
        );

        this.logger?.debug(
            `http: affected subscriptions ${affected.length}. unaffected subscriptions ${unaffected.length}`,
        );

        affected.forEach(subscription => {
            subscription.res.end(str(this.descriptors));
        });
        this.listenSubscriptions = unaffected;
    }

    private resolveListenSubscriptions(nextDescriptors: Descriptor[]) {
        this.descriptors = nextDescriptors;

        if (!this.listenSubscriptions.length) {
            return;
        }

        this.checkAffectedSubscriptions();
    }

    private createAbortSignal(res: Response) {
        const abortController = new AbortController();
        const listener = () => {
            abortController.abort();
            res.removeListener('close', listener);
        };
        res.addListener('close', listener);

        return abortController.signal;
    }

    private handleResponse(res: Response, data: string) {
        res.appendHeader('Content-Length', `${Buffer.byteLength(data)}`);
        res.end(data);
    }

    private handleInfo(_req: RequestWithParams, res: Response) {
        res.appendHeader('Content-Type', 'text/plain');
        res.statusCode = 200;

        this.handleResponse(
            res,
            str({
                version: this.version,
                protocolMessages: this.protocolMessages,
                githash: 'not provided',
            }),
        );
    }

    public async start() {
        // Initialize USB API for WebSocket support
        this.serverApi = new UsbApi({
            usbInterface: new WebUSB({
                allowAllDevices: true, // return all devices, not only authorized
            }),
            logger: this.logger,
            debugLink: false,
        });

        // Listen to sessions events and broadcast to WebSocket clients
        sessionsBackground.on('descriptors', descriptors => {
            this.logger?.debug(
                `http: sessionsBackground reported descriptors: ${JSON.stringify(descriptors)}`,
            );
            this.throttler.throttle('broadcast-sessions-descriptors', () => {
                this.broadcastSessionsDescriptors(descriptors);
            });
            this.sessionsDescriptors = descriptors;
        });

        sessionsBackground.on('releaseRequest', descriptor => {
            this.logger?.debug(
                `http: sessionsBackground reported releaseRequest: ${JSON.stringify(descriptor)}`,
            );
            this.broadcastSessionsReleaseRequest(descriptor);
        });

        // whenever sessions module reports changes to descriptors (including sessions), resolve affected /listen subscriptions (legacy fallback)
        this.legacyBridge.sessionsClient.on('descriptors', descriptors => {
            this.logger?.debug(
                `http: sessionsClient reported descriptors: ${JSON.stringify(descriptors)}`,
            );
            this.throttler.throttle('resolve-listen-subscriptions', () =>
                this.resolveListenSubscriptions(descriptors),
            );
        });

        // Broadcast release requests to WS clients so they can act accordingly
        this.legacyBridge.sessionsClient.on('releaseRequest', descriptor => {
            const message = str({ type: 'transport-release-request', payload: descriptor });
            this.wsClients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(message);
                }
            });
        });

        this.logger.info('Starting Trezor Bridge HTTP server with WebSocket support');
        // for compatibility reasons, we start two servers sharing the same request handlers and state.
        // compatibility case 1:
        //   user still has the old bridge client (targeting port 21325), but he already runs the latest suite-desktop version. We need to make sure that bridge is still available on port 21325 -> we need 2 servers
        // compatibility case 2:
        //   user has the latest bridge client (checking all the possible ports), but he runs the old suite-desktop version. This is easy and does not require us to start 2 servers, bridge client will fallback to the old port.

        const primaryApp = new HttpServer({
            ports: [this.requestedPort],
            logger: this.logger,
        });

        const compatibilityApp = new HttpServer({
            ports: [COMPATIBILITY_PORT],
            logger: this.logger,
        });

        const bindHandlers = (app: HttpServer<any>) => {
            app.use([
                (req, res, next, context) => {
                    // directly navigating to status page of bridge in browser. when request is not issued by js, there is no origin header
                    if (
                        !req.headers.origin &&
                        req.headers.host &&
                        [
                            `127.0.0.1:${app.getServerAddress().port}`,
                            `localhost:${app.getServerAddress().port}`,
                        ].includes(req.headers.host)
                    ) {
                        next(req, res);
                    } else {
                        const isOriginAllowed = checkOrigin({
                            request: req,
                            allowedOrigin: [
                                'sldev.cz',
                                'trezor.io',
                                'localhost',
                                // When using Tor it will send string "null" as default, and it will not allow calling to localhost.
                                // To allow it to be sent, you can go to about:config and set the attributes below:
                                // "network.http.referer.hideOnionSource - false"
                                // "network.proxy.allow_hijacking_localhost - false"
                                'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
                            ],
                            pathname: req.url,
                            logger: context.logger,
                        });

                        if (isOriginAllowed) {
                            next(req, res);
                        } else {
                            // error handling identic to legacy trezord-go
                            switch (req.url) {
                                case '/enumerate':
                                case '/listen':
                                    res.statusCode = 403;
                                    break;
                                default:
                                    res.statusCode = 404;
                            }
                            res.end();
                        }
                    }
                },
            ]);

            // origin was checked in previous app.use. if it didn't not satisfy the check, it did not move on to this handler
            app.use([
                (req, res, next) => {
                    if (req.headers.origin) {
                        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                    }

                    next(req, res);
                },
            ]);

            app.post('/enumerate', [
                (_req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    const signal = this.createAbortSignal(res);
                    this.legacyBridge.enumerate({ signal }).then(result => {
                        if (!result.success) {
                            res.statusCode = 400;

                            return this.handleResponse(
                                res,
                                str({ error: result.error, message: result.message }),
                            );
                        }
                        res.statusCode = 200;
                        this.handleResponse(res, str(result.payload.descriptors));
                    });
                },
            ]);

            app.post('/listen', [
                parseBodyJSON,
                validateDescriptorsJSON,
                (req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    this.listenSubscriptions.push({
                        descriptors: req.body,
                        req,
                        res,
                    });
                    this.checkAffectedSubscriptions();
                },
            ]);

            app.post('/acquire/:path/:previous', [
                parseBodyJSON,
                validateAcquireParams,
                (req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    const signal = this.createAbortSignal(res);
                    this.legacyBridge
                        .acquire({
                            path: req.params.path,
                            previous: req.params.previous,
                            // @ts-expect-error
                            sessionOwner: req?.body?.sessionOwner,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return this.handleResponse(
                                    res,
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.statusCode = 200;
                            this.handleResponse(res, str({ session: result.payload.session }));
                        });
                },
            ]);

            app.post('/release/:session', [
                validateSessionParams,
                parseBodyText,
                (req, res) => {
                    this.legacyBridge
                        .release({
                            session: req.params.session,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return this.handleResponse(
                                    res,
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.statusCode = 200;

                            this.handleResponse(res, str({ session: req.params.session }));
                        });
                },
            ]);

            app.post('/call/:session', [
                validateSessionParams,
                parseBodyText,
                validateProtocolMessageBody(true, this.protocolMessages),
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.legacyBridge
                        .call({
                            ...req.body,
                            session: req.params.session,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return this.handleResponse(
                                    res,
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.statusCode = 200;

                            this.handleResponse(res, str(result.payload));
                        });
                },
            ]);

            app.post('/read/:session', [
                validateSessionParams,
                parseBodyText,
                validateProtocolMessageBody(false, this.protocolMessages),
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.legacyBridge
                        .receive({
                            ...req.body,
                            session: req.params.session,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return this.handleResponse(
                                    res,
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.statusCode = 200;

                            this.handleResponse(res, str(result.payload));
                        });
                },
            ]);

            app.post('/post/:session', [
                validateSessionParams,
                parseBodyText,
                validateProtocolMessageBody(true, this.protocolMessages),
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.legacyBridge
                        .send({
                            ...req.body,
                            session: req.params.session,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return this.handleResponse(
                                    res,
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.statusCode = 200;

                            this.handleResponse(res, str(result.payload));
                        });
                },
            ]);

            app.get('/', [
                (_req, res) => {
                    res.writeHead(301, {
                        Location: `http://127.0.0.1:${app.getServerAddress().port}/status`,
                    });
                    res.end();
                },
            ]);

            app.get('/status', [
                async (_req, res) => {
                    res.statusCode = 200;
                    res.appendHeader('Content-Type', 'text/html');

                    try {
                        const ui = await fs.readFile(
                            path.join(__dirname, this.assetPrefix, 'ui/index.html'),
                            'utf-8',
                        );

                        this.handleResponse(res, ui);
                    } catch (error) {
                        this.logger.error('Failed to fetch status page', error);
                        // you need to run yarn workspace @trezor/transport-bridge build:ui to make it available (or build:lib will do)
                        this.handleResponse(res, 'Failed to fetch status page');
                    }
                },
            ]);

            app.get('/logs', [
                (_req, res) => {
                    res.appendHeader('Content-Type', 'text/plain');
                    res.appendHeader(
                        'Content-Disposition',
                        'attachment; filename=trezor-bridge.txt',
                    );
                    res.statusCode = 200;

                    this.handleResponse(
                        res,
                        app.logger
                            .getLog()
                            .map(l => l.message.join('. '))
                            .join('.\n'),
                    );
                },
            ]);

            app.post('/', [this.handleInfo.bind(this)]);

            app.post('/configure', [this.handleInfo.bind(this)]);
        };

        // start both at once
        const compatibilityAppRes =
            this.requestedPort === COMPATIBILITY_PORT // Don't even try to start compatibilityApp when the primaryApp requests the same port
                ? Promise.resolve({ success: false } as const)
                : compatibilityApp.start();

        const primaryAppRes = await primaryApp.start();

        // if primary succeeds -> resolve
        if (primaryAppRes.success) {
            bindHandlers(primaryApp);
            this.server.push(primaryApp);
            this.port = primaryAppRes.payload.port;

            // Create WebSocket server on the primary HTTP server
            this.wss = this.createWebSocketServer(primaryApp);
            this.logger.info('WebSocket server created on /ws endpoint');
            this.startStatusBroadcast(primaryApp);
        }

        return compatibilityAppRes.then(res => {
            if (res.success) {
                bindHandlers(compatibilityApp);
                this.server.push(compatibilityApp);

                // Create WebSocket server on the compatibility HTTP server as well
                this.createWebSocketServer(compatibilityApp);
                this.logger.info(
                    `WebSocket server created on compatibility port ${COMPATIBILITY_PORT}/ws endpoint`,
                );

                if (!this.port) {
                    this.port = res.payload.port;
                }
            } else if (!primaryAppRes.success) {
                throw new Error(primaryAppRes.error); // -> neither compatibility, nor primary app started -> only this case means reject
            }
        });
    }

    private broadcastSessionsDescriptors(descriptors: Descriptor[]) {
        const message = str({
            type: 'sessions-descriptors',
            payload: descriptors,
        });

        this.wsClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
            }
        });
    }

    private broadcastSessionsReleaseRequest(descriptor: Descriptor) {
        const message = str({
            type: 'sessions-releaseRequest',
            payload: descriptor,
        });

        this.wsClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
            }
        });
    }

    private async handleWsMessage(client: WebSocketClient, data: WebSocket.Data) {
        try {
            const message: WebSocketMessage = JSON.parse(data.toString());
            const { id, method, params, ...rest } = message;

            if (!id) {
                return this.sendWsError(client.ws, id, 'Invalid message format, id is missing');
            }

            // todo: unite,
            if (message?.method === 'ping' || message?.type === 'ping') {
                this.sendWsResponse(client.ws, id, { success: true, payload: 'pong' });
                return;
            }

            if (!method) {
                return this.sendWsError(client.ws, id, 'Invalid message format, method is missing');
            }

            const allParams = this.deserializeBuffers({ ...params, ...rest });

            this.logger?.debug(`websocket: received method: ${method}`, allParams);

            switch (method) {
                // Sessions-level RPCs
                case 'sessions.handshake':
                    await this.handleWsSessionsMessage(client, id, { type: 'handshake' });
                    break;
                case 'sessions.enumerateDone':
                    await this.handleWsSessionsMessage(client, id, {
                        type: 'enumerateDone',
                        payload: allParams[0],
                    });
                    break;
                case 'sessions.acquireIntent':
                    await this.handleWsSessionsMessage(client, id, {
                        type: 'acquireIntent',
                        payload: allParams[0],
                    });
                    break;
                case 'sessions.acquireDone':
                    await this.handleWsSessionsMessage(client, id, {
                        type: 'acquireDone',
                        payload: allParams[0],
                    });
                    break;
                case 'sessions.releaseIntent':
                    await this.handleWsSessionsMessage(client, id, {
                        type: 'releaseIntent',
                        payload: allParams[0],
                    });
                    break;
                case 'sessions.releaseDone':
                    await this.handleWsSessionsMessage(client, id, {
                        type: 'releaseDone',
                        payload: allParams[0],
                    });
                    break;
                case 'sessions.getSessions':
                    await this.handleWsSessionsMessage(client, id, { type: 'getSessions' });
                    break;
                case 'sessions.getPathBySession':
                    await this.handleWsSessionsMessage(client, id, {
                        type: 'getPathBySession',
                        payload: allParams[0],
                    });
                    break;
                case 'sessions.dispose':
                    await this.handleWsSessionsMessage(client, id, { type: 'dispose' });
                    break;
                // API-level RPCs (for WebSocketProxyApi)
                case 'api.enumerate':
                case 'enumerate':
                    await this.handleWsApiEnumerate(client.ws, id);
                    break;
                case 'api.listen':
                case 'listen':
                    this.handleWsApiListen(client, id);
                    break;
                case 'api.openDevice':
                case 'openDevice':
                    await this.handleWsApiOpenDevice(client.ws, id, allParams);
                    break;
                case 'api.closeDevice':
                case 'closeDevice':
                    await this.handleWsApiCloseDevice(client.ws, id, allParams);
                    break;
                case 'api.read':
                case 'read':
                    await this.handleWsApiRead(client.ws, id, allParams);
                    break;
                case 'api.write':
                case 'write':
                    await this.handleWsApiWrite(client.ws, id, allParams);
                    break;
                case 'bridge.status': {
                    // Return rich snapshot for status UI
                    const primaryServer = this.server[0];
                    const snapshot = this.buildWsStatusDebug(primaryServer);
                    this.sendWsResponse(client.ws, id, { success: true, payload: snapshot });
                    break;
                }
                default:
                    this.sendWsError(client.ws, id, `Unknown method: ${method}`);
            }
        } catch (error) {
            this.logger?.error('websocket: error parsing message', error);
            this.sendWsError(
                client.ws,
                '',
                error instanceof Error ? error.message : 'Unknown error',
            );
        }
    }

    private async handleWsSessionsMessage(
        client: WebSocketClient,
        id: string,
        message: import('@trezor/transport/src/sessions/types').HandleMessageParams,
    ) {
        try {
            const response = await sessionsBackground.handleMessage(message);
            this.sendWsResponse(client.ws, id, response);
        } catch (err) {
            this.sendWsError(
                client.ws,
                id,
                'sessions error',
                err instanceof Error ? err.message : 'Unknown error',
            );
        }
    }

    private async handleWsApiEnumerate(ws: WebSocket, id: string) {
        try {
            const result = await this.serverApi!.enumerate();
            if (!result.success) {
                return this.sendWsError(ws, id, 'enumerate error', result.error);
            }
            this.sendWsResponse(ws, id, { success: true, payload: result.payload });
        } catch (err) {
            this.sendWsError(
                ws,
                id,
                'enumerate error',
                err instanceof Error ? err.message : 'Unknown error',
            );
        }
    }

    private handleWsApiListen(client: WebSocketClient, id: string) {
        client.subscriptions.add('api-descriptors');

        // Subscribe to API descriptor changes
        this.serverApi!.on('transport-interface-change', descriptors => {
            if (client.subscriptions.has('api-descriptors')) {
                client.ws.send(
                    str({
                        type: 'descriptors',
                        payload: descriptors,
                    }),
                );
            }
        });

        this.sendWsResponse(client.ws, id, {
            success: true,
            payload: { subscribed: true },
        });

        // Send initial state
        this.serverApi!.enumerate().then(result => {
            if (result.success && client.subscriptions.has('api-descriptors')) {
                client.ws.send(
                    str({
                        type: 'descriptors',
                        payload: result.payload,
                    }),
                );
            }
        });
    }

    private async handleWsApiOpenDevice(ws: WebSocket, id: string, params: any) {
        try {
            // accept both `reset` (current) and legacy `first` flag (if provided)
            const { path } = params;
            const reset = params.reset ?? params.first ?? false;
            const result = await this.serverApi!.openDevice(path, { reset: !!reset });
            if (!result.success) {
                return this.sendWsError(ws, id, 'openDevice error', result.error);
            }
            this.sendWsResponse(ws, id, { success: true, payload: result.payload });
        } catch (err) {
            this.sendWsError(
                ws,
                id,
                'openDevice error',
                err instanceof Error ? err.message : 'Unknown error',
            );
        }
    }

    private async handleWsApiCloseDevice(ws: WebSocket, id: string, params: any) {
        try {
            const { path } = params;
            await this.serverApi!.closeDevice(path);
            this.sendWsResponse(ws, id, { success: true, payload: undefined });
        } catch (err) {
            this.sendWsError(
                ws,
                id,
                'closeDevice error',
                err instanceof Error ? err.message : 'Unknown error',
            );
        }
    }

    private async handleWsApiRead(ws: WebSocket, id: string, params: any) {
        try {
            const { path } = params;
            const result = await this.serverApi!.read(path);
            if (!result.success) {
                return this.sendWsError(ws, id, 'read error', result.error);
            }
            // Serialize Buffer as base64
            const payload = Buffer.isBuffer(result.payload)
                ? { type: 'Buffer', data: result.payload.toString('base64') }
                : result.payload;
            this.sendWsResponse(ws, id, { success: true, payload });
        } catch (err) {
            this.sendWsError(
                ws,
                id,
                'read error',
                err instanceof Error ? err.message : 'Unknown error',
            );
        }
    }

    private async handleWsApiWrite(ws: WebSocket, id: string, params: any) {
        try {
            const { path, buffer } = params;
            // Deserialize Buffer from base64 wrapper sent by client (param name 'buffer')
            const dataBuffer =
                buffer && typeof buffer === 'object' && buffer.type === 'Buffer'
                    ? Buffer.from(buffer.data, 'base64')
                    : buffer;
            if (!Buffer.isBuffer(dataBuffer)) {
                return this.sendWsError(ws, id, 'write error', 'Invalid buffer payload');
            }
            await this.serverApi!.write(path, dataBuffer);
            this.sendWsResponse(ws, id, { success: true, payload: undefined });
        } catch (err) {
            this.sendWsError(
                ws,
                id,
                'write error',
                err instanceof Error ? err.message : 'Unknown error',
            );
        }
    }

    private sendWsResponse(ws: WebSocket, id: string, response: any) {
        if (ws.readyState === WebSocket.OPEN) {
            const serializedResponse = this.serializeBuffers(response);
            ws.send(str({ id, ...serializedResponse }));
        }
    }

    private serializeBuffers(obj: any): any {
        if (Buffer.isBuffer(obj)) {
            return {
                type: 'Buffer',
                data: obj.toString('base64'),
            };
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.serializeBuffers(item));
        }
        if (obj && typeof obj === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.serializeBuffers(value);
            }
            return result;
        }
        return obj;
    }

    private deserializeBuffers(obj: any): any {
        if (
            obj &&
            typeof obj === 'object' &&
            obj.type === 'Buffer' &&
            typeof obj.data === 'string'
        ) {
            return Buffer.from(obj.data, 'base64');
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.deserializeBuffers(item));
        }
        if (obj && typeof obj === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.deserializeBuffers(value);
            }
            return result;
        }
        return obj;
    }

    /** Build structured debug snapshot for broadcast */
    private buildWsStatusDebug(app: HttpServer<any>) {
        const uptimeMs = Date.now() - this.startedAt;
        const sessionsDebug = sessionsBackground.getDebugInfo();
        return {
            intro: `To download full logs go to http://127.0.0.1:${app.getServerAddress().port}/logs`,
            version: this.version,
            bundledVersion: this.bundledVersion,
            serviceName: this.serviceName,
            port: app.getServerAddress().port,
            wsEndpoint: `ws://127.0.0.1:${app.getServerAddress().port}/ws`,
            startedAt: this.startedAt,
            uptimeMs,
            counts: {
                httpDescriptors: this.descriptors.length,
                sessionsDescriptors: this.sessionsDescriptors.length,
                wsClients: this.wsClients.size,
                listenSubscriptions: this.listenSubscriptions.length,
            },
            clients: Array.from(this.wsClients.values()).map(c => ({
                origin: (c.ws as any)._socket?.remoteAddress,
                isAlive: c.isAlive,
                subscriptions: Array.from(c.subscriptions),
            })),
            descriptors: {
                http: this.descriptors,
                sessions: this.sessionsDescriptors,
                // api: apiDescriptorsPromise,
            },
            devices: this.descriptors,
            logs: this.logger.getLog(),
            sessions: sessionsDebug,
        };
    }

    private sendWsError(ws: WebSocket, id: string, error: string, message?: string) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(str({ id, success: false, error, message }));
        }
    }

    private setupWsHeartbeat(client: WebSocketClient) {
        client.isAlive = true;
        client.ws.on('pong', () => {
            client.isAlive = true;
        });
    }

    private checkOriginForWebSocket(req: IncomingMessage): boolean {
        return checkOrigin({
            request: req as any,
            allowedOrigin: [
                'sldev.cz',
                'trezor.io',
                'localhost',
                '127.0.0.1',
                'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
            ],
            pathname: req.url || '',
            logger: this.logger,
        });
    }

    private createWebSocketServer(httpServer: HttpServer<never>): WebSocketServer {
        const wss = new WebSocketServer({
            noServer: true, // We'll handle upgrade manually
        });

        // Handle WebSocket upgrade on the HTTP server
        httpServer.server?.on('upgrade', (request, socket, head) => {
            // Only upgrade on /ws path
            if (request.url === '/ws') {
                if (!this.checkOriginForWebSocket(request)) {
                    this.logger.debug(`websocket: origin rejected: ${request.headers.origin}`);
                    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                    socket.destroy();
                    return;
                }

                wss.handleUpgrade(request, socket, head, ws => {
                    wss.emit('connection', ws, request);
                });
            } else {
                socket.destroy();
            }
        });

        wss.on('connection', (ws: WebSocket) => {
            this.logger?.debug('websocket: new client connected');

            const client: WebSocketClient = {
                ws,
                isAlive: true,
                subscriptions: new Set(),
            };

            this.wsClients.set(ws, client);
            this.setupWsHeartbeat(client);

            // send initial snapshot immediately so UI doesn't wait for interval
            try {
                const snapshot = this.buildWsStatusDebug(httpServer);
                ws.send(str({ type: 'bridge-status', payload: snapshot }));
            } catch {}

            ws.on('message', data => {
                this.handleWsMessage(client, data);
            });

            ws.on('close', () => {
                this.logger?.debug('websocket: client disconnected');
                this.wsClients.delete(ws);
            });

            ws.on('error', error => {
                this.logger?.error('websocket: connection error', error);
                this.wsClients.delete(ws);
            });
        });

        // Heartbeat interval
        const heartbeatInterval = setInterval(() => {
            this.wsClients.forEach((client, ws) => {
                if (!client.isAlive) {
                    this.wsClients.delete(ws);
                    return ws.terminate();
                }

                client.isAlive = false;
                ws.ping();
            });
        }, 30000);

        wss.on('close', () => {
            clearInterval(heartbeatInterval);
        });

        return wss;
    }

    private startStatusBroadcast(app: HttpServer<any>) {
        // broadcast rich status snapshot periodically
        this.statusBroadcastInterval = setInterval(() => {
            const snapshot = this.buildWsStatusDebug(app);
            const message = str({ type: 'bridge-status', payload: snapshot });
            this.wsClients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    try {
                        client.ws.send(message);
                    } catch {
                        /* ignore */
                    }
                }
            });
        }, 2000);
    }

    public stop() {
        // send empty descriptors (imitate that all devices have disconnected)
        this.resolveListenSubscriptions([]);

        // Close all WebSocket connections
        this.wsClients.forEach((_client, ws) => {
            ws.close();
        });
        this.wsClients.clear();

        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
            this.wss = undefined;
        }
        if (this.statusBroadcastInterval) {
            clearInterval(this.statusBroadcastInterval);
            this.statusBroadcastInterval = undefined;
        }

        this.throttler.dispose();
        this.legacyBridge.dispose();

        return Promise.all(this.server.map(server => server.stop())).finally(() => {
            this.server = [];
            this.logger.info('Trezor Bridge HTTP server stopped');
        });
    }

    public async status() {
        const running = await fetch(`http://127.0.0.1:${this.port ?? this.requestedPort}/`)
            .then(resp => resp.ok)
            .catch(() => false);

        return {
            service: running,
            process: Boolean(this.server[0]),
        };
    }

    // compatibility with "BridgeProcess" type
    public startDev() {
        return this.start();
    }

    // compatibility with "BridgeProcess" type
    public startTest() {
        return this.start();
    }
}
