import fs from 'fs';
import path from 'path';
import url from 'url';
import stringify from 'json-stable-stringify';

import {
    HttpServer,
    allowOrigins,
    parseBodyJSON,
    parseBodyText,
    Handler,
    RequestWithParams,
    Response,
} from '@trezor/node-utils';
import { Descriptor, Session } from '@trezor/transport/src/types';
import { Log, arrayPartition, Throttler } from '@trezor/utils';
import { AbstractApi } from '@trezor/transport/src/api/abstract';

import { createCore } from './core';

const defaults = {
    port: 21325,
};

const str = (value: Record<string, any> | string) => JSON.stringify(value);

export class TrezordNode {
    /** versioning, baked in by webpack */
    version = '3.0.0';
    serviceName = 'trezord-node';
    /** last known descriptors state */
    descriptors: Descriptor[];
    /** pending /listen subscriptions that are supposed to be resolved whenever descriptors change is detected */
    listenSubscriptions: {
        descriptors: Descriptor[];
        req: Parameters<Handler>[0];
        res: Parameters<Handler>[1];
    }[];
    port: number;
    server?: HttpServer<never>;
    core: ReturnType<typeof createCore>;
    logger: Log;
    assetPrefix: string;
    throttler = new Throttler(500);

    constructor({
        port,
        api,
        assetPrefix = '',
        logger,
    }: {
        port: number;
        api: 'usb' | 'udp' | AbstractApi;
        assetPrefix?: string;
        logger: Log;
    }) {
        this.port = port || defaults.port;
        this.logger = logger;
        this.descriptors = [];

        this.listenSubscriptions = [];

        this.core = createCore(api, this.logger);

        this.assetPrefix = assetPrefix;
    }

    private resolveListenSubscriptions(descriptors: Descriptor[]) {
        this.descriptors = descriptors;

        if (!this.listenSubscriptions.length) {
            return;
        }

        const [aborted, notAborted] = arrayPartition(this.listenSubscriptions, subscription => {
            return subscription.res.destroyed;
        });

        if (aborted.length) {
            this.logger?.debug(
                `http: resolving listen subscriptions. n of aborted subscriptions: ${aborted.length}`,
            );
        }

        const [affected, unaffected] = arrayPartition(notAborted, subscription => {
            return stringify(subscription.descriptors) !== stringify(this.descriptors);
        });

        this.logger?.debug(
            `http: affected subscriptions ${affected.length}. unaffected subscriptions ${unaffected.length}`,
        );

        affected.forEach(subscription => {
            subscription.res.end(str(this.descriptors));
        });
        this.listenSubscriptions = unaffected;
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

    private handleInfo(_req: RequestWithParams, res: Response) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(
            str({
                version: this.version,
            }),
        );
    }

    public start() {
        // whenever sessions module reports changes to descriptors (including sessions), resolve affected /listen subscriptions
        this.core.sessionsClient.on('descriptors', descriptors => {
            this.logger?.debug(
                `http: sessionsClient reported descriptors: ${JSON.stringify(descriptors)}`,
            );
            this.throttler.throttle('resolve-listen-subscriptions', () => {
                return this.resolveListenSubscriptions(descriptors);
            });
        });

        return new Promise<void>(resolve => {
            this.logger.info('Starting Trezor Bridge HTTP server');
            const app = new HttpServer({
                port: this.port,
                logger: this.logger,
            });

            app.use([
                (req, res, next, context) => {
                    // directly navigating to status page of bridge in browser. when request is not issued by js, there is no origin header
                    if (
                        !req.headers.origin &&
                        req.headers.host &&
                        [`127.0.0.1:${this.port}`, `localhost:${this.port}`].includes(
                            req.headers.host,
                        )
                    ) {
                        next(req, res);
                    } else {
                        allowOrigins(['https://sldev.cz', 'https://trezor.io', 'http://localhost'])(
                            req,
                            res,
                            next,
                            context,
                        );
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

                            return res.end(str({ error: result.error }));
                        }
                        res.end(str(result.payload.descriptors));
                    });
                },
            ]);

            app.post('/listen', [
                parseBodyJSON,
                (req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    this.listenSubscriptions.push({
                        // todo: type in that if parseBodyText was called as previous handler, req.body is string. is that even possible
                        // @ts-expect-error
                        descriptors: req.body,
                        req,
                        res,
                    });
                },
            ]);

            app.post('/acquire/:path/:previous', [
                (req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    const signal = this.createAbortSignal(res);
                    this.core
                        .acquire({
                            path: req.params.path,
                            previous: req.params.previous as Session | 'null',
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(str({ error: result.error }));
                            }
                            res.end(str({ session: result.payload.session }));
                        });
                },
            ]);

