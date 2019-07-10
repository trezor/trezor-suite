import WebSocket, { Server } from 'ws';
import * as assert from 'assert';
import getFreePort from './freePort';
import defaultBlockbookResponses from './fixtures/blockbook';
import defaultRippleResponses from './fixtures/ripple';

const RESPONSES = {
    blockbook: defaultBlockbookResponses,
    ripple: defaultRippleResponses,
};

const create = async type => {
    const port = await getFreePort();
    const server = new Server({ port, noServer: true });
    const { close } = server;
    const defaultResponses = RESPONSES[type];
    const connections = [];
    let addresses;

    const sendResponse = request => {
        const { id } = request;
        const { fixtures } = server;
        const method = type === 'blockbook' ? request.method : request.command;
        let data;
        if (Array.isArray(fixtures)) {
            const fid = fixtures.findIndex(f => f && f.method === method);
            if (fid >= 0) {
                data = fixtures[fid].response;
                delete fixtures[fid];
            }
        }
        if (!data) {
            data = defaultResponses[method] || {
                error: { message: `unknown response for ${method}` },
            };
        }

        connections.forEach(c => {
            c.send(JSON.stringify({ ...data, id }));
        });
    };

    const processRequest = json => {
        try {
            const request = JSON.parse(json);
            if (!request) {
                throw new Error('Unknown request');
            }
            // console.log('REQUEST', request);
            if (type === 'blockbook') {
                if (typeof request.method !== 'string') {
                    throw new Error('Unknown blockbook request without method');
                }
                server.emit(`blockbook_${request.method}`, request);
            } else if (type === 'ripple') {
                if (typeof request.command !== 'string') {
                    throw new Error('Unknown ripple request without command');
                }
                server.emit(`ripple_${request.command}`, request);
            }
        } catch (error) {
            assert(false, error.message);
        }
    };

    server.on('connection', ws => {
        ws.once('close', () => {
            connections.splice(connections.indexOf(ws), 1);
        });
        connections.push(ws);
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
        addresses = request.params.addresses; // eslint-disable-line prefer-destructuring
        sendResponse(request);
    });

    server.on('blockbook_unsubscribeAddresses', request => {
        addresses = undefined;
        sendResponse(request);
    });

    // Ripple

    server.on('ripple_subscribe', request => {
        if (Array.isArray(request.accounts_proposed)) {
            if (!Array.isArray(addresses)) {
                addresses = [];
            }
            addresses = addresses.concat(request.accounts_proposed);
        }
        sendResponse(request);
    });
    server.on('ripple_unsubscribe', request => {
        if (!Array.isArray(addresses)) {
            sendResponse(request);
            return;
        }
        if (Array.isArray(request.accounts_proposed)) {
            addresses = addresses.filter(a => request.accounts_proposed.indexOf(a) < 0);
            if (addresses.length === 0) addresses = undefined;
        }
        sendResponse(request);
    });
    server.on('ripple_server_info', request => sendResponse(request));
    server.on('ripple_account_info', request => sendResponse(request));
    server.on('ripple_account_tx', request => sendResponse(request));

    // Public methods

    server.setFixtures = f => {
        server.fixtures = f;
    };

    server.getAddresses = () => {
        return addresses;
    };

    server.close = () => {
        close.call(server);
    };

    server.sendNotification = async notification => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const ws = await connectToServer(server);
        const dfd = action =>
            new Promise(resolve => {
                const doSend = () => {
                    connections.forEach(c => {
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
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await receiveMessage(ws);
    };

    return server;
};

export default create;

const connectToServer = async server => {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${server.options.port}`);
        const dfd = ws.once('error', reject);
        ws.on('open', () => resolve(ws));
    });
};

const receiveMessage = async ws => {
    return new Promise(resolve => {
        ws.on('close', () => setTimeout(resolve, 100));
        // ws.on('close', resolve);
        ws.on('message', () => ws.close());
    });
};
