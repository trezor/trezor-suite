import { CoinjoinClient } from '../../src';
import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import { createServer } from '../mocks/server';
import { AFFILIATE_INFO, DEFAULT_ROUND, FEE_RATE_MEDIANS } from '../fixtures/round.fixture';

describe(`CoinjoinClient`, () => {
    let server: Awaited<ReturnType<typeof createServer>>;

    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        server?.close();
    });

    it('enable success', async () => {
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                resolve({
                    RoundStates: [DEFAULT_ROUND],
                    CoinJoinFeeRateMedians: FEE_RATE_MEDIANS,
                    AffiliateInformation: AFFILIATE_INFO,
                });
            }
            resolve();
        });

        const cli = new CoinjoinClient(server?.requestOptions);

        const status = await cli.enable();
        if (!status.success) throw new Error(`Client not enabled ${status.error}`);
        expect(status.rounds.length).toBeGreaterThan(0);
        expect(status.coordinationFeeRate.rate).toBeGreaterThan(0);

        cli.disable();
    });

    it('registerAccount and detain registered inputs/outputs from Status', async () => {
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                resolve({
                    CoinJoinFeeRateMedians: FEE_RATE_MEDIANS,
                    AffiliateInformation: AFFILIATE_INFO,
                    RoundStates: [
                        DEFAULT_ROUND,
                        {
                            ...DEFAULT_ROUND,
                            Id: '8080808080808080808080808080808080808080808080808080808080808080',
                            Phase: 1,
                            CoinjoinState: {
                                Events: [
                                    {
                                        Type: 'InputAdded',
                                        Coin: {
                                            Outpoint:
                                                'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00000000',
                                            TxOut: {
                                                ScriptPubKey:
                                                    '51208b0bc63a6c9c4459fe510d7c42c8dade5e8070ca623a9aed9086a7d21a3423b2',
                                                Value: 10000,
                                            },
                                        },
                                    },
                                    {
                                        Type: 'OutputAdded',
                                        Output: {
                                            ScriptPubKey:
                                                '1 0ffeae3fbd08c25521369afbb6d7dacec99f3b24b6113c2fe497bede04723789',
                                            Value: 8000,
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            ...DEFAULT_ROUND,
                            Id: '9090909090909090909090909090909090909090909090909090909090909090',
                            Phase: 2,
                            CoinjoinState: {
                                Events: [
                                    {
                                        Type: 'InputAdded',
                                        Coin: {
                                            Outpoint:
                                                'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB00000000',
                                            TxOut: {
                                                ScriptPubKey:
                                                    '51208b0bc63a6c9c4459fe510d7c42c8dade5e8070ca623a9aed9086a7d21a3423b2',
                                                Value: 10000,
                                            },
                                        },
                                    },
                                    {
                                        Type: 'OutputAdded',
                                        Output: {
                                            ScriptPubKey:
                                                '1 a52d19f3baa0000803d228a67307439c66bbaca8929ce889305e0445b5febad7',
                                            Value: 8000,
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                });
            }
            resolve();
        });

        const spyIsDetained = jest.spyOn(CoinjoinPrison.prototype, 'isDetained');
        const spyDetain = jest.spyOn(CoinjoinPrison.prototype, 'detain');

        // initialize Client with persistent Prison
        const cli = new CoinjoinClient({
            ...server?.requestOptions,
            prison: [
                {
                    accountKey: 'account-A',
                    type: 'input',
                    id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00000000',
                    sentenceStart: Date.now() - 1000000,
                    sentenceEnd: Date.now() + 1000000,
                },
                {
                    accountKey: 'account-A',
                    type: 'output',
                    id: 'tb1ppll2u0aaprp92gfkntamd476emye7weykcgnctlyj7lduprjx7ys9jn7w3',
                    sentenceStart: Date.now() - 1000000,
                    sentenceEnd: Date.now() + 1000000,
                },
            ],
        });

        await cli.enable();

        // set prison event listener
        const prisonEventPromise = new Promise<void>(resolve => {
            cli.on('prison', event => {
                cli.unregisterAccount('account-A');
                cli.disable();

                expect(event.prison.length).toEqual(4); // 4 elements are detained at the end
                resolve();
            });
        });

        cli.registerAccount({
            accountKey: 'account-A',
            scriptType: 'Taproot',
            targetAnonymity: 10,
            rawLiquidityClue: 0,
            maxFeePerKvbyte: 1,
            maxCoordinatorFeeRate: 1,
            maxRounds: 10,
            utxos: [
                // 1. this utxo is registered in 1st Round and already detained in prison
                {
                    path: "m/10025'/1'/0'/1'/0/0",
                    outpoint:
                        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00000000',
                    address: 'tb1ppxzlcdeawkpyg5q85lepuhsructwkxpgtxt5pcdq3hnfp0v372qq3tfr6s',
                    amount: 10000,
                    anonymityLevel: 0,
                },
                // 2. this utxo is registered in 2nd Round and will be detained from the Status
                {
                    path: "m/10025'/1'/0'/1'/0/1",
                    outpoint:
                        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00000000',
                    address: 'tb1p3v9uvwnvn3z9nlj3p47y9jx6me0gqux2vgaf4mvss6nayx35yweqq5sjj2',
                    amount: 10000,
                    anonymityLevel: 0,
                },
                {
                    path: "m/10025'/1'/0'/1'/0/2",
                    outpoint:
                        'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc00000000',
                    address: 'tb1phrhxq2tc9uj5eh0n62ag506ax8kgrfvrkdnqj6nlvvsdejkwe2hqgcyw9j',
                    amount: 6000,
                    anonymityLevel: 0,
                },
            ],
            changeAddresses: [
                // 1. this output is registered in 1st Round and already detained in prison
                {
                    path: "m/10025'/1'/0'/1'/1/0",
                    address: 'tb1ppll2u0aaprp92gfkntamd476emye7weykcgnctlyj7lduprjx7ys9jn7w3',
                },
                // 2. this output is registered in 2nd Round and will be detained from the Status
                {
                    path: "m/10025'/1'/0'/1'/1/1",
                    address: 'tb1p55k3nua65qqqsq7j9zn8xp6rn3ntht9gj2ww3zfstczytd07htts3txmh9',
                },
                {
                    path: "m/10025'/1'/0'/1'/1/2",
                    address: 'tb1p4jf9crt5gh57h2spvfht4zwjtnre700uvs4u63l2g2huchrk2dms4lm6kv',
                },
            ],
        });

        // register the same account just for coverage
        expect(() => cli.registerAccount({ accountKey: 'account-A' } as any)).toThrow();

        expect(spyIsDetained.mock.calls.length).toEqual(4); // isDetained was checked 4 times
        expect(spyDetain.mock.calls.length).toEqual(2); // but only 2 new inmates were added

        // wait for prison event
        await prisonEventPromise;
    });
});