            app.post('/release/:session', [
                parseBodyText,
                (req, res) => {
                    this.core
                        .release({
                            session: req.params.session as Session,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(str({ error: result.error }));
                            }
                            res.end(str({ session: req.params.session }));
                        });
                },
            ]);

            app.post('/call/:session', [
                parseBodyText,
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.core
                        .call({
                            session: req.params.session as Session,
                            // @ts-expect-error
                            data: req.body,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(str({ error: result.error }));
                            }
                            res.end(result.payload);
                        });
                },
            ]);

            app.post('/read/:session', [
                parseBodyJSON,
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.core
                        .receive({ session: req.params.session as Session, signal })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(str({ error: result.error }));
                            }

                            res.end(result.payload);
                        });
                },
            ]);

            app.post('/post/:session', [
                parseBodyText,
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.core
                        .send({
                            session: req.params.session as Session,
                            // @ts-expect-error
                            data: req.body,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(str({ error: result.error }));
                            }
                            res.end();
                        });
                },
            ]);

            app.get('/', [
                (_req, res) => {
                    res.writeHead(301, {
                        Location: `http://127.0.0.1:${this.port}/status`,
                    });
                    res.end();
                },
            ]);

            app.get('/status', [
                (_req, res) => {
                    try {
                        const ui = fs.readFileSync(
                            path.join(__dirname, this.assetPrefix, 'ui/index.html'),
                            'utf-8',
                        );

                        res.writeHead(200, { 'Content-Type': 'text/html' });

                        res.end(ui);
                    } catch (error) {
                        this.logger.error('Failed to fetch status page', error);
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        // you need to run yarn workspace @trezor/transport-bridge build:ui to make it available (or build:lib will do)
                        res.end('Failed to fetch status page');
                    }
                },
            ]);

            app.get('/status-data', [
                (_req, res) => {
                    const props = {
                        intro: `To download full logs go to http://127.0.0.1:${this.port}/logs`,
                        version: this.version,
                        devices: this.descriptors,
                        logs: this.logger.getLog(),
                    };

                    res.end(str(props));
                },
            ]);

            app.get('/ui', [
                (req, res) => {
                    const parsedUrl = url.parse(req.url);

                    let pathname = path.join(__dirname, this.assetPrefix, parsedUrl.pathname!);

                    const map: Record<string, string> = {
                        '.ico': 'image/x-icon',
                        '.html': 'text/html',
                        '.js': 'text/javascript',
                        '.json': 'application/json',
                        '.css': 'text/css',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.svg': 'image/svg+xml',
                    };

                    const { ext } = path.parse(pathname);

                    fs.exists(pathname, exist => {
                        if (!exist) {
                            // if the file is not found, return 404
                            res.statusCode = 404;
                            res.end(`File ${pathname} not found!`);

                            return;
                        }

                        // if is a directory search for index file matching the extension
                        if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

                        // read file from file system
                        fs.readFile(pathname, (err, data) => {
                            if (err) {
                                res.statusCode = 500;
                                res.end(`Error getting the file: ${err}.`);
                            } else {
                                // if the file is found, set Content-type and send data
                                res.setHeader('Content-type', map[ext] || 'text/plain');
                                res.end(data);
                            }
                        });
                    });
                },
            ]);

            app.get('/logs', [
                (_req, res) => {
                    res.writeHead(200, {
                        'Content-Type': 'text/plain',
                        'Content-Disposition': 'attachment; filename=trezor-bridge.txt',
                    });
                    res.end(
                        app.logger
                            .getLog()
                            .map(l => l.message.join('. '))
                            .join('.\n'),
                    );
                },
            ]);

            app.post('/', [this.handleInfo.bind(this)]);

            app.post('/configure', [this.handleInfo.bind(this)]);

            app.start().then(() => {
                this.server = app;
                resolve();
            });
        });
    }

    public stop() {
        // send empty descriptors (imitate that all devices have disconnected)
        this.resolveListenSubscriptions([]);
        this.throttler.dispose();
        this.core.sessionsClient.removeAllListeners('descriptors');
        this.core.dispose();

        return this.server?.stop();
    }

    public async status() {
        const running = await fetch(`http://127.0.0.1:${this.port}/`)
            .then(resp => resp.ok)
            .catch(() => false);

        return {
            service: running,
            process: running,
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
