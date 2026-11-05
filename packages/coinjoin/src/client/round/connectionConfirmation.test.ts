import { confirmationInterval, connectionConfirmation } from './connectionConfirmation';
import { createServer, getRoundCredentialKinds, resetMockCoordinator } from '../../../mocks/server';
import { mintCredentialsRequest } from '../../__fixtures__/credentialIssuer.fixture';
import { createInput } from '../../__fixtures__/input.fixture';
import { DEFAULT_ROUND, createCoinjoinRound } from '../../__fixtures__/round.fixture';

let server: Awaited<ReturnType<typeof createServer>>;

jest.mock('@trezor/utils', () => {
    const originalModule = jest.requireActual('@trezor/utils');

    return {
        __esModule: true,
        ...originalModule,
        getWeakRandomNumberInRange: () => 0,
    };
});

/**
 * This suite is about the confirmation interval: when the ping is sent, how its delay is
 * reduced by request latency, and what happens on a deadline or an error.
 *
 * Nothing is stubbed. Its inputs start mid-round, so their real credential requests are
 * built by `realCredentials` below against the mock coordinator's own issuer — the same
 * issuer that then verifies them when the confirmation arrives, and whose serial number
 * set would reject the second presentation of one. A confirmation the issuer refuses is
 * an HTTP 500 from the mock, so these tests fail rather than pass on a request a real
 * coordinator would have thrown out.
 */

/** Rather less than the input's 1 000 000 sat, as the mining and coordination fees are. */
const REGISTERED_AMOUNT = 990_000;
/** `MaxVsizeAllocationPerAlice` (255) less a Taproot input's 58. */
const REGISTERED_VSIZE = 197;

/**
 * One alice's real credential requests, for an input that has already registered.
 *
 * A fresh pair per input: two inputs cannot present the same credentials, and neither
 * can one input twice.
 */
const realCredentials = async (roundId: string = DEFAULT_ROUND.Id) => {
    const kinds = getRoundCredentialKinds(roundId);
    const [realAmountCredentials, realVsizeCredentials] = await Promise.all([
        mintCredentialsRequest(kinds.amount, [REGISTERED_AMOUNT, 0]),
        mintCredentialsRequest(kinds.vsize, [REGISTERED_VSIZE, 0]),
    ]);

    return { realAmountCredentials, realVsizeCredentials };
};

