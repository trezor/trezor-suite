import { confirmationInterval, connectionConfirmation } from './connectionConfirmation';
import { createServer } from '../../../mocks/server';
import { createInput } from '../../__fixtures__/input.fixture';
import { createCoinjoinRound } from '../../__fixtures__/round.fixture';

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
 * reduced by request latency, and what happens on a deadline or an error. Its inputs
 * carry credential placeholders rather than real credentials, so the credential layer is
 * stubbed; the real round trip against the mock coordinator's issuer is covered by
 * `inputRegistration.test.ts`.
 */
jest.mock('../credentials', () => ({
    ...jest.requireActual('../credentials'),
    getZeroCredentials: jest.fn(() => ({
        CredentialsRequest: { Delta: 0, Presented: [], Requested: [], Proofs: [] },
        CredentialsResponseValidation: {},
    })),
    getCredentials: jest.fn(() => [{ value: 0 }, { value: 0 }]),
}));

/**
 * A credential bundle with the right shape but no proofs, which is what the mock
 * coordinator recognises as "this suite stubs the credential layer".
 */
const CREDENTIALS_STUB = {
    CredentialsRequest: { Delta: 0, Presented: [], Requested: [], Proofs: [] },
    CredentialsResponseValidation: {},
} as any;

describe('connectionConfirmation', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
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
                        realAmountCredentials: CREDENTIALS_STUB,
                        realVsizeCredentials: CREDENTIALS_STUB,
                        confirmationData: {},
                        confirmedAmountCredentials: {},
                        confirmedVsizeCredentials: {},
                    }),
                    createInput('account-B', 'B1', {
                        registrationData: {
                            AliceId: '01B1-01b1',
                        },
                        realAmountCredentials: CREDENTIALS_STUB,
                        realVsizeCredentials: CREDENTIALS_STUB,
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
    });

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
                        realAmountCredentials: CREDENTIALS_STUB,
                        realVsizeCredentials: CREDENTIALS_STUB,
                    }),
                    createInput('account-B', 'B1', {
                        registrationData: {
                            AliceId: '01B1-01b1',
                        },
                        realAmountCredentials: CREDENTIALS_STUB,
                        realVsizeCredentials: CREDENTIALS_STUB,
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
    });

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
            realAmountCredentials: CREDENTIALS_STUB,
            realVsizeCredentials: CREDENTIALS_STUB,
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
    });

    it('connection-confirmation interval aborted, Alice unregistered', () =>
        new Promise<void>(done => {
            const alice = createInput('account-A', 'A1', {
                registrationData: {
                    AliceId: '01A1-01a1',
                },
                realAmountCredentials: CREDENTIALS_STUB,
                realVsizeCredentials: CREDENTIALS_STUB,
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
        }));

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
                        realAmountCredentials: CREDENTIALS_STUB,
                        realVsizeCredentials: CREDENTIALS_STUB,
                    }),
                    createInput('account-A', 'A2', {
                        registrationData: {
                            AliceId: '01A2-01a2',
                        },
                        realAmountCredentials: CREDENTIALS_STUB,
                        realVsizeCredentials: CREDENTIALS_STUB,
                    }),
                    createInput('account-A', 'A3', {
                        registrationData: {
                            AliceId: '01A3-01a3',
                        },
                        realAmountCredentials: CREDENTIALS_STUB,
                        realVsizeCredentials: CREDENTIALS_STUB,
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
            }
        });
    });
});
