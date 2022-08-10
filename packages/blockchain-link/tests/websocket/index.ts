import * as WebSocket from 'ws';
import * as net from 'net';
import * as defaultBlockbookResponses from './fixtures/blockbook.json';
import * as defaultRippleResponses from './fixtures/ripple.json';
import * as defaultBlockfrostResponses from './fixtures/blockfrost.json';

const DEFAULT_RESPONSES = {
    blockbook: defaultBlockbookResponses,
    ripple: defaultRippleResponses,
    blockfrost: defaultBlockfrostResponses,
};

// enables parallelization using a free port
export const getFreePort = () =>
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

const connectToServer = (server: WebSocket.Server) =>
    new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${server.options.port}`);
        ws.once('error', reject);
        ws.on('open', () => resolve(ws));
    });

const receiveMessage = (ws: WebSocket) =>
    new Promise(resolve => {
        ws.on('close', () => setTimeout(resolve, 100));
        // ws.on('close', resolve);
        ws.on('message', () => ws.close());
    });

export class EnhancedServer extends WebSocket.Server {
    connections: WebSocket[] = [];
    fixtures: any;
    addresses: any;

    setFixtures(f?: any) {
        this.fixtures = f;
    }

    getAddresses() {
        return this.addresses;
    }

    close() {
        return new Promise(resolve => super.close.call(this, resolve));
    }

    async sendNotification(notification: any) {
        const ws = await connectToServer(this);
        const dfd = (action: any) =>
            new Promise<void>(resolve => {
                const doSend = () => {
                    this.connections.forEach(c => {
                        c.send(JSON.stringify(action));
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
            await Promise.all(notification.map(action => dfd(action)));
        } else {
            await dfd(notification);
        }
        await receiveMessage(ws);
    }
}

const createServer = async (type: keyof typeof DEFAULT_RESPONSES) => {
    const port = await getFreePort();
    const server = new EnhancedServer({ port });

    const defaultResponses = DEFAULT_RESPONSES[type];

    const sendResponse = (request: any) => {
        const { id } = request;
        const { fixtures } = server;
        const method = type === 'blockbook' ? request.method : request.command;
        let data: any;
        let delay = 0;

        if (Array.isArray(fixtures)) {
            // find nearest predefined fixture with this method
            const fid = fixtures.findIndex(f => f && f.method === method);
            if (fid >= 0) {
                data = fixtures[fid].response;
                if (typeof fixtures[fid].delay === 'number') {
                    delay = fixtures[fid].delay;
                }
                // remove from list
                fixtures.splice(fid, 1);
            }
        }

        if (!data) {
            // @ts-expect-error method: string
            data = defaultResponses[method] || {
                error: { message: `unknown response for ${method}` },
            };
        }

        if (delay) {
            setTimeout(() => {
                server.connections.forEach(c => {
                    c.send(JSON.stringify({ ...data, id }));
                });
            }, delay);
        } else {
            server.connections.forEach(c => {
                c.send(JSON.stringify({ ...data, id }));
            });
        }
    };

    const processRequest = (json: any) => {
        try {
            const request = JSON.parse(json);
            if (!request) {
                throw new Error('Unknown request');
            }
            if (type === 'blockbook') {
                if (typeof request.method !== 'string') {
                    throw new Error('Unknown blockbook request without method');
                }
                server.emit(`blockbook_${request.method}`, request);
            } else if (type === 'blockfrost') {
                if (typeof request.command !== 'string') {
                    throw new Error('Unknown blockfrost request without method');
                }

                server.emit(`blockfrost_${request.command}`, request);
            } else if (type === 'ripple') {
                if (typeof request.command !== 'string') {
                    throw new Error('Unknown ripple request without command');
                }
                server.emit(`ripple_${request.command}`, request);
            }
        } catch (error) {
            // throw new Error(error.message);
        }
    };

    server.on('connection', ws => {
        ws.once('close', () => {
            server.connections.splice(server.connections.indexOf(ws), 1);
        });
        server.connections.push(ws);
        ws.on('message', processRequest);
    });

    // Blockbook
    server.on('blockbook_getInfo', request => sendResponse(request));
    server.on('blockbook_getBlockHash', request => sendResponse(request));
    server.on('blockbook_getAccountInfo', request => sendResponse(request));
    server.on('blockbook_getAccountUtxo', request => sendResponse(request));
    server.on('blockbook_getTransaction', request => sendResponse(request));
    server.on('blockbook_getTransactionSpecific', request => sendResponse(request));
    server.on('blockbook_estimateFee', request => sendResponse(request));
    server.on('blockbook_sendTransaction', request => sendResponse(request));
    server.on('blockbook_subscribeNewBlock', request => sendResponse(request));
    server.on('blockbook_unsubscribeNewBlock', request => sendResponse(request));
    server.on('blockbook_subscribeAddresses', request => {
        server.addresses = request.params.addresses;
        sendResponse(request);
    });

    server.on('blockbook_unsubscribeAddresses', request => {
        server.addresses = undefined;
        sendResponse(request);
    });

    // Blockfrost
    server.on('blockfrost_GET_BLOCK', request => sendResponse(request));
    server.on('blockfrost_GET_SERVER_INFO', request => sendResponse(request));
    server.on('blockfrost_GET_ACCOUNT_INFO', request => sendResponse(request));
    server.on('blockfrost_ESTIMATE_FEE', request => sendResponse(request));
    server.on('blockfrost_GET_ACCOUNT_UTXO', request => sendResponse(request));
    server.on('blockfrost_GET_TRANSACTION', request => sendResponse(request));
    server.on('blockfrost_PUSH_TRANSACTION', request => sendResponse(request));
    server.on('blockfrost_SUBSCRIBE_ADDRESS', request => {
        server.addresses = request.params.addresses;
        sendResponse(request);
    });

    server.on('blockfrost_UNSUBSCRIBE_ADDRESS', request => {
        server.addresses = undefined;
        sendResponse(request);
    });
    server.on('blockfrost_SUBSCRIBE_BLOCK', request => sendResponse(request));
    server.on('blockfrost_UNSUBSCRIBE_BLOCK', request => sendResponse(request));

    // Ripple
    server.on('ripple_subscribe', request => {
        if (Array.isArray(request.accounts_proposed)) {
            if (!Array.isArray(server.addresses)) {
                server.addresses = [];
            }
            server.addresses = server.addresses.concat(request.accounts_proposed);
        }
        sendResponse(request);
    });
    server.on('ripple_unsubscribe', request => {
        if (!Array.isArray(server.addresses)) {
            sendResponse(request);
            return;
        }
        if (Array.isArray(request.accounts_proposed)) {
            server.addresses = server.addresses.filter(
                a => request.accounts_proposed.indexOf(a) < 0,
            );
            if (server.addresses.length === 0) server.addresses = undefined;
        }
        sendResponse(request);
    });

    server.on('ripple_server_info', request => sendResponse(request));
    server.on('ripple_account_info', request => sendResponse(request));
    server.on('ripple_account_tx', request => sendResponse(request));
    server.on('ripple_submit', request => sendResponse(request));
    server.on('ripple_tx', request => sendResponse(request));

    return new Promise<EnhancedServer>((resolve, reject) => {
        server.on('listening', () => resolve(server));
        server.on('error', error => reject(error));
    });
};

export default createServer;
