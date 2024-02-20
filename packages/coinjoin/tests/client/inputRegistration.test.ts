import { inputRegistration } from '../../src/client/round/inputRegistration';
import { createServer } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound } from '../fixtures/round.fixture';

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
    let server: Awaited<ReturnType<typeof createServer>>;

    beforeAll(async () => {
        server = await createServer();
    });

    afterEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        jest.clearAllMocks();
        server?.close();
    });

    it('try to register without ownership proof', async () => {
        const response = await inputRegistration(
            createCoinjoinRound(
                [createInput('account-A', 'A1'), createInput('account-B', 'B1')],
                server?.requestOptions,
            ),
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
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.ownershipProof).toEqual(expect.any(String));
            expect(input.registrationData).toMatchObject({ AliceId: expect.any(String) });
            expect(input.realAmountCredentials).toEqual(expect.any(Object));
            expect(input.realVsizeCredentials).toEqual(expect.any(Object));
            input.clearConfirmationInterval();
        });
    });

    it('fees calculation for P2WPKH and Taproot (remix/coordinator/plebs)', async () => {
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (
                url.endsWith('/input-registration') &&
                (data.Input === 'A1' || data.Input === 'B1')
            ) {
                // first input from each account is remixed (no coordinator fee)
                resolve({
                    AliceId: data.input,
                    IsPayingZeroCoordinationFee: true,
                });
            }
            if (url.endsWith('/get-real-credential-requests')) {
                resolve({
                    RealCredentialRequests: {
                        CredentialsRequest: {
                            Delta: data.AmountsToRequest[0],
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
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            if (input.outpoint === 'A1') {
                expect(input.realAmountCredentials?.CredentialsRequest.Delta).toEqual(123448017); // remix
                expect(input.realVsizeCredentials?.CredentialsRequest.Delta).toEqual(187);
            }
            if (input.outpoint === 'B1') {
                expect(input.realAmountCredentials?.CredentialsRequest.Delta).toEqual(123449307); // remix
                expect(input.realVsizeCredentials?.CredentialsRequest.Delta).toEqual(197);
            }

            if (input.outpoint === 'A2') {
                expect(input.realAmountCredentials?.CredentialsRequest.Delta).toEqual(123077647); // coordinator fee
                expect(input.realVsizeCredentials?.CredentialsRequest.Delta).toEqual(187);
            }
            if (input.outpoint === 'B2') {
                expect(input.realAmountCredentials?.CredentialsRequest.Delta).toEqual(123078937); // coordinator fee
                expect(input.realVsizeCredentials?.CredentialsRequest.Delta).toEqual(197);
            }

            if (input.outpoint === 'A3') {
                expect(input.realAmountCredentials?.CredentialsRequest.Delta).toEqual(991227); // plebs
                expect(input.realVsizeCredentials?.CredentialsRequest.Delta).toEqual(187);
            }
            if (input.outpoint === 'B3') {
                expect(input.realAmountCredentials?.CredentialsRequest.Delta).toEqual(992517); // plebs
                expect(input.realVsizeCredentials?.CredentialsRequest.Delta).toEqual(197);
            }
            input.clearConfirmationInterval();
        });
    });

    it('error in coordinator input-registration', async () => {
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.endsWith('/input-registration')) {
                if (data.OwnershipProof === '01A2') {
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
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            if (input.outpoint === 'A1') {
                expect(input.registrationData).toMatchObject({ AliceId: expect.any(String) });
            }

            if (input.outpoint === 'A2') {
                expect(input.error?.message).toMatch(/ExpectedRuntimeError/);
            }

            if (input.outpoint === 'A3') {
                expect(input.registrationData).toMatchObject({ AliceId: expect.any(String) });
            }
            input.clearConfirmationInterval();
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
            server?.requestOptions,
        );
        // input have registrationData but also have an error and should be excluded
        expect(response.inputs[0].registrationData).toMatchObject({ AliceId: expect.any(String) });
        expect(response.inputs[0].error?.message).toMatch(/ExpectedRuntimeError/);
    });

    it('success. using connection-confirmation interval', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/connection-confirmation')) {
                if (spy.mock.calls.length < 2) {
                    resolve({}); // return data without realCredentials
                }
                spy();
            }
            resolve();
        });

        const response = await inputRegistration(
            createCoinjoinRound([createInput('account-A', 'A1', { ownershipProof: '01A1' })], {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    ConnectionConfirmationTimeout: '0d 0h 0m 5s',
                },
            }),
            server?.requestOptions,
        );

        await Promise.all(response.inputs.map(input => input.getConfirmationInterval()?.promise));

        expect(spy).toHaveBeenCalledTimes(3); // connection-confirmation was called 2 times: 10 sec phase deadline divided by 2 * 2.5 sec connectionConfirmationTimeout
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
                    ConnectionConfirmationTimeout: '0d 0h 0m 4s',
                },
            }),
            server?.requestOptions,
        );

        await Promise.all(response.inputs.map(input => input.getConfirmationInterval()?.promise));

        expect(spy).toHaveBeenCalledTimes(1); // connection-confirmation was called 1 time and responded with real realCredentials (default response of MockedServer)
        expect(response.inputs[0].confirmationData).toMatchObject({
            RealAmountCredentials: expect.any(Object),
        });
    });

    it('success. confirmation interval is aborted after registration', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/connection-confirmation')) {
                spy();
                resolve({});
            }
            resolve();
        });

        const response = await inputRegistration(
            createCoinjoinRound([createInput('account-A', 'A1', { ownershipProof: '01A1' })], {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    ConnectionConfirmationTimeout: '0d 0h 0m 2s',
                },
            }),
            server?.requestOptions,
        );

        expect(response.inputs[0].registrationData).toMatchObject({ AliceId: expect.any(String) });
        expect(response.inputs[0].getConfirmationInterval()).not.toBeUndefined();
        expect(response.inputs[0].error).toBeUndefined(); // input without error even if request failed

        // wait few confirmation iterations
        await new Promise(resolve => setTimeout(resolve, 2000));
        expect(spy.mock.calls.length).toBeGreaterThan(0);

        // 2. wait for confirmation interval to resolve
        Promise.all(response.inputs.map(input => input.getConfirmationInterval()?.promise)).then(
            res => {
                res.forEach(input => {
                    expect(input?.getConfirmationInterval()).toBeUndefined();
                });
            },
        );

        // 1. abort confirmation interval
        response.inputs.forEach(input => input.clearConfirmationInterval());
    });
});
