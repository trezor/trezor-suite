import express, { Express, Request, Response } from 'express';
import cors from 'cors';

import { arrayPartition } from '@trezor/utils/lib/arrayPartition';

import { Descriptor } from '../types';
import { sessionsClient, enumerate, acquire, release, call, send, receive } from './core';

const defaults = {
    port: 21325,
};

export class TrezordNode {
    /** versioning, baked in by webpack */
    version = '3.0.0';
    serviceName = 'trezord-node';
    /** last known descriptors state */
    descriptors: string;
    /** pending /listen subscriptions that are supposed to be resolved whenever descriptors change is detected */
    listenSubscriptions: {
        descriptors: string;
        req: Request;
        res: Response;
    }[];
    port: number;
    server: Express = express();

    constructor({ port }: { port: number }) {
        this.port = port || defaults.port;

        this.descriptors = '{}';

        this.listenSubscriptions = [];

        // whenever sessions module reports changes to descriptors (including sessions), resolve affected /listen subscriptions
        sessionsClient.on('descriptors', descriptors => {
            this.resolveListenSubscriptions(descriptors);
        });
    }

    private resolveListenSubscriptions(descriptors: Descriptor[]) {
        this.descriptors = JSON.stringify(descriptors);

        const [affected, unaffected] = arrayPartition(
            this.listenSubscriptions,
            subscription => subscription.descriptors !== this.descriptors,
        );
        affected.forEach(subscription => {
            subscription.res.send(this.descriptors);
        });
        this.listenSubscriptions = unaffected;
    }

    public start() {
        return new Promise<void>(resolve => {
            console.log(`starting ${this.serviceName}, version: ${this.version}}`);

            const app = express();

            // todo: limit to whitelisted domains
            app.use(cors());

            app.get('/', (_req, res) => {
                res.send(`hello, I am bridge in node, version: ${this.version}`);
            });

            app.post('/', (_req, res) => {
                res.set('Content-Type', 'text/plain');

                res.send({
                    version: this.version,
                });
            });

            app.post('/enumerate', (_req, res) => {
                res.set('Content-Type', 'text/plain');
                enumerate()
                    .then(result => {
                        if (!result.success) {
                            throw new Error(result.error);
                        }
                        res.send(result.payload.descriptors);
                    })
                    .catch(err => {
                        res.send({ error: err.message });
                    });
            });

            app.post('/listen', express.json(), (req, res) => {
                res.set('Content-Type', 'text/plain');

                this.listenSubscriptions.push({
                    descriptors: JSON.stringify(req.body),
                    req,
                    res,
                });
            });

            app.post('/acquire/:path/:previous', express.json(), (req, res) => {
                res.set('Content-Type', 'text/plain');

                acquire({ path: req.params.path, previous: req.params.previous }).then(result => {
                    if (!result.success) {
                        return res.send({ error: result.error });
                    }
                    res.send({ session: result.payload.session });
                });
            });

            app.post('/release/:session', express.json(), (req, res) => {
                release({ session: req.params.session, path: req.body }).then(result => {
                    if (!result.success) {
                        return res.send({ error: result.error });
                    }
                    res.send({ session: req.params.session });
                });
            });

            app.post('/call/:session', express.text(), (req, res) => {
                res.set('Content-Type', 'text/plain');
                call({ session: req.params.session, data: req.body }).then(result => {
                    if (!result.success) {
                        return res.send({ error: result.error });
                    }
                    res.send(result.payload);
                });
            });

            app.post('/read/:session', (req, res) => {
                receive({ session: req.params.session }).then(result => {
                    if (!result.success) {
                        return res.send({ error: result.error });
                    }
                    res.send(result.payload);
                });
            });

            app.post('/post/:session', express.text(), (req, res) => {
                send({ session: req.params.session, data: req.body }).then(result => {
                    if (!result.success) {
                        return res.send({ error: result.error });
                    }
                    res.send();
                });
            });

            app.listen(this.port, () => {
                resolve();
            });
        });
    }

    public stop() {}
}
