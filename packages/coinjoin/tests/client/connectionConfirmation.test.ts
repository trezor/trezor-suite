import { connectionConfirmation } from '../../src/client/phase/connectionConfirmation';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;

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

    it('try to confirm without aliceId', async () => {
        const response = await connectionConfirmation(
            {
                round: {},
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AA' }],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BA' }],
                    },
                },
            } as any,
            server?.requestOptions,
        );
        expect(response).toMatchObject({
            accounts: {
                account1: {
                    utxos: [{ outpoint: 'AA', error: /AA/ }],
                },
                account2: {
                    utxos: [{ outpoint: 'BA', error: /BA/ }],
                },
            },
        });
    });

    // it('confirmed', async () => {
    //     const response = await connectionConfirmation(
    //         {
    //             round: {
    //                 feeRate: 12345,
    //                 coordinationFeeRate: {
    //                     rate: 0.003,
    //                     plebsDontPayThreshold: 1,
    //                 },
    //             },
    //             inputs: [{ phase: 2, realAmountCredentials: {}, realVsizeCredentials: {} }],
    //         } as any,
    //         server?.requestOptions,
    //     );
    //     expect(response).toMatchObject({
    //         inputs: [
    //             {
    //                 phase: 3,
    //                 confirmedAmountCredentials: [{}, {}],
    //             },
    //         ],
    //     });
    // });

    it('error in coordinator connection-confirmation', async () => {
        server?.on('test-request', (data, req, res) => {
            if (req.url?.includes('connection-confirmation')) {
                if (data.aliceId === '02') {
                    res.writeHead(404);
                    res.end();
                }
            }
            req.emit('test-response');
        });
        const response = await connectionConfirmation(
            {
                round: {},
                accounts: {
                    account1: {
                        utxos: [
                            {
                                outpoint: 'AA',
                                registrationData: {
                                    aliceId: '01',
                                },
                                realAmountCredentials: {},
                                realVsizeCredentials: {},
                            },
                            {
                                outpoint: 'AB',
                                registrationData: {
                                    aliceId: '02',
                                },
                                realAmountCredentials: {},
                                realVsizeCredentials: {},
                            },
                            {
                                outpoint: 'AC',
                                registrationData: {
                                    aliceId: '03',
                                },
                                realAmountCredentials: {},
                                realVsizeCredentials: {},
                            },
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
                        { outpoint: 'AA', confirmationData: expect.any(Object) },
                        { outpoint: 'AB', error: /Not found/ },
                        { outpoint: 'AC', confirmationData: expect.any(Object) },
                    ],
                },
            },
        });
    });
});
