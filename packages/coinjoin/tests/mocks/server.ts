import * as net from 'net';
import * as http from 'http';

import { DEFAULT_ROUND, FEE_RATE_MEDIANS } from '../fixtures/round.fixture';

// Mock coordinator and middleware responses

type RequestData = Record<string, any>;

const DEFAULT = {
    // middleware
    'get-anonymity-scores': {
        results: [],
    },
    'select-inputs-for-round': {
        indices: [],
    },
    'get-real-credential-requests': (data?: RequestData): RequestData => {
        if (!data || !data.amountsToRequest) {
            return { realCredentialRequests: {} };
        }
        return {
            realCredentialRequests: {
                credentialsRequest: {
                    delta: data.amountsToRequest[0],
                    presented: data.credentialsToPresent,
                    requested: data.amountsToRequest,
                },
            },
        };
    },
    'get-zero-credential-requests': {
        zeroCredentialRequests: {
            credentialsRequest: {
                delta: 0,
                presented: [],
                requested: [{ ma: '00' }, { ma: '01' }],
                proofs: [{}, {}],
            },
            credentialsResponseValidation: {
                presented: [],
                requested: [
                    { ma: '00', value: 0 },
                    { ma: '01', value: 0 },
                ],
            },
        },
    },
    'get-credentials': (data?: RequestData): RequestData => {
        if (!data || !data.credentialsResponse) {
            return { credentials: [{}, {}] };
        }
        return {
            credentials: data.credentialsResponse,
        };
    },
    'get-outputs-amounts': { outputAmounts: [] },
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
    'credential-issuance': (data?: RequestData): RequestData => {
        if (!data || !data.realAmountCredentialRequests) {
            return {};
        }
        return {
            realAmountCredentials: data.realAmountCredentialRequests.requested.map((a: number) => ({
                value: a,
            })),
            realVsizeCredentials: data.realVsizeCredentialRequests.requested.map((a: number) => ({
                value: a,
            })),
            zeroAmountCredentials: data.zeroAmountCredentialRequests.requested.map(() => ({
                value: 0,
            })),
            zeroVsizeCredentials: data.zeroVsizeCredentialsRequests.requested.map(() => ({
                value: 0,
            })),
        };
    },
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

const readRequest = (request: http.IncomingMessage) =>
    new Promise<RequestData>(resolve => {
        let data = '';
        request.on('data', chunk => {
            data += chunk;
        });
        request.on('end', () => {
            resolve(JSON.parse(data));
        });
    });

const handleRequest = (
    request: http.IncomingMessage,
    response: http.ServerResponse,
    requestData: RequestData,
    testResponse?: RequestData,
) => {
    if (response.writableEnded) return; // send default response if res.end wasn't called in test

    if (testResponse) {
        response.setHeader('Content-Type', 'application/json');
        response.write(JSON.stringify(testResponse));
        response.end();
        return;
    }

    const url = request.url?.split('/').pop();
    const defaultResponse = DEFAULT[url as keyof typeof DEFAULT] ?? {};
    if (typeof defaultResponse === 'function') {
        const r = defaultResponse.call(null, requestData);
        response.setHeader('Content-Type', 'application/json');
        response.write(JSON.stringify(r));
    } else if (typeof defaultResponse === 'string') {
        // not all coordinator responses are in json format
        response.setHeader('Content-Type', 'text/xml');
        response.write(defaultResponse);
    } else {
        response.setHeader('Content-Type', 'application/json');
        response.write(JSON.stringify(defaultResponse));
    }

    response.end();
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
    data: RequestData;
    request: http.IncomingMessage;
    response: http.ServerResponse;
    resolve: (data?: RequestData) => void;
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
        // 1. emit "readonly" event
        server.emit('test-handle-request', request);
        // 2. read request data
        readRequest(request).then(requestData => {
            if (server.listenerCount('test-request') > 0) {
                const event: TestRequest = {
                    url: request.url || '',
                    data: requestData,
                    request,
                    response,
                    resolve: responseData =>
                        handleRequest(request, response, requestData, responseData),
                    reject: (code, error) => rejectRequest(response, code, error),
                };
                // 3a. emit "interactive" event
                server.emit('test-request', event);
            } else {
                // 3b. respond with default
                handleRequest(request, response, requestData);
            }
        });
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
