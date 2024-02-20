import * as net from 'net';
import * as http from 'http';

import { DEFAULT_ROUND, FEE_RATE_MEDIANS, AFFILIATE_INFO } from '../fixtures/round.fixture';
import { CoinjoinClientEvents } from '../../src/types/client';
import { Logger } from '../../src/types/logger';

// Mock coordinator and middleware responses

type RequestData = Record<string, any>;

const DEFAULT = {
    // middleware
    'get-anonymity-scores': {
        Results: [],
    },
    'select-inputs-for-round': {
        Indices: [],
    },
    'get-real-credential-requests': (data?: RequestData): RequestData => {
        if (!data || !data.AmountsToRequest) {
            return { RealCredentialRequests: {} };
        }

        return {
            RealCredentialRequests: {
                CredentialsRequest: {
                    Delta: data.AmountsToRequest[0],
                    Presented: data.CredentialsToPresent,
                    Requested: data.AmountsToRequest,
                },
            },
        };
    },
    'get-zero-credential-requests': {
        ZeroCredentialRequests: {
            CredentialsRequest: {
                Delta: 0,
                Presented: [],
                Requested: [{ Ma: '00' }, { Ma: '01' }],
                Proofs: [{}, {}],
            },
            CredentialsResponseValidation: {
                Presented: [],
                Requested: [
                    { Ma: '00', Value: 0 },
                    { Ma: '01', Value: 0 },
                ],
            },
        },
    },
    'get-credentials': (data?: RequestData): RequestData => {
        if (!data || !data.CredentialsResponse) {
            return { Credentials: [{}, {}] };
        }

        return {
            Credentials: data.CredentialsResponse,
        };
    },
    'get-outputs-amounts': { OutputAmounts: [] },
    'init-liquidity-clue': { RawLiquidityClue: null },
    'update-liquidity-clue': { RawLiquidityClue: null },
    'get-liquidity-clue': { LiquidityClue: 1 },
    // payment request server
    'payment-request': {
        recipient_name: 'trezor.io',
        signature: 'AA',
    },
    // coordinator
    'api/Software/versions': {
        ClientVersion: '0',
        BackenMajordVersion: '0',
        LegalDocumentsVersion: '0',
        Ww2LegalDocumentsVersion: '0',
        CommitHash: '000000',
    },
    status: {
        RoundStates: [DEFAULT_ROUND],
        CoinJoinFeeRateMedians: FEE_RATE_MEDIANS,
        AffiliateInformation: AFFILIATE_INFO,
    },
    'input-registration': {
        AliceId: Math.random().toString(),
    },
    'connection-confirmation': {
        RealAmountCredentials: {
            CredentialsRequest: {},
        },
        RealVsizeCredentials: {
            CredentialsRequest: {},
        },
    },
    'credential-issuance': (data?: RequestData): RequestData => {
        if (!data || !data.RealAmountCredentialRequests) {
            return {};
        }

        return {
            RealAmountCredentials: data.RealAmountCredentialRequests.Requested.map((a: number) => ({
                Value: a,
            })),
            RealVsizeCredentials: data.RealVsizeCredentialRequests.Requested.map((a: number) => ({
                Value: a,
            })),
            ZeroAmountCredentials: data.ZeroAmountCredentialRequests.Requested.map(() => ({
                Value: 0,
            })),
            ZeroVsizeCredentials: data.ZeroVsizeCredentialsRequests.Requested.map(() => ({
                Value: 0,
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
            resolve(data ? JSON.parse(data) : {});
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

    const url = request.url?.substring(1);
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
        wabisabiBackendUrl: string;
        coordinatorUrl: string;
        middlewareUrl: string;
        signal: AbortSignal;
        logger: Logger;
        setSessionPhase: (event: CoinjoinClientEvents['session-phase']) => void;
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

    const url = `http://localhost:${port}/`;

    server.requestOptions = {
        network: 'test',
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        wabisabiBackendUrl: url,
        coordinatorUrl: url,
        middlewareUrl: url,
        signal: new AbortController().signal,
        logger: {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
        },
        setSessionPhase: () => null,
    };

    return server;
};
