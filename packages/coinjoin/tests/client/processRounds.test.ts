import { finishCurrentProcess, processRounds } from '../../src/client/phase/processRounds';
import { createServer, Server } from '../mocks/server';

let server: Server | undefined;

// mock random delay function
jest.mock('../../src/client/clientUtils', () => {
    const originalModule = jest.requireActual('../../src/client/clientUtils');
    return {
        __esModule: true,
        ...originalModule,
        getRandomDelay: () => 0,
    };
});

describe('processRounds', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-handle-request');
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('interruption caused by Round phase change (triggered by Arena.onStatusUpdate)', async done => {
        let rounds = [
            {
                id: '01',
                phase: 0,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AA', ownershipProof: '00AA' }],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BA', ownershipProof: '00BA' }],
                    },
                },
            },
            {
                id: '02',
                phase: 0,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AB', ownershipProof: '00AB' }],
                    },
                },
            },
        ] as any;
        // 1. call process
        processRounds(rounds, [], server?.requestOptions).then(result => {
            // update current ActiveRounds
            rounds = result.rounds;
        });
        // 2. this will interrupt previous process (see Arena.onStatusUpdate)
        await finishCurrentProcess([{ id: '01', phase: 1 } as any]);
        // 3. immediatelly call process again
        processRounds([{ ...rounds[0], phase: 1 }], [], server?.requestOptions).then(result => {
            expect(result.rounds[0].accounts).toEqual({
                account1: { utxos: [] },
                account2: { utxos: [] },
            });
            done();
        });
    }, 50000);

    it('multiple independent locks', async done => {
        const roundParameters = {
            coordinationFeeRate: {},
            inputRegistrationEnd: new Date().getTime() + 10000,
        };
        const rounds1 = [
            {
                id: '01',
                phase: 0,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AA', ownershipProof: '00AA' }],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BA', ownershipProof: '00BA' }],
                    },
                },
                roundParameters,
            },
        ] as any;
        // round2 is not locked
        await finishCurrentProcess(rounds1);
        processRounds(rounds1, [], server?.requestOptions).then(({ rounds, failed }) => {
            rounds.forEach(round => {
                Object.values(round.accounts).forEach(account => {
                    account.utxos.forEach(utxo => {
                        expect(utxo.registrationData).toBeTruthy();
                    });
                });
            });
            expect(failed.length).toBe(0);
        });

        const rounds2 = [
            {
                id: '02',
                phase: 0,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AB', ownershipProof: '00AB' }],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BB', ownershipProof: '00BB' }],
                    },
                },
                roundParameters,
            },
        ] as any;
        // round2 is not locked
        await finishCurrentProcess(rounds2);
        processRounds(rounds2, [], server?.requestOptions).then(({ rounds, failed }) => {
            rounds.forEach(round => {
                Object.values(round.accounts).forEach(account => {
                    account.utxos.forEach(utxo => {
                        expect(utxo.registrationData).toBeTruthy();
                    });
                });
            });
            expect(failed.length).toBe(0);
        });

        const rounds3 = [
            {
                id: '03',
                phase: 0,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AC', ownershipProof: '00AC' }],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BC', ownershipProof: '00BC' }],
                    },
                },
                roundParameters,
            },
        ] as any;
        // round3 is not locked
        await finishCurrentProcess(rounds3);
        processRounds(rounds3, [], server?.requestOptions).then(({ rounds, failed }) => {
            rounds.forEach(round => {
                Object.values(round.accounts).forEach(account => {
                    account.utxos.forEach(utxo => {
                        expect(utxo.registrationData).toBeTruthy();
                    });
                });
            });
            expect(failed.length).toBe(0);
            done();
        });
    }, 50000);

    it('interruption caused by coordinator response at second input', done => {
        server?.addListener('test-request', (data, req, res) => {
            if (req.url?.includes('input-registration') && data.ownershipProof === '00AB') {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify({ errorCode: 'WrongPhase' }));
                res.end();
            }
            req.emit('test-response');
        });
        const rounds = [
            {
                id: '01',
                phase: 0,
                accounts: {
                    account1: {
                        utxos: [
                            { outpoint: 'AA', ownershipProof: '00AA' },
                            { outpoint: 'AB', ownershipProof: '00AB' },
                        ],
                    },
                    account2: {
                        utxos: [
                            { outpoint: 'BA', ownershipProof: '00BA' },
                            { outpoint: 'BB', ownershipProof: '00BB' },
                        ],
                    },
                },
                roundParameters: {
                    coordinationFeeRate: {},
                    inputRegistrationEnd: new Date().getTime() + 10000,
                },
            },
        ] as any;
        processRounds(rounds, [], server?.requestOptions).then(({ failed }) => {
            expect(failed.length).toEqual(3);
            done();
        });
    }, 50000);

    it('interruption caused by abort signal from Arena/CoinjoinClient', done => {
        const arenaAbortController = new AbortController();
        const rounds = [
            {
                id: '01',
                phase: 0,
                accounts: {
                    account1: {
                        utxos: [
                            { outpoint: 'AA', ownershipProof: '00AA' },
                            { outpoint: 'AB', ownershipProof: '00AB' },
                        ],
                    },
                    account2: {
                        utxos: [{ outpoint: 'BA', ownershipProof: '00BA' }],
                    },
                },
                roundParameters: {
                    coordinationFeeRate: {},
                    inputRegistrationEnd: new Date().getTime() + 10000,
                },
            },
        ] as any;
        processRounds(rounds, [], {
            ...server?.requestOptions,
            signal: arenaAbortController.signal,
        }).then(({ failed }) => {
            expect(failed.length).toEqual(3);
            done();
        });
        arenaAbortController.abort();
    });

    it('no active rounds to process', async () => {
        const result = await processRounds([], [], server?.requestOptions);
        expect(result.rounds).toEqual([]);
    });
});
