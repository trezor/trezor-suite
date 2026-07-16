import events from 'events';

import { TorSimulator, captureInterceptedGlobals } from '@trezor/e2e-utils';
import { type InterceptedEvent, createInterceptor } from '@trezor/request-manager';
import { arrayPartition, scheduleAction } from '@trezor/utils';
import { bip32, networks, payments } from '@trezor/utxo-lib';

import { CoinjoinClient } from '../../src';
import { RoundPhase } from '../../src/enums';
import type {
    CoinjoinRequestEvent,
    CoinjoinResponseEvent,
    SerializedCoinjoinRound,
} from '../../src/types/round';
import { getScriptPubKeyFromAddress } from '../../src/utils/coordinatorUtils';
import { type MockedServer, createServer } from '../mocks/server';
import { attachStatefulCoordinator, isCoordinatorPath } from '../mocks/statefulCoordinator';

// End-to-end harness for Tor identity isolation in coinjoin. It runs the production stack:
// CoinjoinClient -> global.fetch -> @trezor/request-manager interceptor -> SOCKS5 proxy,
// where the Tor daemon is replaced by a recording TorSimulator and the coordinator/middleware
// by a stateful mock. A full round (InputRegistration -> ConnectionConfirmation ->
// OutputRegistration -> TransactionSigning -> Ended) is driven end-to-end and the identity
// invariants are asserted from the recorded SOCKS log:
// 1. input-scoped requests always use the input outpoint as identity (circuit reuse)
// 2. output-scoped requests (output-registration, credential-issuance) use fresh random
//    identities, disjoint from all input identities (input/output unlinkability)
// 3. every coordinator request goes through the proxy (no Tor bypass), while middleware
//    requests bypass it (whitelisted localhost, mirroring production)
// 4. Proxy-Authorization and other non-whitelisted headers never reach the coordinator
// 5. a connection reset triggers identity password rotation (new Tor circuit) and the
//    CIRCUIT_MISBEHAVING event, and the request is retried successfully
// Coinjoin-agnostic interceptor behavior (per-hop redirect handling) is covered in
// @trezor/request-manager tests/interceptor-redirects.test.ts.

jest.mock('@trezor/utils', () => {
    const originalModule = jest.requireActual('@trezor/utils');

    return {
        __esModule: true,
        ...originalModule,
        // eliminate request scheduling randomness, identity randomness (getWeakRandomId) stays real
        getWeakRandomNumberInRange: jest.fn(() => 0),
    };
});

jest.mock('../../src/constants', () => {
    const originalModule = jest.requireActual('../../src/constants');

    return {
        __esModule: true,
        ...originalModule,
        // speed up Status polling so phase changes propagate quickly
        STATUS_TIMEOUT: { idle: 5000, enabled: 1000, registered: 500 },
    };
});

const NETWORK = networks.testnet;

// bip32-derived taproot addresses guarantee valid x-only points for utxo-lib payments
const node = bip32.fromSeed(Buffer.alloc(64, 7), NETWORK);
const deriveAddress = (index: number) => {
    const { address } = payments.p2tr({
        pubkey: node.derive(index).publicKey,
        network: NETWORK,
    });
    if (!address) throw new Error(`Cannot derive address ${index}`);

    return address;
};

const OUTPOINT_A = `${'aa'.repeat(32)}00000000`;
const OUTPOINT_B = `${'bb'.repeat(32)}01000000`;
const UTXOS = [
    { outpoint: OUTPOINT_A, address: deriveAddress(100), amount: 1000000 },
    { outpoint: OUTPOINT_B, address: deriveAddress(101), amount: 1000000 },
];
// 33B mask_public_key + 64B signature + 1B coinjoin flag per input
const AFFILIATE_REQUEST = Buffer.alloc(33 + 64 + UTXOS.length, 0).toString('base64');
const SIGNATURE = '11'.repeat(64);
const OWNERSHIP_PROOF = 'cc'.repeat(32);

const RANDOM_IDENTITY_REGEXP = /^[A-Za-z0-9]{10}$/;
const ROTATED_PASSWORD_REGEXP = /^[A-Za-z0-9]{16}$/;
const ACCOUNT_KEY = 'account-A';

const getServerPort = (server: MockedServer) =>
    Number(new URL(server.requestOptions.coordinatorUrl).port);

const registerTestAccount = (cli: CoinjoinClient) =>
    cli.registerAccount({
        accountKey: ACCOUNT_KEY,
        scriptType: 'Taproot',
        targetAnonymity: 10,
        rawLiquidityClue: 0,
        maxFeePerKvbyte: 200000,
        maxCoordinatorFeeRate: 0.005,
        maxRounds: 10,
        utxos: UTXOS.map(utxo => ({
            path: "m/10025'/1'/0'/1'/0/0",
            outpoint: utxo.outpoint,
            address: utxo.address,
            amount: utxo.amount,
            anonymityLevel: 1,
        })),
        changeAddresses: Array.from({ length: 21 }, (_, index) => ({
            path: `m/10025'/1'/0'/1'/1/${index}`,
            address: deriveAddress(index),
        })),
    });

