import fs from 'fs';
import path from 'path';
import url from 'url';

import { HttpServer, parseBodyJSON, parseBodyText, Handler } from '@trezor/node-utils';
import { Descriptor } from '@trezor/transport/src/types';
import { Log, arrayPartition } from '@trezor/utils';

import { sessionsClient, createApi } from './core';

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
        descriptors: string;
        req: Parameters<Handler>[0];
        res: Parameters<Handler>[1];
    }[];
    port: number;
    server?: HttpServer<never>;
    api: ReturnType<typeof createApi>;
    logger = new Log('@trezor/transport-bridge', true);
    assetPrefix: string;

    constructor({
        port,
        api,
        assetPrefix = '',
    }: {
        port: number;
        api: 'usb' | 'udp';
        assetPrefix?: string;
    }) {
        this.port = port || defaults.port;

        this.descriptors = [];

        this.listenSubscriptions = [];

        // whenever sessions module reports changes to descriptors (including sessions), resolve affected /listen subscriptions
        sessionsClient.on('descriptors', descriptors => {
            this.resolveListenSubscriptions(descriptors);
        });
        this.api = createApi(api, this.logger);
        this.assetPrefix = assetPrefix;
    }

    private resolveListenSubscriptions(descriptors: Descriptor[]) {
        this.descriptors = descriptors;
        const [affected, unaffected] = arrayPartition(
            this.listenSubscriptions,
            subscription => subscription.descriptors !== JSON.stringify(this.descriptors),
        );
        affected.forEach(subscription => {
            subscription.res.end(str(this.descriptors));
        });
        this.listenSubscriptions = unaffected;
    }

    public start() {
        return new Promise<void>(resolve => {
            this.logger.info('Starting Trezor Bridge HTTP server');
            const app = new HttpServer({
                port: this.port,
                logger: this.logger,
            });

            app.use([
                (_req, res, next) => {
                    // todo: limit to whitelisted domains
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    next(_req, res);
                },
            ]);

            app.post('/enumerate', [
                (_req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    this.api.enumerate().then(result => {
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
                    this.api
                        .acquire({ path: req.params.path, previous: req.params.previous })
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
                    this.api
                        .release({
                            session: req.params.session,
                            // @ts-expect-error
                            path: req.body,
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
                    this.api
                        .call({
                            session: req.params.session,
                            // @ts-expect-error
                            data: req.body,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(str({ error: result.error }));
                            }
                            res.end(str(result.payload));
                        });
                },
            ]);

            app.post('/read/:session', [
                parseBodyJSON,
                (req, res) => {
                    this.api.receive({ session: req.params.session }).then(result => {
                        if (!result.success) {
                            res.statusCode = 400;

                            return res.end(str({ error: result.error }));
                        }
                        res.end(str(result.payload));
                    });
                },
            ]);

            app.post('/post/:session', [
                parseBodyText,
                (req, res) => {
                    this.api
                        .send({
                            session: req.params.session,
                            // @ts-expect-error
                            data: req.body,
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
                async (_req, res) => {
                    const enumerateResult = await this.api.enumerate();

                    const props = {
                        intro: `To download full logs go to http://127.0.0.1:${this.port}/logs`,
                        version: this.version,
                        devices: enumerateResult.success ? enumerateResult.payload.descriptors : [],
                        logs: app.logger.getLog().slice(-20),
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

            app.post('/', [
                (_req, res) => {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(
                        str({
                            version: this.version,
                        }),
                    );
                },
            ]);

            app.start().then(() => {
                this.server = app;
                resolve();
            });
        });
    }

    public stop() {
        // send empty descriptors (imitate that all devices have disconnected)
        this.resolveListenSubscriptions([]);
        this.server?.stop();
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
