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
            if (url.endsWith('/create-request')) {
                resolve({
                    realCredentialsRequestData: {
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
            if (url.endsWith('/create-request')) {
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
});
