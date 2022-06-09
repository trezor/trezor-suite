import { inputRegistration } from '../../src/client/phase/inputRegistration';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;

const DEFAULT_ROUND = {
    id: '00',
    roundParameters: {
        miningFeeRate: 129000,
        maxVsizeAllocationPerAlice: 255,
        coordinationFeeRate: {
            rate: 0.003,
            plebsDontPayThreshold: 1000000,
        },
        inputRegistrationEnd: new Date().getTime() + 10000,
    },
    accounts: {},
};

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
            {
                id: '00',
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AA' }, { outpoint: 'AB' }],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BA' }, { outpoint: 'BB' }],
                    },
                },
            } as any,
            server?.requestOptions,
        );
        expect(response).toMatchObject({
            id: '00',
            accounts: {
                account1: {
                    utxos: [{ outpoint: 'AA' }, { outpoint: 'AB' }],
                },
                account2: {
                    utxos: [{ outpoint: 'BA' }, { outpoint: 'BB' }],
                },
            },
        });
    });

    it('register success', async () => {
        const response = await inputRegistration(
            {
                ...DEFAULT_ROUND,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AA', ownershipProof: 'AA01' }],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BA', ownershipProof: 'BA01' }],
                    },
                },
            } as any,
            server?.requestOptions,
        );
        expect(response).toMatchObject({
            ...DEFAULT_ROUND,
            accounts: {
                account1: {
                    utxos: [
                        {
                            outpoint: 'AA',
                            ownershipProof: 'AA01',
                            registrationData: { aliceId: expect.any(String) },
                            realAmountCredentials: expect.any(Object),
                            realVsizeCredentials: expect.any(Object),
                        },
                    ],
                },
                account2: {
                    utxos: [
                        {
                            outpoint: 'BA',
                            ownershipProof: 'BA01',
                            registrationData: { aliceId: expect.any(String) },
                            realAmountCredentials: expect.any(Object),
                            realVsizeCredentials: expect.any(Object),
                        },
                    ],
                },
            },
        });
    });

    it('fees calculation for P2WPKH and Taproot (remix/coordinator/plebs)', async () => {
        server?.addListener('test-request', (data, req, _res) => {
            const requestedUrl = req.url || '';
            let response: any;
            if (
                requestedUrl.endsWith('/input-registration') &&
                (data.input === 'AA' || data.input === 'BA')
            ) {
                // first utxos from each account is a remix
                response = {
                    aliceId: data.input,
                    isPayingZeroCoordinationFee: true,
                };
            } else if (requestedUrl.endsWith('/create-request')) {
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
            {
                ...DEFAULT_ROUND,
                accounts: {
                    account1: {
                        type: 'P2WPKH',
                        utxos: [
                            { outpoint: 'AA', amount: 123456789, ownershipProof: 'AA01' },
                            { outpoint: 'AB', amount: 123456789, ownershipProof: 'AB01' },
                            { outpoint: 'AC', amount: 999999, ownershipProof: 'AC01' },
                        ],
                    },
                    account2: {
                        type: 'Taproot',
                        utxos: [
                            { outpoint: 'BA', amount: 123456789, ownershipProof: 'BA01' },
                            { outpoint: 'BB', amount: 123456789, ownershipProof: 'BB01' },
                            { outpoint: 'BC', amount: 999999, ownershipProof: 'BC01' },
                        ],
                    },
                },
            } as any,
            server?.requestOptions,
        );

        expect(response).toMatchObject({
            accounts: {
                account1: {
                    utxos: [
                        {
                            outpoint: 'AA',
                            realAmountCredentials: { credentialsRequest: { delta: 123448017 } }, // remix
                            realVsizeCredentials: { credentialsRequest: { delta: 187 } },
                        },
                        {
                            outpoint: 'AB',
                            realAmountCredentials: { credentialsRequest: { delta: 123077647 } }, // coordinator fee
                            realVsizeCredentials: { credentialsRequest: { delta: 187 } },
                        },
                        {
                            outpoint: 'AC',
                            realAmountCredentials: { credentialsRequest: { delta: 991227 } }, // plebs
                            realVsizeCredentials: { credentialsRequest: { delta: 187 } },
                        },
                    ],
                },
                account2: {
                    utxos: [
                        {
                            outpoint: 'BA',
                            realAmountCredentials: { credentialsRequest: { delta: 123449307 } }, // remix
                            realVsizeCredentials: { credentialsRequest: { delta: 197 } },
                        },
                        {
                            outpoint: 'BB',
                            realAmountCredentials: { credentialsRequest: { delta: 123078937 } }, // coordinator fee
                            realVsizeCredentials: { credentialsRequest: { delta: 197 } },
                        },
                        {
                            outpoint: 'BC',
                            realAmountCredentials: { credentialsRequest: { delta: 992517 } }, // plebs
                            realVsizeCredentials: { credentialsRequest: { delta: 197 } },
                        },
                    ],
                },
            },
        });
    });

    it('error in coordinator input-registration', async () => {
        server?.on('test-request', (data, req, res) => {
            if (req.url?.endsWith('/input-registration')) {
                if (data.ownershipProof === 'AB01') {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ error: 'ExpectedRuntimeError' }));
                    res.end();
                }
            }
            req.emit('test-response');
        });
        const response = await inputRegistration(
            {
                ...DEFAULT_ROUND,
                accounts: {
                    account1: {
                        utxos: [
                            { outpoint: 'AA', ownershipProof: 'AA01' },
                            { outpoint: 'AB', ownershipProof: 'AB01' },
                            { outpoint: 'AC', ownershipProof: 'AC01' },
                        ],
                    },
                },
            } as any,
            server?.requestOptions,
        );

        expect(response).toMatchObject({
            accounts: {
                account1: {
                    utxos: [
                        {
                            outpoint: 'AA',
                            registrationData: { aliceId: expect.any(String) },
                        },
                        {
                            outpoint: 'AB',
                            error: /ExpectedRuntimeError/,
                        },
                        {
                            outpoint: 'AC',
                            registrationData: { aliceId: expect.any(String) },
                        },
                    ],
                },
            },
        });
    });

    it('error in middleware after successful registration (input should be unregistered while still can)', async () => {
        server?.on('test-request', (_data, req, res) => {
            if (req.url?.endsWith('/create-request')) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify({ error: 'ExpectedRuntimeError' }));
                res.end();
            }
            req.emit('test-response');
        });
        const response = await inputRegistration(
            {
                ...DEFAULT_ROUND,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AA', ownershipProof: 'AA01' }],
                    },
                },
            } as any,
            server?.requestOptions,
        );
        expect(response).toMatchObject({
            accounts: {
                account1: {
                    utxos: [
                        {
                            outpoint: 'AA',
                            registrationData: { aliceId: expect.any(String) }, // aliceId is present
                            error: /ExpectedRuntimeError/,
                        },
                    ],
                },
            },
        });
    });
});
