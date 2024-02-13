import { HttpServer, parseBodyJSON, parseBodyText, Handler } from '@trezor/node-utils';
import { Descriptor } from '@trezor/transport/src/types';
import { arrayPartition } from '@trezor/utils/lib/arrayPartition';

import { multiTransport } from './multi';
import { sessionsClient } from './core';

const defaults = {
    port: 21325,
};

const str = (value: Record<string, any> | string) => JSON.stringify(value);

export class TrezordNode {
    /** versioning, baked in by webpack */
    version = '3.0.0';
    commitHash = process.env.COMMIT_HASH || 'unknown';
    serviceName = 'trezord-node';
    /** last known descriptors state */
    descriptors: string;
    /** pending /listen subscriptions that are supposed to be resolved whenever descriptors change is detected */
    listenSubscriptions: {
        descriptors: string;
        req: Parameters<Handler>[0];
        res: Parameters<Handler>[1];
    }[];
    port: number;
    server?: HttpServer<never>;

    constructor({ port }: { port: number }) {
        this.port = port || defaults.port;

        this.descriptors = '{}';

        this.listenSubscriptions = [];

        multiTransport.transports.forEach(transport => {
            // whenever sessions module reports changes to descriptors (including sessions), resolve affected /listen subscriptions
            transport.sessionsClient.on('descriptors', descriptors => {
                console.log('multitransport, nextdescriptors', descriptors);

                console.log(
                    'multitransport pending subscriptiosns',
                    this.listenSubscriptions.map(d => d.descriptors),
                );
                this.resolveListenSubscriptions(descriptors);
            });
        });
    }

    private resolveListenSubscriptions(descriptors: Descriptor[]) {
        this.descriptors = JSON.stringify(descriptors);
        const [affected, unaffected] = arrayPartition(
            this.listenSubscriptions,
            subscription => subscription.descriptors !== this.descriptors,
        );
        affected.forEach(subscription => {
            subscription.res.end(this.descriptors);
        });
        this.listenSubscriptions = unaffected;
    }

    public start() {
        return new Promise<void>(resolve => {
            const app = new HttpServer({ port: this.port, logger: console });

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
                    multiTransport
                        .enumerate()
                        .then(result => {
                            console.log('enumerate result', result);
                            if (!result.success) {
                                throw new Error(result.error);
                            }
                            res.end(str(result.payload.descriptors));
                        })
                        .catch(err => {
                            res.end(str({ error: err.message }));
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
                    console.log('acquire req.params', req.params);
                    multiTransport
                        .acquire({
                            input: { path: req.params.path, previous: req.params.previous },
                        })
                        .promise.then(result => {
                            if (!result.success) {
                                return res.end(str({ error: result.error }));
                            }
                            res.end(str({ session: result.payload }));
                        });
                },
            ]);

            app.post('/release/:session', [
                parseBodyText,
                (req, res) => {
                    // todo:
                    // @ts-expect-error
                    multiTransport
                        .release({ session: req.params.session, path: req.body })
                        .promise.then(result => {
                            if (!result.success) {
                                return res.end(str({ error: result.error }));
                            }
                            res.end(str({ session: req.params.session }));
                        });
                },
            ]);

            app.post('/call/:session', [
                parseBodyText,
                (req, res) => {
                    sessionsClient
                        .getPathBySession({ session: req.params.session })
                        .then(result => {
                            const path = result.success ? result.payload.path : null;
                            console.log('result', result);
                            // todo:
                            // @ts-expect-error
                            multiTransport
                                .call({ session: req.params.session, data: req.body, path })
                                .promise.then(result => {
                                    if (!result.success) {
                                        return res.end(str({ error: result.error }));
                                    }
                                    res.end(str(result.payload));
                                });
                        });
                },
            ]);

            // app.post('/read/:session', [
            //     parseBodyJSON,
            //     (req, res) => {
            //         multiTransport.receive({ session: req.params.session }).then(result => {
            //             if (!result.success) {
            //                 return res.end(str({ error: result.error }));
            //             }
            //             res.end(str(result.payload));
            //         });
            //     },
            // ]);

            // app.post('/post/:session', [
            //     parseBodyJSON,
            //     (req, res) => {
            //         // todo:
            //         // @ts-expect-error
            //         multiTransport.send({ session: req.params.session, data: req.body }).then(result => {
            //             if (!result.success) {
            //                 return res.end(str({ error: result.error }));
            //             }
            //             res.end();
            //         });
            //     },
            // ]);

            app.get('/', [
                (_req, res) => {
                    res.end(`hello, I am bridge in node, version: ${this.version}`);
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
