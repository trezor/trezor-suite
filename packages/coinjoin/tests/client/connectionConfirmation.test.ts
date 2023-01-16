import { connectionConfirmation } from '../../src/client/round/connectionConfirmation';
import { createServer } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound } from '../fixtures/round.fixture';

let server: Awaited<ReturnType<typeof createServer>>;

jest.mock('@trezor/utils', () => {
    const originalModule = jest.requireActual('@trezor/utils');
    return {
        __esModule: true,
        ...originalModule,
        getRandomNumberInRange: () => 0,
    };
});

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
                spy(data.aliceId);
            }
            resolve();
        });
        const response = await connectionConfirmation(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', {
                        registrationData: {
                            aliceId: '01A1-01a1',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                        confirmationData: {},
                        confirmedAmountCredentials: {},
                        confirmedVsizeCredentials: {},
                    }),
                    createInput('account-B', 'B1', {
                        registrationData: {
                            aliceId: '01B1-01b1',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                ],
                {
                    ...server?.requestOptions,
                    roundParameters: {
                        connectionConfirmationTimeout: '0d 0h 0m 4s',
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
        expect(spy).toBeCalledTimes(1);
        expect(spy).toHaveBeenLastCalledWith('01B1-01b1');
    });

    it.skip('recover connection-confirmation', async () => {
        const params: string[] = [];
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.endsWith('/connection-confirmation')) {
                const str = JSON.stringify(data);
                if (params.includes(str)) {
                    resolve();
                } else {
                    params.push(str);
                    reject(500, { message: 'Proxy timeout' });
                }
            }
            if (url.endsWith('/get-zero-credential-requests')) {
                spy();
            }
            resolve();
        });

        const inputs = [
            createInput('account-A', 'A1', {
                registrationData: {
                    aliceId: '01A1-01a1',
                },
                realAmountCredentials: {},
                realVsizeCredentials: {},
            }),
            createInput('account-B', 'B1', {
                registrationData: {
                    aliceId: '01B1-01b1',
                },
                realAmountCredentials: {},
                realVsizeCredentials: {},
            }),
        ];

        const failedConfirmation = await connectionConfirmation(
            createCoinjoinRound(inputs, server?.requestOptions),
            server?.requestOptions,
        );
        // inputs confirmationParams are cached
        failedConfirmation.inputs.forEach(input => {
            expect(input.error).not.toBeUndefined();
            expect(input.confirmationParams).not.toBeUndefined();
            expect(input.confirmationData).toBeUndefined();
            // NOTE: this is only for test purposes. delete error so we can retry.
            // normally its done by CoinjoinRound
            delete input.error;
        });

        expect(spy).toBeCalledTimes(4); // called twice per one input

        const retryConfirmation = await connectionConfirmation(
            createCoinjoinRound(inputs, server?.requestOptions),
            server?.requestOptions,
        );
        retryConfirmation.inputs.forEach(input => {
            expect(input.error).toBeUndefined(); // no more errors
            expect(input.confirmationParams).toBeUndefined(); // confirmation params are removed
            expect(input.confirmationData).not.toBeUndefined();
        });

        expect(spy).toBeCalledTimes(4); // not called at second attempt
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
                            aliceId: '01A1-01a1',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                    createInput('account-B', 'B1', {
                        registrationData: {
                            aliceId: '01B1-01b1',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                ],
                {
                    ...server?.requestOptions,
                    roundParameters: {
                        connectionConfirmationTimeout: '0d 0h 0m 2s',
                    },
                    round: {
                        phaseDeadline: Date.now() + 500,
                    },
                },
            ),
            server?.requestOptions,
        );

        // confirmation request called twice for each input
        expect(spy).toBeCalledTimes(4);
        response.inputs.forEach(input => {
            // inputs are not confirmed, deadline reached (~2.5 sec: phaseDeadline + connectionConfirmationTimeout)
            expect(input.error?.message).toMatch(/Aborted by deadline/);
        });
    });

    it('404 error in coordinator connection-confirmation', async () => {
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.includes('connection-confirmation')) {
                if (data.aliceId === '01A2-01a2') {
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
                            aliceId: '01A1-01a1',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                    createInput('account-A', 'A2', {
                        registrationData: {
                            aliceId: '01A2-01a2',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                    createInput('account-A', 'A3', {
                        registrationData: {
                            aliceId: '01A3-01a3',
                        },
                        realAmountCredentials: {},
                        realVsizeCredentials: {},
                    }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phase: 1, id: '01' },
                    roundParameters: {
                        connectionConfirmationTimeout: '0d 0h 0m 4s',
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
