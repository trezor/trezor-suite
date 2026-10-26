import * as http from 'http';

import { type Logger, noopLogger } from '@trezor/logger';
import { getFreePort } from '@trezor/node-utils';
import {
    deserializeCredentialsRequest,
    serializeCredentialsResponse,
} from '@trezor/wabisabi-crypto';
import { type CredentialIssuer } from '@trezor/wabisabi-crypto/src/testing';

import {
    AMOUNT_CREDENTIAL_ISSUER_PARAMETERS,
    VSIZE_CREDENTIAL_ISSUER_PARAMETERS,
    createRoundIssuers,
} from '../src/__fixtures__/credentialIssuer.fixture';
import {
    DEFAULT_ROUND,
    FEE_RATE_MEDIANS,
    ROUND_CREATION_EVENT,
} from '../src/__fixtures__/round.fixture';
import type { CoinjoinClientEvents } from '../src/types/client';

/**
 * Mock coordinator.
 *
 * The credential endpoints are answered by a real `CredentialIssuer` from
 * `@trezor/wabisabi-crypto/src/testing`, so this validates the balance proof, every range
 * proof and a serial-number set that rejects re-presentation. A malformed credential
 * request fails the test rather than passing through.
 */

type RequestData = Record<string, any>;

/**
 * The credential upper bounds the issuers are built with.
 *
 * They have to be the ones in the round the client is driving, because the client sizes
 * its range proofs from them and the issuer checks the bit width it gets against its own.
 * The default is the round fixture's; a suite that overrides `roundParameters` has to say
 * so with `configureMockCoordinator`.
 */
let credentialBounds = {
    MaxAmountCredentialValue: ROUND_CREATION_EVENT.RoundParameters.MaxAmountCredentialValue,
    MaxVsizeAllocationPerAlice: ROUND_CREATION_EVENT.RoundParameters.MaxVsizeAllocationPerAlice,
};

/**
 * One pair of issuers per round id. `CredentialIssuer` is stateful, so a round has to
 * keep the same instance across all of its requests.
 */
const roundIssuers = new Map<string, ReturnType<typeof createRoundIssuers>>();

/**
 * The round's issuers, as the coordinator holds them.
 *
 * Exported because a suite that starts mid-round needs credentials this very issuer
 * signed; see `mintCredentials` in `src/__fixtures__/credentialIssuer.fixture.ts`.
 */
export const getRoundIssuers = (roundId: string) => {
    let issuers = roundIssuers.get(roundId);
    if (issuers === undefined) {
        issuers = createRoundIssuers(
            credentialBounds.MaxAmountCredentialValue,
            credentialBounds.MaxVsizeAllocationPerAlice,
        );
        roundIssuers.set(roundId, issuers);
    }

    return issuers;
};

/**
 * The round's two credential kinds — issuer, advertised parameters and upper bound.
 *
 * For a suite that starts mid-round: pass one to `mintCredentials` and it gets
 * credentials this coordinator will accept back. See
 * `src/__fixtures__/credentialIssuer.fixture.ts`.
 */
export const getRoundCredentialKinds = (roundId: string) => {
    const issuers = getRoundIssuers(roundId);

    return {
        amount: {
            issuer: issuers.amount,
            issuerParameters: AMOUNT_CREDENTIAL_ISSUER_PARAMETERS,
            maxCredentialValue: credentialBounds.MaxAmountCredentialValue,
        },
        vsize: {
            issuer: issuers.vsize,
            issuerParameters: VSIZE_CREDENTIAL_ISSUER_PARAMETERS,
            maxCredentialValue: credentialBounds.MaxVsizeAllocationPerAlice,
        },
    };
};

/** Builds this round's issuers for credential bounds other than the fixture's. */
export const configureMockCoordinator = (bounds: Partial<typeof credentialBounds>) => {
    credentialBounds = { ...credentialBounds, ...bounds };
    roundIssuers.clear();
};

/** Discards the issuer state, so that a test can register the same input again. */
export const resetMockCoordinator = () => {
    roundIssuers.clear();
    credentialBounds = {
        MaxAmountCredentialValue: ROUND_CREATION_EVENT.RoundParameters.MaxAmountCredentialValue,
        MaxVsizeAllocationPerAlice: ROUND_CREATION_EVENT.RoundParameters.MaxVsizeAllocationPerAlice,
    };
};

/**
 * The issued credentials for a request.
 *
 * `STUBBED_CREDENTIALS_REQUEST` is the one thing answered without the issuer; see the
 * comment on it.
 */
