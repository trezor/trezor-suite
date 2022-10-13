import * as net from 'net';
import * as http from 'http';

// Mock coordinator and middleware responses

const DEFAULT = {
    // middleware
    'analyze-transaction': {
        results: {},
    },
    'select-utxo-for-round': {
        indices: [],
    },
    'create-request': {
        realCredentialsRequestData: {},
    },
    'create-request-for-zero-amount': {
        zeroCredentialsRequestData: {
            credentialsRequest: {},
        },
    },
    'handle-response': {
        credentials: [{}, {}],
    },
    'decompose-amounts': { outputAmounts: [] },
    // payment request server
    'payment-request': {
        recipient_name: 'trezor.io',
        signature: 'AA',
    },
    // coordinator
    status: {
        roundStates: [],
    },
    'input-registration': {
        aliceId: Math.random().toString(),
    },
    'connection-confirmation': {
        realAmountCredentials: {
            credentialsRequest: {},
        },
        realVsizeCredentials: {
            credentialsRequest: {},
        },
    },
    'credential-issuance': {},
    'output-registration': {},
    'ready-to-sign': {},
    'transaction-signature': {},
};

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

const handleRequest = (req: http.IncomingMessage, res: http.ServerResponse, testResponse?: any) => {
    if (res.writableEnded) return; // send default response if res.end wasn't called in test

    res.setHeader('Content-Type', 'application/json');
    if (testResponse) {
        res.write(JSON.stringify(testResponse));
        res.end();
        return;
    }
    const url = req.url?.split('/').pop();
    const data = DEFAULT[url as keyof typeof DEFAULT] || {};
    res.write(JSON.stringify(data));
    res.end();
};

// export type Server = http.Server;
export interface Server extends http.Server {
    requestOptions: any;
}

export const createServer = async () => {
    const port = await getFreePort();
    const server = http.createServer((req, res) => {
        server.emit('test-handle-request', req);
        if (server.listenerCount('test-request') > 0) {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            });
            req.on('end', () => {
                server.emit(
                    'test-request',
                    {
                        url: req.url || '',
                        data: JSON.parse(data),
                    },
                    req,
                    res,
                );
            });
            // notify test and wait for the response
            req.on('test-response', (responseData: any) => {
                handleRequest(req, res, responseData);
            });
        } else {
            handleRequest(req, res);
        }
    });
    server.listen(port);

    // @ts-expect-error
    server.requestOptions = {
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        coordinatorUrl: `http://localhost:${port}/`,
        middlewareUrl: `http://localhost:${port}/`,
        signal: new AbortController().signal,
        log: () => {},
    };

    return server as Server;
};