describe('fullRoundTorIdentities', () => {
    const simulator = new TorSimulator();
    const interceptedEvents: InterceptedEvent[] = [];
    const { defaultMaxListeners } = events;
    let restoreGlobals: () => void;
    let server: MockedServer;
    let cli: CoinjoinClient | undefined;

    beforeAll(async () => {
        // concurrent requests of a round phase attach abort listeners to one shared signal,
        // which would trip the MaxListenersExceededWarning canary in JestCustomEnv;
        // restored in afterAll so the canary stays armed for other test files in this worker
        events.setMaxListeners(64);

        restoreGlobals = captureInterceptedGlobals();
        await simulator.start();

        createInterceptor({
            handler: event => interceptedEvents.push(event),
            getTorSettings: () => ({ running: true, host: '127.0.0.1', port: simulator.port }),
            // model the production setup: middleware runs on localhost and does not go
            // through Tor, so its host is whitelisted while the coordinator host is not
            notRequiredTorDomainsList: ['127.0.0.1'],
            getWhitelistedDomains: () => ['localhost', '127.0.0.1'],
        });

        server = await createServer();
    });

    afterAll(async () => {
        // safety net: when the round test dies on a timeout its own cleanup never runs
        cli?.disable();
        await new Promise<void>(resolve => {
            if (!server) return resolve();
            server.close(() => resolve());
        });
        await simulator.close();
        events.setMaxListeners(defaultMaxListeners);
        restoreGlobals();
    });

    it('runs a full coinjoin round over the simulated Tor and upholds identity invariants', async () => {
        const coordinator = attachStatefulCoordinator(server, {
            inputs: UTXOS.map(utxo => ({
                outpoint: utxo.outpoint,
                scriptPubKey: getScriptPubKeyFromAddress(utxo.address, NETWORK, 'Taproot'),
                value: utxo.amount,
            })),
            affiliateRequest: AFFILIATE_REQUEST,
            // short confirmation timeout keeps the keep-alive ping interval (timeout / 2) low
            roundParameters: { ConnectionConfirmationTimeout: '0d 0h 0m 2s' },
        });

        // reset the very first input-registration attempt of input B to exercise the
        // circuit-reset path: resetIdentityCircuit rotates the identity password and the
        // request is retried through a new connection
        let faultInjected = false;
        simulator.setFaultRule(({ username, httpRequestHead }) => {
            if (
                !faultInjected &&
                username === OUTPOINT_B &&
                httpRequestHead.includes('input-registration')
            ) {
                faultInjected = true;

                return 'reset-after-request';
            }
        });

        cli = new CoinjoinClient({
            ...server.requestOptions,
            // middleware bypasses Tor via the notRequiredTorDomainsList whitelist above
            middlewareUrl: `http://127.0.0.1:${getServerPort(server)}/`,
        });
        const client = cli;

        // stand in for the wallet (device): provide ownership proofs and witnesses
        client.on('request', (requests: CoinjoinRequestEvent[]) => {
            const responses = requests.map<CoinjoinResponseEvent>(event =>
                event.type === 'ownership'
                    ? {
                          type: 'ownership',
                          roundId: event.roundId,
                          inputs: event.inputs.map(input => ({
                              outpoint: input.outpoint,
                              ownershipProof: OWNERSHIP_PROOF,
                          })),
                      }
                    : {
                          type: 'signature',
                          roundId: event.roundId,
                          inputs: event.inputs.map(input => ({
                              outpoint: input.outpoint,
                              signature: SIGNATURE,
                              index: event.transaction.inputs.findIndex(
                                  txInput => txInput.outpoint === input.outpoint,
                              ),
                          })),
                      },
            );
            // respond asynchronously like the wallet does, resolveRequest re-enters round processing
            setTimeout(() => client.resolveRequest(responses), 0);
        });

        const endedRound = new Promise<SerializedCoinjoinRound>(resolve => {
            client.on('round', ({ round }) => {
                if (round.phase === RoundPhase.Ended && round.broadcastedTxDetails) {
                    resolve(round);
                }
            });
        });

        const status = await client.enable();
        if (!status.success) throw new Error(`Client not enabled: ${status.error}`);

        registerTestAccount(client);

        let round: SerializedCoinjoinRound;
        try {
            // deadline turns a stalled round into a rejection, so the cleanup below always
            // runs and a failure cannot leak status polling into the other tests
            round = await scheduleAction(() => endedRound, { timeout: 45000 });
        } finally {
            client.unregisterAccount(ACCOUNT_KEY);
            client.disable();
        }

        // the round really completed: transaction assembled from all registered inputs/outputs
        expect(coordinator.getPhase()).toBe(RoundPhase.Ended);
        expect(round.broadcastedTxDetails?.txid).toEqual(expect.any(String));
        expect(round.inputs).toHaveLength(UTXOS.length);
        expect(round.failed).toHaveLength(0);

        // pair every request seen by the mock server with the SOCKS connection it came through
        const connectionByPort = new Map(
            simulator.connections
                .filter(connection => connection.outboundLocalPort !== undefined)
                .map(connection => [connection.outboundLocalPort, connection]),
        );
        const [coordinatorRequests, middlewareRequests] = arrayPartition(
            coordinator.requests,
            request => isCoordinatorPath(request.url),
        );

        // invariant 3: every coordinator request came through the SOCKS proxy...
        expect(coordinatorRequests.length).toBeGreaterThan(0);
        coordinatorRequests.forEach(request => {
            expect(connectionByPort.has(request.remotePort)).toBe(true);
        });
        // ...and no two coordinator requests share a proxied connection. Two requests on one
        // connection would ride the same Tor circuit and make the identity pairing ambiguous.
        // We check the request->port mapping is injective rather than a strict 1:1 with the
        // connection count, because a fetch backend may pool or pre-open extra proxied
        // connections that carry no request (undici does) — harmless, since they still go
        // through Tor.
        const coordinatorPorts = coordinatorRequests.map(request => request.remotePort);
        expect(new Set(coordinatorPorts).size).toBe(coordinatorPorts.length);
        // ...while middleware requests bypassed it completely
        expect(middlewareRequests.length).toBeGreaterThan(0);
        middlewareRequests.forEach(request => {
            expect(connectionByPort.has(request.remotePort)).toBe(false);
        });
        expect(simulator.connections.map(c => c.targetHost)).not.toContain('127.0.0.1');

        // invariant 4: identity credentials and internal headers never reach the coordinator
        coordinatorRequests.forEach(request => {
            expect(request.headers['proxy-authorization']).toBeUndefined();
            expect(request.headers['allowed-headers']).toBeUndefined();
            expect(request.headers['user-agent']).toBeUndefined();
        });

        // invariants 1 + 2: identity assignment per request type
        const inputOutpoints = UTXOS.map(utxo => utxo.outpoint);
        // transaction inputs are sorted by outpoint bytes, so InputIndex order is [A, B]
        const outpointByInputIndex = [OUTPOINT_A, OUTPOINT_B];
        const outputIdentities: string[] = [];
        coordinatorRequests.forEach(request => {
            const { username } = connectionByPort.get(request.remotePort)!;
            const { url, data } = request;
            if (url.endsWith('/input-registration')) {
                expect(username).toBe(data.Input.toLowerCase());
            } else if (
                url.endsWith('/connection-confirmation') ||
                url.endsWith('/ready-to-sign') ||
                url.endsWith('/input-unregistration')
            ) {
                expect(username).toBe(coordinator.aliceOutpoints[data.AliceId]);
            } else if (url.endsWith('/transaction-signature')) {
                expect(username).toBe(outpointByInputIndex[data.InputIndex]);
            } else if (
                url.endsWith('/output-registration') ||
                url.endsWith('/credential-issuance')
            ) {
                expect(username).toMatch(RANDOM_IDENTITY_REGEXP);
                outputIdentities.push(username);
            } else {
                // status and version polling reuses identities registered in Status
                expect(['Satoshi', ...inputOutpoints]).toContain(username);
            }
        });
        // output-side identities never link to inputs and never link to each other
        expect(outputIdentities.length).toBeGreaterThanOrEqual(4); // 2x issuance + 2x registration
        expect(new Set(outputIdentities).size).toBe(outputIdentities.length);
        outputIdentities.forEach(identity => {
            expect(inputOutpoints).not.toContain(identity);
        });

        // invariant 5: connection reset rotated the identity password (fresh circuit).
        // We assert the rotation happened — every retry after the reset uses a fresh 16-char
        // password distinct from the faulted connection — rather than the exact pre-reset
        // password. The pre-reset value is a representation detail: an input identity has no
        // ':password' part, so node-fetch sends an empty SOCKS password, while undici's SOCKS
        // layer falls back to the username. Both isolate the input into its own circuit and
        // both rotate to a fresh password on reset; only the pre-reset wire form differs.
        const inputBConnections = simulator.connections.filter(
            connection => connection.username === OUTPOINT_B,
        );
        const faulted = inputBConnections.filter(connection => connection.fault);
        const retried = inputBConnections.filter(connection => !connection.fault);
        expect(faulted).toHaveLength(1);
        expect(retried.length).toBeGreaterThan(0);
        retried.forEach(connection => {
            expect(connection.password).toMatch(ROTATED_PASSWORD_REGEXP);
            expect(connection.password).not.toBe(faulted[0]?.password);
        });
        expect(interceptedEvents).toContainEqual({
            type: 'CIRCUIT_MISBEHAVING',
            identity: OUTPOINT_B,
        });
    }, 60000);
});
