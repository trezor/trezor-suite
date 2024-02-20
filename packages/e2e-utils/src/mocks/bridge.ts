// @ts-nocheck
/* eslint-disable no-console */

import express from 'express';
import { EventEmitter } from 'events';

const port = 21325;
const listenTimeout = 10000;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock implementation of Trezor Bridge service intended to be used in e2e tests.
 * Why?
 * - there is no emulator for bootloader
 */
export class TrezorBridgeMock extends EventEmitter {
    constructor(recordedBridgeCommunication?: any) {
        super();
        const app = express();

        this.requests = recordedBridgeCommunication || [];

        app.use(async (req, res, next) => {
            console.log(`[mocked bridge] handling request ${req.url}`);

            // some delay to mimic real behavior. could be lower maybe
            await delay(200);

            const firstIndex = this.requests.findIndex(item => item.request.url === req.url);
            const first = this.requests[firstIndex];
            this.requests.splice(firstIndex, 1);

            if (!first) {
                console.log('[mocked bridge] no request found');

                return;
            }

            first.response.headers.forEach(header => {
                res.set(header.name, header.value);
            });

            if (req.url === '/listen') {
                // timeout to simulate device reconnection. if 'descriptors' events is not triggered
                // in time it is triggered anyway simulating device reconnection
                const timeout = setTimeout(() => {
                    if (this.requests.length > 0) {
                        this.emit('descriptorsChanged');
                    }
                }, listenTimeout);

                this.on('descriptorsChanged', value => {
                    console.log(
                        '[mocked bridge] resolving listen with response: ',
                        first.response.content.text,
                    );
                    clearTimeout(timeout);
                    this.removeAllListeners('descriptorsChanged');
                    console.log(`[mocked bridge] response for request ${req.url}`);
                    res.send(first.response.content.text);
                });

                return;
            }

            console.log(`[mocked bridge] response for request ${req.url}`);
            res.send(first.response.content.text);

            console.log('[mocked bridge] urls left in buffer: ', this.requests.length);

            // endpoints that we know that trigger response to /listen
            if (
                // acquire (prev session null)
                req.url.endsWith('null') ||
                // release
                req.url.includes('release')
                // todo: probably also "force acquire?" but we don't use it anywhere in tests yet
            ) {
                this.emit('descriptorsChanged');
            }
        });

        this.app = app;
    }

    start(fakeBridgeCommunication) {
        this.requests = fakeBridgeCommunication;
        if (this.listenTimeout) {
            clearTimeout(this.listenTimeout);
        }

        if (this.running) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.app.listen(port, server => {
                console.log(`[mocked bridge] listening at http://localhost:${port}`);
                this.running = true;
                this.server = server;
                resolve();
            });
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}
