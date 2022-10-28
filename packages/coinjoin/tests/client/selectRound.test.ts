import { Alice } from '../../src/client/Alice';
import { CoinjoinRound } from '../../src/client/CoinjoinRound';
import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import {
    getRoundCandidates,
    getAccountCandidates,
    selectUtxoForRound,
    selectRound,
    AliceGenerator,
    CoinjoinRoundGenerator,
} from '../../src/client/round/selectRound';
import { DEFAULT_ROUND, ROUND_CREATION_EVENT } from '../fixtures/round.fixture';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;

// first two params of `selectRound` are always the same
const GENERATORS: [CoinjoinRoundGenerator, AliceGenerator] = [
    (...args) => new CoinjoinRound(...args),
    (...args) => new Alice(...args),
];

const PRISON = new CoinjoinPrison();

describe('selectRound', () => {
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

    it('no available candidates in status Rounds', async () => {
        const result = await getRoundCandidates(
            GENERATORS[0],
            [{ phase: 1 }, { phase: 0, inputRegistrationEnd: new Date() }] as any,
            [],
            server?.requestOptions,
        );
        expect(result).toEqual([]);
    });

    it('CoinjoinRound creation failed on status Round without RoundCreated event', async () => {
        const result = await getRoundCandidates(
            GENERATORS[0],
            [
                {
                    ...DEFAULT_ROUND,
                    coinjoinState: {
                        events: [],
                    },
                },
            ] as any,
            [],
            server?.requestOptions,
        );
        expect(result).toEqual([]);
    });

    it('select existing CoinjoinRound', () => {
        const cjRound = new CoinjoinRound(DEFAULT_ROUND, server?.requestOptions);
        const result = getRoundCandidates(
            GENERATORS[0],
            [DEFAULT_ROUND],
            [cjRound],
            server?.requestOptions,
        );
        expect(result[0]).toBe(cjRound);
    });

    it('no available Accounts', () => {
        const result = getAccountCandidates([], [], [], PRISON, server?.requestOptions);
        expect(result).toEqual([]);
    });

    it('no available utxos', () => {
        const result = getAccountCandidates(
            [{ utxos: [] }] as any,
            [],
            [],
            PRISON,
            server?.requestOptions,
        );
        expect(result).toEqual([]);
    });

    it('utxo in prison', () => {
        PRISON.detain('Ba99ed');

        const result = getAccountCandidates(
            [{ utxos: [{ outpoint: 'Ba99ed' }] }] as any,
            [],
            [],
            PRISON,
            server?.requestOptions,
        );
        expect(result).toEqual([]);
    });

    it('utxo already registered in CoinjoinRound', () => {
        const result = getAccountCandidates(
            [{ utxos: [{ outpoint: 'AA' }] }] as any,
            [],
            [
                {
                    id: '00',
                    inputs: [{ outpoint: 'AA' }],
                    failed: [],
                },
            ] as any,
            PRISON,
            server?.requestOptions,
        );
        expect(result).toEqual([]);
    });

    it('Account already registered in CoinjoinRound', () => {
        const result = getAccountCandidates(
            [{ accountKey: 'account-A', utxos: [{ outpoint: 'AA' }, { outpoint: 'AB' }] }] as any,
            [],
            [
                {
                    id: '03',
                    inputs: [{ accountKey: 'account-A', outpoint: 'AA' }],
                    failed: [{ outpoint: 'Fa17ed' }],
                },
            ] as any,
            PRISON,
            server?.requestOptions,
        );
        expect(result).toEqual([]);
    });

    it('Account skipping rounds', () => {
        const account = [
            {
                accountKey: 'account-A',
                skipRounds: [4, 5],
                skipRoundCounter: 0,
                utxos: [{ outpoint: 'AA' }, { outpoint: 'AB' }],
            },
        ];

        // iterate 5 times
        const result = new Array(5)
            .fill(0, 0, 5)
            .flatMap(() =>
                getAccountCandidates(account as any, [], [], PRISON, server?.requestOptions),
            );

        // skipped at least once
        expect(result.length).toBeLessThan(5); // should be 4 but there is always 20% chance that will be 3
    });

    it('middleware/select-utxo-for-round throws error', async () => {
        // mock server response
        // return error for each round with miningFeeRate: 1 (second round in fixture)
        // for other rounds return invalid indices
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, data }, req, res) => {
            if (url.endsWith('/select-utxo-for-round')) {
                spy();
                if (data.constants.miningFeeRate === 1) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify({ error: 'ExpectedRuntimeError' }));
                    res.end();
                    req.emit('test-response');
                } else {
                    req.emit('test-response', {
                        indices: [5], // non existing indices (utxo indexes)
                    });
                }
            }
        });

        const result = await selectUtxoForRound(
            GENERATORS[1],
            [
                {
                    id: '01',
                    roundParameters: ROUND_CREATION_EVENT.roundParameters,
                } as any,
                {
                    id: '02',
                    roundParameters: { ...ROUND_CREATION_EVENT.roundParameters, miningFeeRate: 1 },
                } as any,
                {
                    id: '03',
                    roundParameters: ROUND_CREATION_EVENT.roundParameters,
                } as any,
            ],
            [
                { accountKey: 'account1', utxos: [{ outpoint: 'AA', amount: 100 }] },
                { accountKey: 'account2', utxos: [{ outpoint: 'BA', amount: 100 }] },
            ] as any,
            server?.requestOptions,
        );

        expect(spy).toBeCalledTimes(6);
        expect(result).toBeUndefined();
    });

    it('Success. new CoinjoinRound created', async () => {
        // dummy mock of /select-utxo-for-round
        // pick utxo which amount is greater than miningFeeRate + 1000
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, data }, req, _res) => {
            let response: any;
            if (url.endsWith('/select-utxo-for-round')) {
                spy();
                const indices = data.utxos.flatMap((utxo: any, i: number) => {
                    if (utxo.amount < 1000 + data.constants.miningFeeRate) return [];
                    return i;
                });

                response = {
                    indices,
                };
            }
            req.emit('test-response', response);
        });

        const roundWithMiningFee = (miningFeeRate: number) => ({
            ...DEFAULT_ROUND,
            coinjoinState: {
                events: [
                    {
                        ...ROUND_CREATION_EVENT,
                        roundParameters: {
                            ...ROUND_CREATION_EVENT.roundParameters,
                            miningFeeRate,
                        },
                    },
                ],
            },
        });

        const result = await selectRound(
            ...GENERATORS,
            [
                {
                    accountKey: 'account-A',
                    scriptType: 'Taproot',
                    utxos: [
                        { outpoint: 'AA', amount: 20000 }, // this will be picked by all rounds
                        { outpoint: 'AB', amount: 1001 }, // this will be picked only by round "02"
                        { outpoint: 'AC', amount: 1010 }, // this will be picked by round "02" and "03" rounds
                    ],
                },
                {
                    accountKey: 'account-B',
                    scriptType: 'Taproot',
                    utxos: [{ outpoint: 'BA', amount: 900 }], // this will not be picked by any round
                },
                {
                    accountKey: 'account-C',
                    scriptType: 'Taproot',
                    utxos: [{ outpoint: 'CA', amount: 2000 }], // this will be picked by all rounds
                },
            ] as any,
            [
                {
                    ...roundWithMiningFee(20),
                    id: '01',
                },
                {
                    ...roundWithMiningFee(1),
                    id: '02',
                },
                {
                    ...roundWithMiningFee(10),
                    id: '03',
                },
            ] as any,
            [],
            PRISON,
            server?.requestOptions,
        );

        expect(spy).toBeCalledTimes(9);

        ['AA', 'AB', 'AC', 'CA'].forEach((outpoint, index) => {
            expect(result!.inputs[index].outpoint).toEqual(outpoint);
        });

        expect(result).toMatchObject({
            id: '02', // this round contains most utxo candidates
            phase: 0,
            roundParameters: { miningFeeRate: 1 },
            commitmentData: expect.any(String),
        });
    });

    // all tested above, this is just for coverage
    it('selectRound without results', async () => {
        // no rounds
        const result = await selectRound(...GENERATORS, [], [], [], PRISON, server?.requestOptions);
        expect(result).toBeUndefined();

        // no accounts
        const result2 = await selectRound(
            ...GENERATORS,
            [],
            [DEFAULT_ROUND],
            [],
            PRISON,
            server?.requestOptions,
        );
        expect(result2).toBeUndefined();

        // no result from middleware
        const result3 = await selectRound(
            ...GENERATORS,
            [{ utxos: [{ outpoint: 'AA' }] }] as any,
            [DEFAULT_ROUND],
            [],
            PRISON,
            server?.requestOptions,
        );
        expect(result3).toBeUndefined();
    });
});
