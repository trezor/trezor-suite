import { Alice } from '../../src/client/Alice';
import { ROUND_SELECTION_MAX_OUTPUTS } from '../../src/constants';
import { SessionPhase, WabiSabiProtocolErrorCode } from '../../src/enums';
import { CoinjoinRound } from '../../src/client/CoinjoinRound';
import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import {
    getRoundCandidates,
    getAccountCandidates,
    selectInputsForRound,
    selectRound,
    AliceGenerator,
    CoinjoinRoundGenerator,
    getUnregisteredAccounts,
} from '../../src/client/round/selectRound';
import {
    DEFAULT_ROUND,
    ROUND_CREATION_EVENT,
    createCoinjoinRound,
} from '../fixtures/round.fixture';
import { createServer } from '../mocks/server';

const ACCOUNT = {
    accountKey: 'account-A',
    scriptType: 'Taproot',
    skipRoundCounter: 0,
    utxos: [
        { outpoint: 'AA', anonymityLevel: 1 },
        { outpoint: 'AB', anonymityLevel: 1 },
    ],
    changeAddresses: new Array(ROUND_SELECTION_MAX_OUTPUTS).fill({ address: 'bc1p' }),
} as any; // as Account

describe('selectRound', () => {
    let server: Awaited<ReturnType<typeof createServer>>;

    const roundGenerator: CoinjoinRoundGenerator = (...args) => new CoinjoinRound(...args);
    const aliceGenerator: AliceGenerator = (...args) => new Alice(...args);
    const prison = new CoinjoinPrison();

    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        prison.inmates = [];
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        jest.clearAllMocks();
        if (server) server.close();
    });

    it('no available candidates in status Rounds', async () => {
        const result = await getRoundCandidates({
            roundGenerator,
            prison,
            statusRounds: [{ Phase: 1 }, { Phase: 0, InputRegistrationEnd: new Date() }] as any,
            coinjoinRounds: [],
            options: server?.requestOptions,
        });
        expect(result).toEqual([]);
    });

    it('CoinjoinRound creation failed on status Round without RoundCreated event', async () => {
        const result = await getRoundCandidates({
            roundGenerator,
            prison,
            statusRounds: [
                {
                    ...DEFAULT_ROUND,
                    CoinjoinState: {
                        Events: [],
                    },
                },
            ] as any,
            coinjoinRounds: [],
            options: server?.requestOptions,
        });
        expect(result).toEqual([]);
    });

    it('select existing CoinjoinRound', () => {
        const cjRound = new CoinjoinRound(DEFAULT_ROUND, prison, server?.requestOptions);
        const result = getRoundCandidates({
            roundGenerator,
            prison,
            statusRounds: [DEFAULT_ROUND],
            coinjoinRounds: [cjRound],
            options: server?.requestOptions,
        });
        expect(result[0]).toBe(cjRound);
    });

    it('no available Accounts', () => {
        const result = getAccountCandidates({
            accounts: [],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
        });
        expect(result).toEqual([]);
    });

    it('no available utxos', () => {
        const result = getAccountCandidates({
            accounts: [{ ...ACCOUNT, utxos: [] }],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
        });
        expect(result).toEqual([]);
    });

    it('utxo in prison', () => {
        prison.detain({ accountKey: ACCOUNT.accountKey, outpoint: 'Ba99ed' });

        const result = getAccountCandidates({
            accounts: [{ ...ACCOUNT, utxos: [{ outpoint: 'Ba99ed', anonymityLevel: 1 }] }],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
        });
        expect(result).toEqual([]);
    });

    it('utxo already registered in CoinjoinRound', () => {
        const result = getAccountCandidates({
            accounts: [{ ...ACCOUNT, utxos: [{ outpoint: 'AA', anonymityLevel: 1 }] }],
            coinjoinRounds: [
                {
                    id: '00',
                    inputs: [{ outpoint: 'AA' }],
                    failed: [],
                },
            ] as any,
            prison,
            options: server?.requestOptions,
        });
        expect(result).toEqual([]);
    });

    it('Account already registered in CoinjoinRound', () => {
        const result = getUnregisteredAccounts({
            accounts: [ACCOUNT],
            coinjoinRounds: [
                {
                    id: '03',
                    inputs: [{ accountKey: 'account-A', outpoint: 'AA' }],
                    failed: [{ outpoint: 'Fa17ed' }],
                },
            ] as any,
            options: server?.requestOptions,
        });

        expect(result).toEqual([]);
    });

    it('Account skipping rounds', () => {
        const accounts = [{ ...ACCOUNT, skipRounds: [4, 5] }];
        // iterate 5 times
        const result = new Array(5).fill(0, 0, 5).flatMap(() =>
            getAccountCandidates({
                accounts,
                coinjoinRounds: [],
                prison,
                options: server?.requestOptions,
            }),
        );

        // skipped at least once
        expect(result.length).toBeLessThan(5); // should be 4 but there is always 20% chance that will be 3
    });

    it('middleware/select-inputs-for-round throws error', async () => {
        // mock server response
        // return error for each round with miningFeeRate: 1 (second round in fixture)
        // for other rounds return invalid indices
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.endsWith('/select-inputs-for-round')) {
                spy();
                if (data.MiningFeeRate === 1) {
                    reject(500, { error: 'ExpectedRuntimeError' });
                } else {
                    resolve({
                        Indices: [5], // non existing indices (utxo indexes)
                    });
                }
            }
            resolve();
        });

        const result = await selectInputsForRound({
            aliceGenerator,
            roundCandidates: [
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: '01' },
                }),
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: '02' },
                    roundParameters: { MiningFeeRate: 1 },
                }),
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: '03' },
                }),
            ],
            accountCandidates: [
                {
                    ...ACCOUNT,
                    accountKey: 'account1',
                    utxos: [{ outpoint: 'AA', amount: 100, anonymityLevel: 1 }],
                },
                {
                    ...ACCOUNT,
                    accountKey: 'account2',
                    utxos: [{ outpoint: 'BA', amount: 100, anonymityLevel: 1 }],
                },
            ],
            options: server?.requestOptions,
        });

        expect(spy).toHaveBeenCalledTimes(6);
        expect(result).toBeUndefined();
    });

    it('Skipping round when fees are high', async () => {
        // mock server response
        // return error for each round with miningFeeRate: 1 (second round in fixture)
        // for other rounds return invalid indices
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/select-inputs-for-round')) {
                spy();
                resolve([]);
            }
            resolve();
        });

        const result = await selectInputsForRound({
            aliceGenerator,
            roundCandidates: [
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: '01' },
                    roundParameters: {
                        MiningFeeRate: 200,
                        CoordinationFeeRate: {
                            Rate: 0.004,
                            PlebsDontPayThreshold: 0.004,
                        },
                    },
                }),
            ],
            accountCandidates: [
                {
                    ...ACCOUNT,
                    accountKey: 'account1',
                    maxFeePerKvbyte: 100,
                    utxos: [{ outpoint: 'AA', amount: 100, anonymityLevel: 1 }],
                },
                {
                    ...ACCOUNT,
                    accountKey: 'account2',
                    maxCoordinatorFeeRate: 0.003,
                    utxos: [{ outpoint: 'BA', amount: 100, anonymityLevel: 1 }],
                },
                {
                    ...ACCOUNT,
                    accountKey: 'account3',
                    maxCoordinatorFeeRate: 0.005,
                    utxos: [{ outpoint: 'CA', amount: 1000, anonymityLevel: 1 }],
                },
            ],
            options: server?.requestOptions,
        });

        expect(spy).toHaveBeenCalledTimes(1); // middleware was called once for account3
        expect(result).toBeUndefined();
    });

    it('Skipping round when selected utxo value > maxSuggestedAmount', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/select-inputs-for-round')) {
                spy();
                resolve({ Indices: [0] });
            }
            resolve();
        });

        const result = await selectInputsForRound({
            aliceGenerator,
            roundCandidates: [
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: '01' },
                    roundParameters: {
                        MaxSuggestedAmount: 1000,
                    },
                }),
            ],
            accountCandidates: [
                {
                    ...ACCOUNT,
                    accountKey: 'account1',
                    utxos: [{ outpoint: 'AA', amount: 1001, anonymityLevel: 1 }],
                },
            ],
            options: server?.requestOptions,
        });

        expect(spy).toHaveBeenCalledTimes(1); // middleware was called once
        expect(result).toBeUndefined();
    });

    it('Skipping round when selected utxo effective value < allowedOutputAmounts.min', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/select-inputs-for-round')) {
                spy();
                resolve({ Indices: [0] });
            }
            resolve();
        });

        const result = await selectInputsForRound({
            aliceGenerator,
            roundCandidates: [
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    roundParameters: {
                        MiningFeeRate: 20000,
                    },
                }),
            ],
            accountCandidates: [
                {
                    ...ACCOUNT,
                    accountKey: 'account1',
                    utxos: [{ outpoint: 'AA', amount: 6561, anonymityLevel: 1 }],
                },
            ],
            options: server?.requestOptions,
        });

        expect(spy).toHaveBeenCalledTimes(1); // middleware was called once
        expect(result).toBeUndefined();
    });

    it('Multiple blame rounds in roundCandidates', async () => {
        // pick utxo which amount is greater than miningFeeRate
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (url.endsWith('/select-inputs-for-round')) {
                const Indices = data.Utxos.flatMap((utxo: any, i: number) => {
                    if (utxo.Amount < data.MiningFeeRate) return [];
                    return i;
                });
                resolve({ Indices });
            }
            resolve();
        });

        const result = await selectInputsForRound({
            aliceGenerator,
            roundCandidates: [
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: 'ff01', BlameOf: '01ff' },
                }),
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: 'aa02' },
                    roundParameters: {
                        MiningFeeRate: 300000, // this round will be skipped, fees to high
                    },
                }),
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: 'ff02', BlameOf: '02ff' },
                }),
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: 'aa01' },
                }),
                createCoinjoinRound([], {
                    ...server?.requestOptions,
                    statusRound: { Id: 'ff03', BlameOf: '03ff' },
                }),
            ],
            accountCandidates: [
                {
                    ...ACCOUNT,
                    accountKey: 'account1',
                    utxos: [{ outpoint: 'AA', amount: 200000, anonymityLevel: 1 }],
                },
                {
                    ...ACCOUNT,
                    accountKey: 'account2',
                    utxos: [{ outpoint: 'BA', amount: 200000, anonymityLevel: 1 }],
                },
            ],
            options: server?.requestOptions,
        });

        expect(result).toMatchObject({
            id: 'aa01',
            inputs: [{ outpoint: 'AA' }, { outpoint: 'BA' }],
        });
    });

    it('Success. new CoinjoinRound created', async () => {
        // dummy mock of /select-inputs-for-round
        // pick utxo which amount is greater than miningFeeRate + 1000
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, data, resolve }) => {
            if (url.endsWith('/select-inputs-for-round')) {
                spy();
                const Indices = data.Utxos.flatMap((utxo: any, i: number) => {
                    if (utxo.Amount < 1000 + data.MiningFeeRate) return [];
                    return i;
                });

                resolve({
                    Indices,
                });
            }
            resolve();
        });

        const roundWithMiningFee = (MiningFeeRate: number) => ({
            ...DEFAULT_ROUND,
            CoinjoinState: {
                Type: '',
                Events: [
                    {
                        ...ROUND_CREATION_EVENT,
                        RoundParameters: {
                            ...ROUND_CREATION_EVENT.RoundParameters,
                            MiningFeeRate,
                            AllowedOutputAmounts: {
                                Min: 1000, // custom min allowed output amount
                                Max: 1000000000,
                            },
                        },
                    },
                ],
            },
        });

        const result = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [
                {
                    ...ACCOUNT,
                    accountKey: 'account-A',
                    utxos: [
                        { outpoint: 'AA', amount: 20000, anonymityLevel: 1 }, // this will be picked by all rounds
                        { outpoint: 'AB', amount: 1001, anonymityLevel: 1 }, // this will be picked only by round "02"
                        { outpoint: 'AC', amount: 1010, anonymityLevel: 1 }, // this will be picked by round "02" and "03" rounds
                    ],
                },
                {
                    ...ACCOUNT,
                    accountKey: 'account-B',
                    utxos: [{ outpoint: 'BA', amount: 900, anonymityLevel: 1 }], // this will not be picked by any round
                },
                {
                    ...ACCOUNT,
                    accountKey: 'account-C',
                    utxos: [{ outpoint: 'CA', amount: 2000, anonymityLevel: 1 }], // this will be picked by all rounds
                },
            ],
            statusRounds: [
                {
                    ...roundWithMiningFee(20),
                    Id: '01',
                },
                {
                    ...roundWithMiningFee(1),
                    Id: '02',
                },
                {
                    ...roundWithMiningFee(10),
                    Id: '03',
                },
            ],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
            runningAffiliateServer: true,
        });

        expect(spy).toHaveBeenCalledTimes(9);

        ['AA', 'AB', 'AC', 'CA'].forEach((outpoint, index) => {
            expect(result!.inputs[index].outpoint).toEqual(outpoint);
        });

        expect(result).toMatchObject({
            id: '02', // this round contains most utxo candidates
            phase: 0,
            roundParameters: { MiningFeeRate: 1 },
            commitmentData: expect.any(String),
        });
    });

    it('Success. new blame Round created', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/select-inputs-for-round')) {
                spy();
                resolve([]);
            }
            resolve();
        });

        const blameOf = '1'.repeat(64);

        prison.detainForBlameRound(
            [
                { accountKey: 'account-A', outpoint: 'AA' },
                { accountKey: 'account-A', outpoint: 'AB' },
            ],
            blameOf,
        );

        const result = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [
                {
                    ...ACCOUNT,
                    accountKey: 'account-A',
                    utxos: [
                        { outpoint: 'AA', amount: 5000, anonymityLevel: 1 },
                        { outpoint: 'AB', amount: 5000, anonymityLevel: 1 },
                        { outpoint: 'AC', amount: 5000, anonymityLevel: 1 },
                    ],
                },
            ],
            statusRounds: [
                { ...DEFAULT_ROUND, Id: '01' },
                { ...DEFAULT_ROUND, Id: '02', BlameOf: blameOf },
            ],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
            runningAffiliateServer: true,
        });

        expect(spy).toHaveBeenCalledTimes(0); // middleware was not called, detained inputs were used
        expect(result?.inputs.length).toBe(2);
        expect(result).toMatchObject({
            id: '02',
            blameOf,
            inputs: [{ outpoint: 'AA' }, { outpoint: 'AB' }],
        });
    });

    it('too many blocked utxos', async () => {
        prison.detain(
            { outpoint: 'A0', accountKey: ACCOUNT.key },
            { errorCode: WabiSabiProtocolErrorCode.InputBanned },
        );
        prison.detain(
            { outpoint: 'A1', accountKey: ACCOUNT.key },
            { errorCode: WabiSabiProtocolErrorCode.InputBanned },
        );
        prison.detain(
            { outpoint: 'A9', accountKey: ACCOUNT.key },
            { errorCode: WabiSabiProtocolErrorCode.InputLongBanned },
        );

        const setSessionPhaseMock = jest.fn();

        // most of utxos are banned
        const result = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [
                {
                    ...ACCOUNT,
                    utxos: [
                        { outpoint: 'A0', amount: 10000 },
                        { outpoint: 'A1', amount: 10000 },
                        { outpoint: 'AC', amount: 60000 },
                        { outpoint: 'A9', amount: 60000000 },
                    ],
                },
            ],
            statusRounds: [DEFAULT_ROUND],
            coinjoinRounds: [],
            prison,
            options: { ...server?.requestOptions, setSessionPhase: setSessionPhaseMock },
            runningAffiliateServer: true,
        });
        expect(result).toBeUndefined();
        expect(setSessionPhaseMock).toHaveBeenLastCalledWith({
            accountKeys: ['account-A'],
            phase: SessionPhase.BlockedUtxos,
        });

        // most of amount is banned
        const result2 = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [
                {
                    ...ACCOUNT,
                    accountKey: 'account-B',
                    utxos: [
                        { outpoint: 'A0', amount: 10000 },
                        { outpoint: 'AB', amount: 6000 },
                        { outpoint: 'AC', amount: 6000 },
                        { outpoint: 'A9', amount: 60000000 },
                    ],
                },
            ],
            statusRounds: [DEFAULT_ROUND],
            coinjoinRounds: [],
            prison,
            options: { ...server?.requestOptions, setSessionPhase: setSessionPhaseMock },
            runningAffiliateServer: true,
        });
        expect(result2).toBeUndefined();
        expect(setSessionPhaseMock).toHaveBeenLastCalledWith({
            accountKeys: ['account-B'],
            phase: SessionPhase.BlockedUtxos,
        });
    });

    // all tested above, this is just for coverage
    it('selectRound without results', async () => {
        // no rounds
        const result = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [],
            statusRounds: [],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
            runningAffiliateServer: true,
        });
        expect(result).toBeUndefined();

        // no accounts
        const result2 = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [],
            statusRounds: [DEFAULT_ROUND],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
            runningAffiliateServer: true,
        });
        expect(result2).toBeUndefined();

        // no result from middleware
        const result3 = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [{ ...ACCOUNT }],
            statusRounds: [DEFAULT_ROUND],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
            runningAffiliateServer: true,
        });
        expect(result3).toBeUndefined();

        // not enough change addresses
        const result4 = await selectRound({
            roundGenerator,
            aliceGenerator,
            accounts: [
                {
                    ...ACCOUNT,
                    changeAddresses: [],
                },
            ],
            statusRounds: [DEFAULT_ROUND],
            coinjoinRounds: [],
            prison,
            options: server?.requestOptions,
            runningAffiliateServer: true,
        });
        expect(result4).toBeUndefined();
    });
});
