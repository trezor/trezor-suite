import { transactionSigning } from '../../src/client/phase/transactionSigning';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;

describe('transactionSigning', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('payment-request', async () => {
        const response = await transactionSigning(
            {
                id: '00',
                phase: 3,
                accounts: {
                    account1: {
                        type: 'taproot',
                        utxos: [
                            {
                                outpoint:
                                    '1b5b1feea4dfed4253db5f639011a744a337b25a67975310439233bd8a1dc49f00000000',
                            },
                        ],
                        addresses: [
                            {
                                scriptPubKey:
                                    '51206a6daebd9abae25cdd376b811190163eb00c58e87da1867ba8546229098231c3',
                            },
                        ],
                    },
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
            } as any,
            {
                ...server?.requestOptions,
                // coordinatorName: 'trezor.io',
                // coordinatorUrl: 'http://localhost:8081/',
            },
        );
        expect(response).toMatchObject({
            transactionData: {
                paymentRequest: {
                    recipient_name: 'trezor.io',
                    signature: 'AA',
                },
            },
        });
    });

    // it('joinInputsCredentials', async () => {
    //     const cli = await joinInputsCredentials({
    //         round: {},
    //         inputs: [
    //             { aliceId: '1', newAmountCredentials: { value: 1 } },
    //             { aliceId: '2', newAmountCredentials: { value: 2 } },
    //             { aliceId: '3', newAmountCredentials: { value: 3 } },
    //             { aliceId: '4', newAmountCredentials: { value: 4 } },
    //         ],
    //     });
    // });

    // it('try to sign utxo with error', async () => {
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
