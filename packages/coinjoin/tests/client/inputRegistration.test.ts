import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import { inputRegistration } from '../../src/client/round/inputRegistration';
import { createServer } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound } from '../fixtures/round.fixture';

let server: Awaited<ReturnType<typeof createServer>>;

const prison = new CoinjoinPrison();

// mock random delay function
jest.mock('@trezor/utils', () => {
    const originalModule = jest.requireActual('@trezor/utils');
    return {
        __esModule: true,
        ...originalModule,
        getRandomNumberInRange: () => 0,
    };
});

describe('inputRegistration', () => {
    beforeAll(async () => {
        server = await createServer();
        // jest.spyOn('@trezor/utils', 'getRandomNumberInRange').mockImplementation(() => {});
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        jest.clearAllMocks();
        if (server) server.close();
    });

    it('try to register without ownership proof', async () => {
        const response = await inputRegistration(
            createCoinjoinRound(
                [createInput('account-A', 'A1'), createInput('account-B', 'B1')],
                server?.requestOptions,
            ),
            prison,
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.ownershipProof).toBe(undefined);
        });
    });

    it('register success', async () => {
        const response = await inputRegistration(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                    createInput('account-B', 'B1', { ownershipProof: '01B1' }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phaseDeadline: Date.now() + 3000 },
                },
            ),
            prison,
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.ownershipProof).toEqual(expect.any(String));
            expect(input.registrationData).toMatchObject({ aliceId: expect.any(String) });
            expect(input.realAmountCredentials).toEqual(expect.any(Object));
            expect(input.realVsizeCredentials).toEqual(expect.any(Object));
        });
    });

    it('fees calculation for P2WPKH and Taproot (remix/coordinator/plebs)', async () => {
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (
                url.endsWith('/input-registration') &&
                (data.input === 'A1' || data.input === 'B1')
            ) {
                // first input from each account is remixed (no coordinator fee)
                resolve({
                    aliceId: data.input,
                    isPayingZeroCoordinationFee: true,
                });
            }
            if (url.endsWith('/get-real-credential-requests')) {
                resolve({
                    realCredentialRequests: {
                        credentialsRequest: {
                            delta: data.amountsToRequest[0],
                        },
                    },
                });
            }
            resolve();
        });

        const response = await inputRegistration(
            createCoinjoinRound(
                [
                    createInput('account-P2WPKH', 'A1', {
                        accountType: 'P2WPKH',
                        ownershipProof: '01A1',
                        amount: 123456789,
                    }),
                    createInput('account-P2WPKH', 'A2', {
                        accountType: 'P2WPKH',
                        ownershipProof: '01A2',
                        amount: 123456789,
                    }),
                    createInput('account-P2WPKH', 'A3', {
                        accountType: 'P2WPKH',
                        ownershipProof: '01A3',
                        amount: 999999,
                    }),

                    //
                    createInput('account-Taproot', 'B1', {
                        accountType: 'Taproot',
                        ownershipProof: '01B1',
                        amount: 123456789,
                    }),
                    createInput('account-Taproot', 'B2', {
                        accountType: 'Taproot',
                        ownershipProof: '01B2',
                        amount: 123456789,
                    }),
                    createInput('account-Taproot', 'B3', {
                        accountType: 'Taproot',
                        ownershipProof: '01B3',
                        amount: 999999,
                    }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phaseDeadline: Date.now() + 3000 },
                },
            ),
            prison,
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            if (input.outpoint === 'A1') {
                expect(input.realAmountCredentials?.credentialsRequest.delta).toEqual(123448017); // remix
                expect(input.realVsizeCredentials?.credentialsRequest.delta).toEqual(187);
            }
            if (input.outpoint === 'B1') {
                expect(input.realAmountCredentials?.credentialsRequest.delta).toEqual(123449307); // remix
                expect(input.realVsizeCredentials?.credentialsRequest.delta).toEqual(197);
            }

            if (input.outpoint === 'A2') {
                expect(input.realAmountCredentials?.credentialsRequest.delta).toEqual(123077647); // coordinator fee
                expect(input.realVsizeCredentials?.credentialsRequest.delta).toEqual(187);
            }
            if (input.outpoint === 'B2') {
                expect(input.realAmountCredentials?.credentialsRequest.delta).toEqual(123078937); // coordinator fee
                expect(input.realVsizeCredentials?.credentialsRequest.delta).toEqual(197);
            }

            if (input.outpoint === 'A3') {
                expect(input.realAmountCredentials?.credentialsRequest.delta).toEqual(991227); // plebs
                expect(input.realVsizeCredentials?.credentialsRequest.delta).toEqual(187);
            }
            if (input.outpoint === 'B3') {
                expect(input.realAmountCredentials?.credentialsRequest.delta).toEqual(992517); // plebs
                expect(input.realVsizeCredentials?.credentialsRequest.delta).toEqual(197);
            }
        });
    });

    it('error in coordinator input-registration', async () => {
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.endsWith('/input-registration')) {
                if (data.ownershipProof === '01A2') {
                    reject(500, { error: 'ExpectedRuntimeError' });
                }
            }
            resolve();
        });
        const response = await inputRegistration(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                    createInput('account-A', 'A2', { ownershipProof: '01A2' }),
                    createInput('account-A', 'A3', { ownershipProof: '01A3' }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phaseDeadline: Date.now() + 3000 },
                },
            ),
            prison,
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            if (input.outpoint === 'A1') {
                expect(input.registrationData).toMatchObject({ aliceId: expect.any(String) });
            }

            if (input.outpoint === 'A2') {
                expect(input.error?.message).toMatch(/ExpectedRuntimeError/);
            }

            if (input.outpoint === 'A3') {
                expect(input.registrationData).toMatchObject({ aliceId: expect.any(String) });
            }
        });
    });

    it('deadline in coordinator request', async () => {
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/input-registration')) {
                // respond after phaseDeadline
                setTimeout(resolve, 4000);
                return;
            }
            resolve();
        });

        const response = await inputRegistration(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                    createInput('account-B', 'B1', { ownershipProof: '01B1' }),
                ],
                {
                    ...server?.requestOptions,
                    round: { phaseDeadline: Date.now() + 3000 },
                },
            ),
            prison,
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/Aborted by deadline/);
        });
    });

    it('error in middleware after successful registration (input should be unregistered while still can)', async () => {
        server?.addListener('test-request', ({ url, resolve, reject }) => {
            if (url.endsWith('/get-real-credential-requests')) {
                reject(500, { error: 'ExpectedRuntimeError' });
            }
            resolve();
        });
        const response = await inputRegistration(
            createCoinjoinRound(
                [createInput('account-A', 'A1', { ownershipProof: '01A1' })],
                server?.requestOptions,
            ),
            prison,
            server?.requestOptions,
        );
        // input have registrationData but also have an error and should be excluded
        expect(response.inputs[0].registrationData).toMatchObject({ aliceId: expect.any(String) });
        expect(response.inputs[0].error?.message).toMatch(/ExpectedRuntimeError/);
    });

    it('success. using connection-confirmation interval', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/connection-confirmation')) {
                resolve({}); // return data without realCredentials
                spy();
            }
            resolve();
        });

        const response = await inputRegistration(
            createCoinjoinRound([createInput('account-A', 'A1', { ownershipProof: '01A1' })], {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    connectionConfirmationTimeout: '0d 0h 0m 5s',
                },
            }),
            prison,
            server?.requestOptions,
        );

        expect(spy).toBeCalledTimes(3); // connection-confirmation was called 2 times: 10 sec phase deadline divided by 2 * 2.5 sec connectionConfirmationTimeout
        expect(response.inputs[0].confirmationDeadline).toBeGreaterThan(Date.now() + 2400); // next connection-confirmation from phase 1 will be called in ~2.5 sec
    }, 10000);

    it('success. connection-confirmation returns realCredentials (coordinator is already in phase 1)', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/connection-confirmation')) {
                spy();
            }
            resolve();
        });

        const response = await inputRegistration(
            createCoinjoinRound([createInput('account-A', 'A1', { ownershipProof: '01A1' })], {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    connectionConfirmationTimeout: '0d 0h 0m 4s',
                },
            }),
            prison,
            server?.requestOptions,
        );

        expect(spy).toBeCalledTimes(1); // connection-confirmation was called 1 time and responded with real realCredentials (default response of MockedServer)
        expect(response.inputs[0].confirmationData).toMatchObject({
            realAmountCredentials: expect.any(Object),
        });
    });

    it('success. connection-confirmation aborted (example: status round phase change)', async () => {
        const abort = new AbortController();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/connection-confirmation')) {
                resolve({});
                abort.abort();
            }
            resolve();
        });

        const response = await inputRegistration(
            createCoinjoinRound([createInput('account-A', 'A1', { ownershipProof: '01A1' })], {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    connectionConfirmationTimeout: '0d 0h 0m 4s',
                },
            }),
            prison,
            { ...server?.requestOptions, signal: abort.signal },
        );

        expect(response.inputs[0].registrationData).toMatchObject({ aliceId: expect.any(String) });
        expect(response.inputs[0].error).toBeUndefined(); // input without error even if request failed
    });
});