describe('connectionConfirmation', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterEach(() => {
        resetMockCoordinator();
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('try to confirm without registrationData', async () => {
        const response = await connectionConfirmation(
            createCoinjoinRound(
                [createInput('account-A', 'A1'), createInput('account-B', 'B1')],
                server?.requestOptions,
            ),
            server?.requestOptions,
        );
        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/confirm unregistered input/);
        });
    });

    it('try to confirm already confirmed input (Alice got credentials)', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (url.includes('connection-confirmation')) {
                spy(data.AliceId);
            }
            resolve();
        });
        const response = await connectionConfirmation(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', {
                        registrationData: {
                            AliceId: '01A1-01a1',
                        },
                        ...(await realCredentials()),
                        confirmationData: {},
                        confirmedAmountCredentials: {},
                        confirmedVsizeCredentials: {},
                    }),
                    createInput('account-B', 'B1', {
                        registrationData: {
                            AliceId: '01B1-01b1',
                        },
                        ...(await realCredentials()),
                    }),
                ],
                {
                    ...server?.requestOptions,
                    roundParameters: {
                        ConnectionConfirmationTimeout: '0d 0h 0m 4s',
                    },
                },
            ),
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.confirmationData).toMatchObject({});
            expect(input.confirmedAmountCredentials).toMatchObject({});
            expect(input.confirmedVsizeCredentials).toMatchObject({});
        });

        // confirmation request sent only for second input
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith('01B1-01b1');
        // Two inputs' worth of real credential requests, plus the confirmation the
        // issuer verifies: past the default timeout on a loaded machine.
    }, 30_000);

    it('connection confirmation interval (real credentials not received)', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.includes('connection-confirmation')) {
                spy();
                resolve({});
            }
            resolve();
        });
        const response = await connectionConfirmation(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', {
                        registrationData: {
                            AliceId: '01A1-01a1',
                        },
                        ...(await realCredentials()),
                    }),
                    createInput('account-B', 'B1', {
                        registrationData: {
                            AliceId: '01B1-01b1',
                        },
                        ...(await realCredentials()),
                    }),
                ],
                {
                    ...server?.requestOptions,
                    roundParameters: {
                        ConnectionConfirmationTimeout: '0d 0h 0m 2s',
                    },
                    round: {
                        phaseDeadline: Date.now() + 500,
                    },
                },
            ),
            server?.requestOptions,
        );

        // confirmation request called twice for each input
        expect(spy).toHaveBeenCalledTimes(4);
        response.inputs.forEach(input => {
            // inputs are not confirmed, deadline reached (~2.5 sec: phaseDeadline + connectionConfirmationTimeout)
            expect(input.error?.message).toMatch(/Aborted by deadline/);
        });
    }, 30_000);

    it('connection-confirmation, intervalDelay reduced by request latency', async () => {
        const spy = jest.fn();
        const timestamps: number[] = [];
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.includes('connection-confirmation')) {
                timestamps.push(Date.now());
                if (spy.mock.calls.length < 3) {
                    setTimeout(() => resolve({}), 500); // delay first responses
                } else {
                    resolve();
                }
                spy();
            } else {
                resolve();
            }
        });

        const alice = createInput('account-A', 'A1', {
            registrationData: {
                AliceId: '01A1-01a1',
            },
            ...(await realCredentials()),
        });

        await confirmationInterval(
            createCoinjoinRound([alice], {
                ...server?.requestOptions,
                roundParameters: {
                    ConnectionConfirmationTimeout: '0d 0h 0m 2s', // intervalDelay = 1 sec
                },
                round: {
                    phaseDeadline: Date.now() + 5000,
                },
            }),
            alice,
            server?.requestOptions,
        ).promise;

        expect(spy).toHaveBeenCalledTimes(4);

        timestamps
            .map((a, i) => {
                if (i > 0) {
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const prev: number = timestamps[i - 1];

                    return a - prev;
                }

                return 0;
            })
            .forEach(ts => {
                expect(ts).toBeLessThan(1100); // time distance between each request should be around 1 sec, regardless of delayed responses
            });
        // Four one-second intervals, plus the real credential work: building this
        // input's requests against the issuer and a null request per ping.
    }, 20_000);

    it('connection-confirmation interval aborted, Alice unregistered', async () => {
        const credentials = await realCredentials();

        return new Promise<void>(done => {
            const alice = createInput('account-A', 'A1', {
                registrationData: {
                    AliceId: '01A1-01a1',
                },
                ...credentials,
            });

            const interval = confirmationInterval(
                createCoinjoinRound([alice], {
                    ...server?.requestOptions,
                    roundParameters: {
                        ConnectionConfirmationTimeout: '0d 0h 0m 2s', // intervalDelay = 1 sec
                    },
                    round: {
                        phaseDeadline: Date.now() + 1000, // phase will end in less than intervalDelay
                    },
                }),
                alice,
                server?.requestOptions,
            );

            server?.addListener('test-request', ({ url, resolve }) => {
                resolve();
                if (url.includes('input-unregistration')) {
                    done();
                }
            });

            interval.abort();
        });
    });

    /**
     * The point of the mock coordinator holding a real issuer: a credential request that
     * does not verify has to fail the test. Before, the mock answered any shape with
     * structurally fake data and this would have confirmed happily.
     */
    it('a tampered credential request is refused, not waved through', async () => {
        const credentials = await realCredentials();
        const [proof] = credentials.realAmountCredentials.CredentialsRequest.Proofs;
        // One response scalar of the first proof, zeroed: still a well-formed request,
        // still the right number of proofs, but the verification equation no longer holds.
        proof!.Responses[0] = `${'00'.repeat(32)}`;

        const response = await connectionConfirmation(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', {
                        registrationData: { AliceId: '01A1-01a1' },
                        ...credentials,
                    }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phase: 1 },
                    roundParameters: { ConnectionConfirmationTimeout: '0d 0h 0m 4s' },
                },
            ),
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/MockIssuerRejectedRequest|InvalidProof/i);
            expect(input.confirmationData).toBeUndefined();
        });
    }, 20_000);

    it('404 error in coordinator connection-confirmation', async () => {
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.includes('connection-confirmation')) {
                if (data.AliceId === '01A2-01a2') {
                    reject(404);
                }
            }
            resolve();
        });
        const response = await connectionConfirmation(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', {
                        registrationData: {
                            AliceId: '01A1-01a1',
                        },
                        // This round is `01`, not the fixture's default, and the issuer
                        // is per round.
                        ...(await realCredentials('01')),
                    }),
                    createInput('account-A', 'A2', {
                        registrationData: {
                            AliceId: '01A2-01a2',
                        },
                        ...(await realCredentials('01')),
                    }),
                    createInput('account-A', 'A3', {
                        registrationData: {
                            AliceId: '01A3-01a3',
                        },
                        ...(await realCredentials('01')),
                    }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phase: 1, id: '01' },
                    roundParameters: {
                        ConnectionConfirmationTimeout: '0d 0h 0m 4s',
                    },
                },
            ),
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            if (input.outpoint === 'A2') {
                expect(input.error?.message).toMatch(/Not Found/);
            } else {
                expect(input.confirmationData).toEqual(expect.any(Object));
                // The issuer accepted the presentation and the client verified the
                // issuer-parameters proof on what came back, so the credential carries
                // the amount that was asked for.
                expect(input.confirmedAmountCredentials?.[0]?.value).toBe(REGISTERED_AMOUNT);
                expect(input.confirmedVsizeCredentials?.[0]?.value).toBe(REGISTERED_VSIZE);
            }
        });
    }, 30_000);
});
