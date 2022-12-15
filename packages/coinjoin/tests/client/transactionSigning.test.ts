import { networks } from '@trezor/utxo-lib';

import { transactionSigning } from '../../src/client/round/transactionSigning';
import { createServer } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';

let server: Awaited<ReturnType<typeof createServer>>;

// Temporary mock until affiliate request will be moved to coordinator
jest.mock('cross-fetch', () => {
    const originalModule = jest.requireActual('cross-fetch');
    return {
        __esModule: true,
        ...originalModule,
        default: (url: string, ...rest: any[]) => {
            if (url.includes('get_coinjoin_request_suite')) {
                return {
                    status: 200,
                    ok: true,
                    headers: { get: () => 'json' },
                    text: () => Promise.resolve(JSON.stringify({ fee_rate: 0.003 })),
                };
            }
            return originalModule.default(url, ...rest);
        },
    };
});

describe('transactionSigning', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        server?.close();
    });

    it('affiliate-request and update-liquidity-clue', async () => {
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (url.endsWith('/update-liquidity-clue')) {
                resolve({ rawLiquidityClue: data.externalAmounts[0] });
            }
            resolve();
        });

        const response = await transactionSigning(
            {
                id: '01',
                phase: 3,
                inputs: [
                    createInput(
                        'account-A',
                        '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                    ),
                    createInput(
                        'account-A',
                        '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                    ),
                ],
                addresses: [
                    {
                        path: "m/10025'/1'/0'/0'/1/0",
                        scriptPubKey:
                            '1 b67b77a4cac9a32c463e5bbe0c6cbfbab3c86cb59518e5661766056e6a7e849c',
                    },
                ],
                roundParameters: {
                    maxSuggestedAmount: 123456789,
                },
                coinjoinState: {
                    // test vectors from connect signTransactionPaymentRequest
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
                        },
                        {
                            Type: 'OutputAdded',
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
            } as any, // simplified CoinjoinRound
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
                affiliateRequest: {
                    fee_rate: 0.003,
                },
            },
            liquidityClues: [{ accountKey: 'account-A', rawLiquidityClue: 2000000 }],
        });
    });

    // it('try to sign input with error', async () => {
    //     const response = await transactionSigning(
    //         {
    //             id: '00',
    //             phase: 3,
    //             accounts: {
    //                 account1: {
    //                     utxos: [{ outpoint: 'AA', error: 'Error from previous phase' }],
    //                 },
    //             },
    //             coinjoinState: {
    //                 events: [],
    //             },
    //         } as any,
    //         server?.requestOptions,
    //     );
    //     expect(response).toMatchObject({
    //         id: '00',
    //         accounts: {
    //             account1: {
    //                 utxos: [{ outpoint: 'AA', error: 'Error from previous phase' }],
    //             },
    //         },
    //     });
    // });

    // it('signed', async () => {
    //     const response = await transactionSigning({
    //         round: {
    //             coinjoinState: {
    //                 events: [],
    //             },
    //         },
    //         inputs: [{ phase: 5, witness: '0102' }],
    //     } as any);
    //     expect(response).toMatchObject({ inputs: [{ phase: 7 }] });
    // });
});
