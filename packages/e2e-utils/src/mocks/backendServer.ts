import WebSocket from 'ws';
import * as net from 'net';

import { blockbook } from '../fixtures/blockbook';
import { blockfrost } from '../fixtures/blockfrost';
import { ripple } from '../fixtures/ripple';

const DEFAULT_RESPONSES = {
    blockbook,
    blockfrost,
    ripple,
};

export type BackendType = keyof typeof DEFAULT_RESPONSES;

export interface Fixture {
    method: string;
    response?: Record<string, any> | ((request: any) => Promise<Record<string, any>>);
    delay?: number;
    default?: boolean;
}

export interface PushNotification {
    delay?: number;
}

// enables parallelization using a free port
const getFreePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => {
                resolve(port);
            });
        });
    });

export class BackendWebsocketServerMock extends WebSocket.Server {
    backendType: BackendType;
    defaultResponses: Record<string, any> = {};
    fixtures?: Fixture[];

    constructor(
        options: WebSocket.ServerOptions & { backendType: BackendType },
        callback?: () => void,
    ) {
        super(options, callback);
        this.backendType = options.backendType;
        this.defaultResponses = DEFAULT_RESPONSES[options.backendType];

        this.on('connection', ws => {
            ws.on('message', data => this.processRequest(ws, data));
        });
    }

    static async create(backendType: BackendType) {
        const port = await getFreePort();

        return new Promise<BackendWebsocketServerMock>((resolve, reject) => {
            const server = new BackendWebsocketServerMock({ backendType, port });
            server.on('listening', () => resolve(server));
            server.on('error', error => reject(error));
        });
    }

    setFixtures(fixtures?: Fixture[]) {
        this.fixtures = fixtures;
    }

    getFixtures() {
        return this.fixtures;
    }

    clearMock() {
        this.fixtures = undefined;
    }

    stop() {
        this.clients.forEach(socket => {
            // Soft close
            socket.close();

            process.nextTick(() => {
                // @ts-expect-error
                if ([socket.OPEN, socket.CLOSING].includes(socket.readyState)) {
                    // Socket still hangs, hard close
                    socket.terminate();
                }
            });
        });
    }

    close() {
        return new Promise(resolve => super.close.call(this, resolve));
    }

    private processRequest(client: any, data: any) {
        try {
            const request = JSON.parse(data);
            if (!request) {
                throw new Error('Unknown request');
            }
            if (this.backendType === 'blockbook') {
                if (typeof request.method !== 'string') {
                    throw new Error('Unknown blockbook request without method');
                }
                // emit event for test case
                this.emit(`blockbook_${request.method}`, request);

                return this.sendResponse(client, request.method, request);
            }

            if (this.backendType === 'blockfrost') {
                if (typeof request.command !== 'string') {
                    throw new Error('Unknown blockfrost request without method');
                }
                this.emit(`blockfrost_${request.command}`, request);

                return this.sendResponse(client, request.command, request);
            }

            if (this.backendType === 'ripple') {
                if (typeof request.command !== 'string') {
                    throw new Error('Unknown ripple request without command');
                }
                this.emit(`ripple_${request.command}`, request);

                return this.sendResponse(client, request.command, request);
            }

            console.warn('wtf?', this, data);

            throw new Error(`Unknown backendType ${this.backendType}`);
        } catch (error) {
            console.error(`EnhancedServer.processRequest: ${error.message}`);
        }
    }

    private async sendResponse(client: any, method: string, request: any) {
        const { id } = request;
        const { fixtures } = this;

        let data: any;
        let delay = 0;

        if (Array.isArray(fixtures)) {
            // find nearest fixture with requested method
            const fixtureIndex = fixtures.findIndex(f => f && f.method === method);
            if (fixtureIndex >= 0) {
                const fixture = fixtures[fixtureIndex];
                if (typeof fixture.response === 'function') {
                    data = await fixture.response(request);
                } else {
                    data = fixture.response;
                }

                if (typeof fixture.delay === 'number') {
                    delay = fixture.delay;
                }

                // remove used fixture from the list
                if (!fixture.default) {
                    fixtures.splice(fixtureIndex, 1);
                }
            }
        }

        if (!data) {
            data = this.defaultResponses[method] || {
                error: { message: `unknown response for ${method}` },
            };
        }

        if (delay) {
            setTimeout(() => {
                client.send(JSON.stringify({ ...data, id }));
            }, delay);
        } else {
            client.send(JSON.stringify({ ...data, id }));
        }
    }

    async sendNotification(notification: PushNotification | PushNotification[]) {
        // open connection as client
        const client = await new Promise<WebSocket>((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${this.options.port}`);
            ws.once('error', reject);
            ws.on('open', () => resolve(ws));
        });

        // broadcast message to all opened connections
        const dfd = (action: PushNotification) =>
            new Promise<void>(resolve => {
                const doSend = () => {
                    this.clients.forEach(cli => {
                        cli.send(JSON.stringify(action));
                    });
                    resolve();
                };
                if (typeof action.delay === 'number') {
                    setTimeout(doSend, action.delay);
                } else {
                    doSend();
                }
            });

        if (Array.isArray(notification)) {
            await Promise.all(notification.map(dfd));
        } else {
            await dfd(notification);
        }

        // wait for received message
        await new Promise<void>(resolve => {
            client.on('close', () => setTimeout(resolve, 100));
            client.on('message', () => client.close());
        });
    }
}