const issue = (issuer: CredentialIssuer, request: unknown) => {
    if ((request as { StubbedByTest?: boolean } | undefined)?.StubbedByTest) {
        return { IssuedCredentials: [], Proofs: [] };
    }

    return serializeCredentialsResponse(
        issuer.handleRequest(deserializeCredentialsRequest(request as never)),
    );
};

let aliceIdCounter = 0;

const DEFAULT = {
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
    },
    'input-registration': (data?: RequestData): RequestData => {
        if (!data?.ZeroAmountCredentialRequests) {
            return { AliceId: Math.random().toString() };
        }
        const issuers = getRoundIssuers(data.RoundId);
        aliceIdCounter += 1;

        return {
            AliceId: `alice-${aliceIdCounter}`,
            AmountCredentials: issue(issuers.amount, data.ZeroAmountCredentialRequests),
            VsizeCredentials: issue(issuers.vsize, data.ZeroVsizeCredentialRequests),
            IsPayingZeroCoordinationFee: false,
        };
    },
    'connection-confirmation': (data?: RequestData): RequestData => {
        if (!data?.ZeroAmountCredentialRequests) {
            return {};
        }
        const issuers = getRoundIssuers(data.RoundId);
        const confirmation: RequestData = {
            ZeroAmountCredentials: issue(issuers.amount, data.ZeroAmountCredentialRequests),
            ZeroVsizeCredentials: issue(issuers.vsize, data.ZeroVsizeCredentialRequests),
        };
        // In phase 0 the coordinator answers a confirmation ping without the real
        // credentials; the client stops there and tries again in phase 1.
        if (data.RealAmountCredentialRequests) {
            confirmation.RealAmountCredentials = issue(
                issuers.amount,
                data.RealAmountCredentialRequests,
            );
            confirmation.RealVsizeCredentials = issue(
                issuers.vsize,
                data.RealVsizeCredentialRequests,
            );
        }

        return confirmation;
    },
    'credential-issuance': (data?: RequestData): RequestData => {
        if (!data?.RealAmountCredentialRequests) {
            return {};
        }
        const issuers = getRoundIssuers(data.RoundId);

        return {
            RealAmountCredentials: issue(issuers.amount, data.RealAmountCredentialRequests),
            RealVsizeCredentials: issue(issuers.vsize, data.RealVsizeCredentialRequests),
            ZeroAmountCredentials: issue(issuers.amount, data.ZeroAmountCredentialRequests),
            // NOTE: the coordinator's own field name has the typo, see `coordinator.ts`.
            ZeroVsizeCredentials: issue(issuers.vsize, data.ZeroVsizeCredentialsRequests),
        };
    },
    'output-registration': (data?: RequestData): RequestData | string => {
        if (!data?.AmountCredentialRequests) {
            return '';
        }
        // Output registration is presentation-only: the issuer verifies the presented
        // credentials and the balance proof and issues nothing back.
        const issuers = getRoundIssuers(data.RoundId);
        issue(issuers.amount, data.AmountCredentialRequests);
        issue(issuers.vsize, data.VsizeCredentialRequests);

        return '';
    },
    'ready-to-sign': '',
    'transaction-signature': '',
    'input-unregistration': '',
};

/**
 * The default response for an endpoint, so that a test can override one field of it
 * without having to fabricate the credential parts by hand.
 */
export const getDefaultResponse = (url: keyof typeof DEFAULT, data: RequestData): RequestData => {
    const handler = DEFAULT[url];
    const response = typeof handler === 'function' ? handler(data) : handler;

    return typeof response === 'string' ? {} : response;
};

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
        let r: RequestData | string;
        try {
            r = defaultResponse.call(null, requestData);
        } catch (error) {
            // The issuer rejected the request: a proof that does not verify, a reused
            // serial number, a range proof of the wrong width. Answer the way the
            // coordinator answers a bad registration, so the suite fails on the error
            // instead of hanging on a request nobody replied to.
            response.statusCode = 500;
            response.setHeader('Content-Type', 'application/json');
            response.write(
                JSON.stringify({
                    ErrorCode: 'MockIssuerRejectedRequest',
                    Description: `${url}: ${error.message}`,
                }),
            );
            response.end();

            return;
        }
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
    } catch {
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
        signal: AbortSignal;
        logger: Logger;
        setSessionPhase: (event: CoinjoinClientEvents['session-phase']) => void;
    };
    addListener: MockedServerEvents;
}

export const createServer = async () => {
    const [port] = await getFreePort();
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
        signal: new AbortController().signal,
        logger: noopLogger,
        setSessionPhase: () => null,
    };

    return server;
};
