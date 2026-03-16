import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';

import {
    HttpServer,
    type ParamsValidatorHandler,
    type RequestHandler,
    type RequestWithParams,
    type Response,
    parseBodyJSON,
    parseBodyText,
} from '@trezor/node-utils';
import { checkOrigin } from '@trezor/node-utils/src/http';
import { type AbstractApi } from '@trezor/transport/src/api/abstract';
import { SESSION_NOT_FOUND, UNEXPECTED_ERROR } from '@trezor/transport/src/errors';
import { type Descriptor, type PathPublic, type Session } from '@trezor/transport/src/types';
import { validateProtocolMessage } from '@trezor/transport/src/utils/bridgeProtocolMessage';
import { type Log, Throttler, arrayPartition } from '@trezor/utils';

import { createCore } from './core';

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
const ADDRESS = new URL('http://127.0.0.1');

export class TrezordNode {
    version = '3.2.1';
    bundledVersion?: string;
    serviceName = 'trezord-node';
    /** last known descriptors state */
    descriptors: Descriptor[];
    /** pending /listen subscriptions that are supposed to be resolved whenever descriptors change is detected */
    listenSubscriptions: {
        descriptors: Descriptor[];
        req: Parameters<RequestHandler<unknown, unknown>>[0];
        res: Response;
    }[];
    /** pending /call /read and /post sessions. can be aborted via /abort endpoint */
    private abortableSignals: { session: string; abort: () => void }[] = [];
    private readonly requestedPort: number;
    private port?: number;
    server: HttpServer<never>[] = [];
    core: ReturnType<typeof createCore>;
    logger: Log;
    assetPrefix: string;
    protocolMessages: boolean;
    throttler = new Throttler(500);

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
        this.descriptors = [];
        this.bundledVersion = bundledVersion;

        this.listenSubscriptions = [];

        this.core = createCore(api, this.logger);

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
        const [affected, unaffected] = arrayPartition(notAborted, subscription => {
            const currentState = new Map(this.descriptors.map(d => [d.path, d]));
            const changed = subscription.descriptors.some(d => {
                const current = currentState.get(d.path);
                if (!current) return true;

                currentState.delete(d.path);
                const fields = [
                    'id',
                    'type',
                    'session',
                    'sessionOwner',
                    'debugSession',
                    'vendor',
                    'product',
                ] as (keyof Descriptor)[];

                return fields.some(f => current[f] !== d[f]);
            });

            return changed || currentState.size > 0;
        });

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

    private createAbortSignal(res: Response, session?: string) {
        const abortController = new AbortController();
        const listener = () => {
            abortController.abort();
            res.removeListener('close', listener);
        };
        res.addListener('close', listener);

        if (session) {
            this.abortableSignals.push({
                session,
                abort: () => abortController.abort(),
            });
        }

        return abortController.signal;
    }

