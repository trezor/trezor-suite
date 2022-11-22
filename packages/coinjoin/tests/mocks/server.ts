import * as net from 'net';
import * as http from 'http';

import { DEFAULT_ROUND, FEE_RATE_MEDIANS } from '../fixtures/round.fixture';

// Mock coordinator and middleware responses

const DEFAULT = {
    // middleware
    'analyze-transaction': {
        results: [],
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
        roundStates: [DEFAULT_ROUND],
        coinJoinFeeRateMedians: FEE_RATE_MEDIANS,
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
    'output-registration': '',
    'ready-to-sign': '',
    'transaction-signature': '',
    'input-unregistration': '',
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

    if (testResponse) {
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(testResponse));
        res.end();
        return;
    }

    const url = req.url?.split('/').pop();
    const data = DEFAULT[url as keyof typeof DEFAULT] ?? {};
    if (typeof data === 'string') {
        // not all coordinator responses are in json format
        res.setHeader('Content-Type', 'text/xml');
        res.write(data);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(data));
    }

    res.end();
};

const rejectRequest = (res: http.ServerResponse, code: number, error?: any) => {
    if (res.writableEnded) return;

    res.statusCode = code;
    try {
        const json = JSON.stringify(error);
        res.setHeader('Content-Type', 'application/json');
        res.write(json);
    } catch (e) {
        res.write(error ?? '');
    }
    res.end();
};

interface TestRequest {
    url: string;
    data: any;
    request: http.IncomingMessage;
    response: http.ServerResponse;
    resolve: (fn?: any) => void;
    reject: (code: number, error?: any) => void;
}

interface MockedServerEvents {
    (ev: 'test-request', listener: (r: TestRequest) => void): any;
    (ev: 'test-handle-request', listener: (...args: any[]) => void): any;
    (event: string, listener: (...args: any[]) => void): any;
}

export interface MockedServer extends Exclude<http.Server, 'addListener'> {
    requestOptions: {
        network: any;
        coordinatorName: string;
        coordinatorUrl: string;
        middlewareUrl: string;
        signal: AbortSignal;
        log: (message: string) => any;
    };
    addListener: MockedServerEvents;
}

export const createServer = async () => {
    const port = await getFreePort();
    const server = http.createServer((request, response) => {
        server.emit('test-handle-request', request);
        if (server.listenerCount('test-request') > 0) {
            let data = '';
            request.on('data', chunk => {
                data += chunk;
            });
            request.on('end', () => {
                const event: TestRequest = {
                    url: request.url || '',
                    data: JSON.parse(data),
                    request,
                    response,
                    resolve: responseData => handleRequest(request, response, responseData),
                    reject: (code, error) => rejectRequest(response, code, error),
                };
                server.emit('test-request', event);
            });
        } else {
            handleRequest(request, response);
        }
    }) as MockedServer;
    server.listen(port);

    server.requestOptions = {
        network: 'test',
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        coordinatorUrl: `http://localhost:${port}/`,
        middlewareUrl: `http://localhost:${port}/`,
        signal: new AbortController().signal,
        log: () => {},
    };

    return server;
};
