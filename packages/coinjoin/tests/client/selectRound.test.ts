import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import { selectRound } from '../../src/client/phase/selectRound';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;

const INPUT_REGISTRATION_END = new Date().getTime() + 60000;
const prison = new CoinjoinPrison();

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

    it('no available accounts', async () => {
        const result = await selectRound([], [], [], prison, server?.requestOptions);
        expect(result).toBeUndefined();
    });

    it('no available utxos', async () => {
        const result = await selectRound(
            [{ utxos: [] }] as any,
            [],
            [],
            prison,
            server?.requestOptions,
        );
        expect(result).toBeUndefined();
    });

    it('no available rounds', async () => {
        const result = await selectRound(
            [{ utxos: [{ outpoint: 'aa' }] }] as any,
            [{ phase: 1 }, { phase: 0, inputRegistrationEnd: new Date() }] as any,
            [],
            prison,
            server?.requestOptions,
        );
        expect(result).toBeUndefined();
    });

    it('round without RoundCreated event', async () => {
        const result = await selectRound(
            [{ utxos: [{ outpoint: 'aa' }] }] as any,
            [
                {
                    id: '01',
                    phase: 0,
                    coinjoinState: {
                        events: [] as any[],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
            ] as any,
            [],
            prison,
            server?.requestOptions,
        );
        expect(result).toBeUndefined();
    });

    it('utxo already registered', async () => {
        const result = await selectRound(
            [{ utxos: [{ outpoint: 'aa' }] }] as any,
            [{ id: '01', phase: 0, inputRegistrationEnd: INPUT_REGISTRATION_END }] as any,
            [
                {
                    id: '00',
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                    inputs: [{ outpoint: 'aa' }],
                },
            ] as any,
            prison,
            server?.requestOptions,
        );
        expect(result).toBeUndefined();
    });

    it('utxo in prison', async () => {
        prison.ban('Ba99ed');
        const result = await selectRound(
            [{ utxos: [{ outpoint: 'Ba99ed' }] }] as any,
            [{ id: '01', phase: 0, inputRegistrationEnd: INPUT_REGISTRATION_END }] as any,
            [],
            prison,
            server?.requestOptions,
        );
        expect(result).toBeUndefined();
    });

    it('account already registered in active round', async () => {
        const result = await selectRound(
            [{ accountKey: 'account1', utxos: [{ outpoint: 'aa' }, { outpoint: 'ab' }] }] as any,
            [
                {
                    id: '01',
                    phase: 0,
                    coinjoinState: {
                        events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 1 } }],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
                {
                    id: '02',
                    phase: 1,
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
            ] as any,
            [
                {
                    id: '03',
                    inputs: [{ accountKey: 'account1', outpoint: 'aa' }],
                },
            ] as any,
            prison,
            server?.requestOptions,
        );
        expect(result).toBeUndefined();
    });

    it('middleware/select-utxo-for-round throws error', async () => {
        // mock server response
        server?.addListener('test-request', ({ url }, req, res) => {
            if (url.endsWith('/select-utxo-for-round')) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify({ error: 'ExpectedRuntimeError' }));
                res.end();
            }
            req.emit('test-response');
        });

        const result = await selectRound(
            [
                { accountKey: 'account1', utxos: [{ outpoint: 'AA', amount: 100 }] },
                { accountKey: 'account2', utxos: [{ outpoint: 'BA', amount: 100 }] },
            ] as any,
            [
                {
                    id: '01',
                    phase: 0,
                    coinjoinState: {
                        events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 1 } }],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
            ] as any,
            [],
            prison,
            server?.requestOptions,
        );
        expect(result).toBeUndefined();
    });

    // it('utxo not picked by middleware/select-utxo-for-round', async () => {
    //     const result = await selectRound(
    //         [
    //             { accountKey: 'account1', utxos: [{ outpoint: 'AA', amount: 100 }] },
    //             { accountKey: 'account2', utxos: [{ outpoint: 'BA', amount: 100 }] },
    //         ] as any,
    //         [
    //             {
    //                 id: '01',
    //                 phase: 0,
    //                 coinjoinState: {
    //                     events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 1 } }],
    //                 },
    //                 inputRegistrationEnd: INPUT_REGISTRATION_END,
    //             },
    //         ] as any,
    //         [],
    //         server?.requestOptions,
    //     );
    //     expect(result).toBeUndefined();
    // });

    it('success, new round created', async () => {
        // mock server response
        server?.addListener('test-request', ({ url, data }, req, _res) => {
            let response: any;
            if (url.endsWith('/select-utxo-for-round')) {
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

        const result = await selectRound(
            [
                {
                    accountKey: 'account1',
                    utxos: [
                        { outpoint: 'AA', amount: 20000 }, // this will be picked by all rounds
                        { outpoint: 'AB', amount: 1001 }, // this will be picked only by "02"
                        { outpoint: 'AC', amount: 1010 }, // this will be picked by "02" and "03" rounds
                    ],
                },
                { accountKey: 'account2', utxos: [{ outpoint: 'BA', amount: 100 }] }, // this will not be picked by any round
                { accountKey: 'account3', utxos: [{ outpoint: 'CA', amount: 2000 }] }, // this will be picked by all rounds
            ] as any,
            [
                {
                    id: '01',
                    phase: 0,
                    coinjoinState: {
                        events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 20 } }],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
                {
                    id: '02',
                    phase: 0,
                    coinjoinState: {
                        events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 1 } }],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
                {
                    id: '03',
                    phase: 0,
                    coinjoinState: {
                        events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 10 } }],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
            ] as any,
            [],
            prison,
            server?.requestOptions,
        );

        expect(result!.inputs.length).toBe(2); // only one account registered
        expect(result).toMatchObject({
            id: '02', // this round contains most utxo candidates
            phase: 0,
            roundParameters: { miningFeeRate: 1 },
            commitmentData: expect.any(String),
            accounts: {
                account1: {
                    utxos: [{ outpoint: 'AA' }, { outpoint: 'AB' }, { outpoint: 'AC' }],
                },
                account3: {
                    utxos: [{ outpoint: 'CA' }],
                },
            },
        });
    });
});