    private removeAbortableSignal(session: string) {
        this.abortableSignals = this.abortableSignals.filter(s => s.session !== session);
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
        // whenever sessions module reports changes to descriptors (including sessions), resolve affected /listen subscriptions
        this.core.sessionsClient.on('descriptors', descriptors => {
            this.logger?.debug(
                `http: sessionsClient reported descriptors: ${JSON.stringify(descriptors)}`,
            );
            this.throttler.throttle('resolve-listen-subscriptions', () =>
                this.resolveListenSubscriptions(descriptors),
            );
        });

        this.logger.info('Starting Trezor Bridge HTTP server');
        // for compatibility reasons, we start two servers sharing the same request handlers and state.
        // compatibility case 1:
        //   user still has the old bridge client (targeting port 21325), but he already runs the latest suite-desktop version. We need to make sure that bridge is still available on port 21325 -> we need 2 servers
        // compatibility case 2:
        //   user has the latest bridge client (checking all the possible ports), but he runs the old suite-desktop version. This is easy and does not require us to start 2 servers, bridge client will fallback to the old port.

        const primaryApp = new HttpServer({
            ports: [this.requestedPort],
            logger: this.logger,
            address: ADDRESS.hostname,
        });

        const compatibilityApp = new HttpServer({
            ports: [COMPATIBILITY_PORT],
            logger: this.logger,
            address: ADDRESS.hostname,
        });

        const bindHandlers = (app: HttpServer<any>) => {
            app.use([
                (req, res, next, context) => {
                    // directly navigating to status page of bridge in browser. when request is not issued by js, there is no origin header
                    if (
                        !req.headers.origin &&
                        req.headers.host &&
                        [
                            `${ADDRESS.hostname}:${app.getServerAddress().port}`,
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
                    this.core.enumerate({ signal }).then(result => {
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
                    this.core
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
                    this.core
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

            app.post('/abort/:session', [
                validateSessionParams,
                parseBodyText,
                (req, res) => {
                    let statusCode = 400;
                    this.abortableSignals.forEach(s => {
                        if (s.session === req.params.session) {
                            statusCode = 200;
                            s.abort();
                        }
                    });
                    this.removeAbortableSignal(req.params.session);

                    res.statusCode = statusCode;

                    return this.handleResponse(
                        res,
                        str(statusCode === 200 ? { success: true } : { error: SESSION_NOT_FOUND }),
                    );
                },
            ]);

            app.post('/call/:session', [
                validateSessionParams,
                parseBodyText,
                validateProtocolMessageBody(true, this.protocolMessages),
                (req, res) => {
                    const { session } = req.params;
                    const signal = this.createAbortSignal(res, session);
                    this.core
                        .call({
                            ...req.body,
                            session,
                            signal,
                        })
                        .then(result => {
                            this.removeAbortableSignal(session);
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
                    const { session } = req.params;
                    const signal = this.createAbortSignal(res, session);
                    this.core
                        .receive({
                            ...req.body,
                            session,
                            signal,
                        })
                        .then(result => {
                            this.removeAbortableSignal(session);
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
                    const { session } = req.params;
                    const signal = this.createAbortSignal(res, session);
                    this.core
                        .send({
                            ...req.body,
                            session,
                            signal,
                        })
                        .then(result => {
                            this.removeAbortableSignal(session);
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
                        Location: `${ADDRESS.origin}:${app.getServerAddress().port}/status`,
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
                            // todo: using npx tsx ./packages/transport-bridge/src/bin.ts
                            // will serve only the unbuilt template from src/ui folder instead from dist/ui folder
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

            app.get('/status-data', [
                async (_req, res) => {
                    const signal = this.createAbortSignal(res);
                    await this.core.enumerate({ signal });
                    const props = {
                        intro: `To download full logs go to ${ADDRESS.origin}:${app.getServerAddress().port}/logs`,
                        version: this.version,
                        bundledVersion: this.bundledVersion,
                        devices: this.descriptors,
                        logs: this.logger.getLog(),
                    };
                    res.appendHeader('Content-Type', 'application/json');
                    this.handleResponse(res, str(props));
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
        }

        return compatibilityAppRes.then(res => {
            if (res.success) {
                bindHandlers(compatibilityApp);
                this.server.push(compatibilityApp);

                if (!this.port) {
                    this.port = res.payload.port;
                }
            } else if (!primaryAppRes.success) {
                throw new Error(primaryAppRes.error); // -> neither compatibility, nor primary app started -> only this case means reject
            }
        });
    }

    public stop() {
        // send empty descriptors (imitate that all devices have disconnected)
        this.resolveListenSubscriptions([]);
        this.throttler.dispose();
        this.core.dispose();

        return Promise.all(this.server.map(server => server.stop())).finally(() => {
            this.server = [];
            this.logger.info('Trezor Bridge HTTP server stopped');
        });
    }

    public async status() {
        const running = await fetch(`${ADDRESS.origin}:${this.port ?? this.requestedPort}/`)
            .then(resp => resp.ok)
            .catch(() => false);

        return {
            service: running,
            process: Boolean(this.server[0]),
        };
    }

    // compatibility with "BridgeProcess" type
    public startTest() {
        return this.start();
    }
}
