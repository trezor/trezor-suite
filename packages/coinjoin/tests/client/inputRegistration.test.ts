import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import { inputRegistration } from '../../src/client/phase/inputRegistration';
import { createServer, Server } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound } from '../fixtures/round.fixture';

let server: Server | undefined;

const prison = new CoinjoinPrison();

// mock random delay function
jest.mock('../../src/client/clientUtils', () => {
    const originalModule = jest.requireActual('../../src/client/clientUtils');
    return {
        __esModule: true,
        ...originalModule,
        getRandomDelay: () => 0,
    };
});

describe('inputRegistration', () => {
    beforeAll(async () => {
        server = await createServer();
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
                server?.requestOptions,
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
        server?.addListener('test-request', ({ url, data }, req, _res) => {
            let response: any;
            if (
                url.endsWith('/input-registration') &&
                (data.input === 'A1' || data.input === 'B1')
            ) {
                // first input from each account is remixed (no coordinator fee)
                response = {
                    aliceId: data.input,
                    isPayingZeroCoordinationFee: true,
                };
            } else if (url.endsWith('/create-request')) {
                response = {
                    realCredentialsRequestData: {
                        credentialsRequest: {
                            delta: data.amountsToRequest[0],
                        },
                    },
                };
            }
            req.emit('test-response', response);
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
                server?.requestOptions,
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
        server?.addListener('test-request', ({ url, data }, req, res) => {
            if (url.endsWith('/input-registration')) {
                if (data.ownershipProof === '01A2') {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ error: 'ExpectedRuntimeError' }));
                    res.end();
                }
            }
            req.emit('test-response');
        });
        const response = await inputRegistration(
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                    createInput('account-A', 'A2', { ownershipProof: '01A2' }),
                    createInput('account-A', 'A3', { ownershipProof: '01A3' }),
                ],
                server?.requestOptions,
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

    it('error in middleware after successful registration (input should be unregistered while still can)', async () => {
        server?.addListener('test-request', ({ url }, req, res) => {
            if (url.endsWith('/create-request')) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify({ error: 'ExpectedRuntimeError' }));
                res.end();
            }
            req.emit('test-response');
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
