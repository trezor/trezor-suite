import { networks } from '@trezor/utxo-lib';

import { transactionSigning } from '../../src/client/round/transactionSigning';
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

describe('transactionSigning', () => {
    let server: Awaited<ReturnType<typeof createServer>>;

    const COINJOIN_REQUEST = {
        fee_rate: 300000,
        min_registrable_amount: 5000,
        no_fee_threshold: 1000000,
        coinjoin_flags_array: [0, 0],
        mask_public_key: '0'.repeat(33 * 2),
        signature: '0'.repeat(64 * 2),
    };

    const affiliateRequest = Buffer.from('0'.repeat(97 * 2 + 4), 'hex').toString('base64');

    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        server?.close();
    });

    it('getTransactionData: read affiliate-request and update-liquidity-clue', async () => {
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (url.endsWith('/update-liquidity-clue')) {
                resolve({ rawLiquidityClue: data.externalAmounts[0] });
            }
            resolve();
        });

        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                    ),
                    createInput(
                        'account-A',
                        '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                        affiliateRequest,
                        addresses: [
                            {
                                accountKey: 'account-A',
                                path: "m/10025'/0'/0'/0'/1/0",
                                address:
                                    'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                                scriptPubKey:
                                    '1 b67b77a4cac9a32c463e5bbe0c6cbfbab3c86cb59518e5661766056e6a7e849c',
                            },
                        ],
                        coinjoinState: {
                            Type: '',
                            events: [
                                {
                                    Type: 'InputAdded',
                                    coin: {
                                        outpoint:
                                            '1B5B1FEEA4DFED4253DB5F639011A744A337B25A67975310439233BD8A1DC49F00000000',
                                        txOut: {
                                            scriptPubKey:
                                                '1 6a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3',
                                            value: 12300000,
                                        },
                                    },
                                    ownershipProof: 'not-relevant',
                                },
                                {
                                    Type: 'InputAdded', // external input
                                    coin: {
                                        outpoint:
                                            '000000000000000000000000000000000000000000000000000000000000000001000000',
                                        txOut: {
                                            scriptPubKey:
                                                '1 b899b1962f24757bf8f641d125a88944d1541272cc86da7815ff7899e368b2d4',
                                            value: 12300000,
                                        },
                                    },
                                    ownershipProof: 'not-relevant',
                                },
                                {
                                    Type: 'InputAdded',
                                    coin: {
                                        outpoint:
                                            '1B5B1FEEA4DFED4253DB5F639011A744A337B25A67975310439233BD8A1DC49F00000000',
                                        txOut: {
                                            scriptPubKey:
                                                '1 6a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3',
                                            value: 12300000,
                                        },
                                    },
                                    ownershipProof: 'not-relevant',
                                },
                                {
                                    Type: 'OutputAdded', // external output
                                    output: {
                                        scriptPubKey:
                                            '1 b899b1962f24757bf8f641d125a88944d1541272cc86da7815ff7899e368b2d4',
                                        value: 2000000,
                                    },
                                },
                                {
                                    Type: 'OutputAdded',
                                    output: {
                                        scriptPubKey:
                                            '1 b67b77a4cac9a32c463e5bbe0c6cbfbab3c86cb59518e5661766056e6a7e849c',
                                        value: 12300000 - 5000000 - 2000000 - 11000,
                                    },
                                },
                            ],
                        },
                    },
                },
            ),
            [
                {
                    accountKey: 'account-A',
                    changeAddresses: [
                        {
                            address:
                                'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                        },
                    ],
                    updateRawLiquidityClue: () => {},
                } as any, // simplified Account
            ],
            { ...server?.requestOptions, network: networks.bitcoin },
        );

        expect(response).toMatchObject({
            transactionData: {
                affiliateRequest: COINJOIN_REQUEST,
            },
            liquidityClues: [{ accountKey: 'account-A', rawLiquidityClue: 2000000 }],
        });
    });

    it('getTransactionData: missing registered outputs', async () => {
        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                        affiliateRequest,
                    },
                },
            ),
            [],
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/No registered outputs/);
        });
    });

    it('getTransactionData: inconsistent number of registered outputs', async () => {
        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                        affiliateRequest,
                        addresses: [
                            {
                                accountKey: 'account-A',
                                path: "m/10025'/0'/0'/0'/1/0",
                                address:
                                    'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                                scriptPubKey:
                                    '1 b67b77a4cac9a32c463e5bbe0c6cbfbab3c86cb59518e5661766056e6a7e849c',
                            },
                        ],
                        coinjoinState: {
                            Type: '',
                            events: [
                                {
                                    Type: 'InputAdded',
                                    coin: {
                                        outpoint:
                                            '1B5B1FEEA4DFED4253DB5F639011A744A337B25A67975310439233BD8A1DC49F00000000',
                                        txOut: {
                                            scriptPubKey:
                                                '1 6a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3',
                                            value: 12300000,
                                        },
                                    },
                                    ownershipProof: 'not-relevant',
                                },
                            ],
                        },
                    },
                },
            ),
            [],
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/Unexpected sum of registered outputs/);
        });
    });

    it('getTransactionData: inconsistent number of registered inputs', async () => {
        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                        affiliateRequest,
                        addresses: [
                            {
                                accountKey: 'account-A',
                                path: "m/10025'/0'/0'/0'/1/0",
                                address:
                                    'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
                                scriptPubKey:
                                    '1 b67b77a4cac9a32c463e5bbe0c6cbfbab3c86cb59518e5661766056e6a7e849c',
                            },
                        ],
                    },
                },
            ),
            [],
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/Unexpected sum of registered inputs/);
        });
    });

    it('signed successfully with one WitnessAlreadyProvided error', async () => {
        const spy = jest.fn();
        jest.spyOn(console, 'error').mockImplementation(() => {}); // do not show error in console

        let alreadyProvided = false;
        server?.addListener('test-request', ({ url, resolve, data, reject }) => {
            if (url.endsWith('/transaction-signature')) {
                spy();
                if (data.inputIndex === 1) {
                    if (!alreadyProvided) {
                        alreadyProvided = true;
                        reject(403); // Simulate cloudflare error. Enforce to repeat the request
                    } else {
                        reject(500, { errorCode: 'WitnessAlreadyProvided' });
                    }
                }
            }
            resolve();
        });

        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        'a00000000000000000000000000000000000000000000000000000000000000001000000',
                        {
                            witness: 'aa',
                            witnessIndex: 0,
                        },
                    ),
                    createInput(
                        'account-A',
                        'b00000000000000000000000000000000000000000000000000000000000000002000000',
                        {
                            witness: 'bb',
                            witnessIndex: 1,
                        },
                    ),
                    createInput(
                        'account-A',
                        'c00000000000000000000000000000000000000000000000000000000000000003000000',
                        {
                            witness: 'cc',
                            witnessIndex: 2,
                        },
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                        affiliateRequest: Buffer.from('0'.repeat(97 * 2 + 4), 'hex').toString(
                            'base64',
                        ),
                        phaseDeadline: Date.now() + 5000, // use shortened delays...
                    },
                },
            ),
            [], // Account is not relevant for this test
            server?.requestOptions,
        );

        expect(spy).toBeCalledTimes(4); // called 4 times because witnessIndex 1 was repeated

        response.inputs.forEach(input => {
            expect(input.error).toBe(undefined);
        });

        expect(response.isSignedSuccessfully()).toBe(true);
    });

    it('failed to send signatures', async () => {
        server?.addListener('test-request', ({ url, resolve, reject }) => {
            if (url.endsWith('/transaction-signature')) {
                reject(500, { errorCode: 'WrongPhase' });
            }
            resolve();
        });

        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        'a00000000000000000000000000000000000000000000000000000000000000001000000',
                        {
                            witness: 'aa',
                            witnessIndex: 0,
                        },
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                        affiliateRequest,
                    },
                },
            ),
            [], // Account is not relevant for this test
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/WrongPhase/);
        });

        expect(response.isSignedSuccessfully()).toBe(false);
    });

    it('try to sign input with error', async () => {
        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        'a00000000000000000000000000000000000000000000000000000000000000001000000',
                        {
                            error: new Error('Error from previous phase'),
                        },
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                    },
                },
            ),
            [], // Account is not relevant for this test
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error).not.toBe(undefined);
        });

        expect(response.isSignedSuccessfully()).toBe(false);
    });

    it('try to sign input with already requested signature', async () => {
        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        'a00000000000000000000000000000000000000000000000000000000000000001000000',
                        {
                            requested: { type: 'signature' },
                        },
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                    },
                },
            ),
            [], // Account is not relevant for this test
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error).toBe(undefined);
        });

        expect(response.isSignedSuccessfully()).toBe(false);
    });

    it('try to sign without affiliate request', async () => {
        const response = await transactionSigning(
            createCoinjoinRound(
                [
                    createInput(
                        'account-A',
                        'a00000000000000000000000000000000000000000000000000000000000000001000000',
                    ),
                ],
                {
                    ...server?.requestOptions,
                    round: {
                        phase: 3,
                    },
                },
            ),
            [], // Account is not relevant for this test
            server?.requestOptions,
        );

        response.inputs.forEach(input => {
            expect(input.error).toBe(undefined);
        });

        expect(response.isSignedSuccessfully()).toBe(false);
    });
});
