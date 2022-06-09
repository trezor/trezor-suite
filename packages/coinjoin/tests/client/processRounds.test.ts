import { CoinjoinRound } from '../../src/client/CoinjoinRound';
import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import { createServer, Server } from '../mocks/server';
import { createInput } from '../fixtures/input.fixture';
import { createCoinjoinRound, DEFAULT_ROUND } from '../fixtures/round.fixture';

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

// partial CoinjoinClient.onStatusUpdate
const processRounds = (rounds: CoinjoinRound[]) =>
    Promise.all(
        rounds.map(round =>
            // wait for the result
            round.process([], new CoinjoinPrison()),
        ),
    );

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

    it('interruption caused by Round phase change (triggered by CoinjoinClient.onStatusUpdate)', async () => {
        const rounds = [
            createCoinjoinRound(
                [
                    createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                    createInput('account-B', 'B1', { ownershipProof: '01B1' }),
                ],
                server?.requestOptions,
            ),
            createCoinjoinRound([createInput('account-A', 'A2', { ownershipProof: '02A2' })], {
                ...server?.requestOptions,
                round: { id: '02' },
            }),
        ];
        // run process but don't await for result
        processRounds(rounds);
        // changing phase will interrupt only 1st round process
        await rounds[0].onPhaseChange({ ...DEFAULT_ROUND, phase: 1 });

        // immediately call process again
        const result = await processRounds(rounds);

        expect(result[0].inputs.length).toEqual(0);
        expect(result[0].failed.length).toEqual(2); // first round failed/interrupted

        expect(result[1].inputs.length).toEqual(1); // second round is still running normally
        expect(result[1].failed.length).toEqual(0);
    });

    it('interruption caused by coordinator response at second input', done => {
        server?.addListener('test-request', ({ url, data }, req, res) => {
            if (
                (url.includes('input-registration') && data.ownershipProof === '01A2') ||
                url.includes('connection-confirmation')
            ) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.write(JSON.stringify({ errorCode: 'WrongPhase' }));
                res.end();
            }
            req.emit('test-response');
        });
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-A', 'A2', { ownershipProof: '01A2' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
                createInput('account-B', 'B2', { ownershipProof: '01B2' }),
            ],
            server?.requestOptions,
        );
        round.inputRegistrationEnd = new Date(Date.now() + 20000).toString(); // set value to use confirmOutput timeout
        round.roundParameters.connectionConfirmationTimeout = '0d 0h 0m 10s'; // new Date().getTime() + 60000; // set value to use confirmOutput timeout

        processRounds([round]).then(rounds => {
            expect(rounds[0].inputs.length).toEqual(1); // only one input was registered
            expect(rounds[0].failed.length).toEqual(3);
            done();
        });
    }, 70000);

    it('interruption caused by abort signal from CoinjoinClient', done => {
        const arenaAbortController = new AbortController();
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-A', 'A2', { ownershipProof: '01A2' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
            ],
            { ...server?.requestOptions, signal: arenaAbortController.signal },
        );
        processRounds([round]).then(rounds => {
            expect(rounds[0].failed.length).toEqual(3);
            done();
        });
        arenaAbortController.abort();
    });

    it('multiple independent locks', done => {
        const ROUND1 = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
            ],
            server?.requestOptions,
        );
        processRounds([ROUND1]).then(rounds => {
            rounds.forEach(round => {
                round.inputs.forEach(input => {
                    expect(input.registrationData).toBeTruthy();
                });
                expect(round.failed.length).toBe(0);
            });
        });

        const ROUND2 = createCoinjoinRound(
            [
                createInput('account-A', 'A2', { ownershipProof: '02A2' }),
                createInput('account-B', 'B2', { ownershipProof: '02B2' }),
            ],
            { ...server?.requestOptions, round: { id: '02' } },
        );
        processRounds([ROUND2]).then(rounds => {
            rounds.forEach(round => {
                round.inputs.forEach(input => {
                    expect(input.registrationData).toBeTruthy();
                });
                expect(round.failed.length).toBe(0);
            });
        });

        const ROUND3 = createCoinjoinRound(
            [
                createInput('account-A', 'A3', { ownershipProof: '03A3' }),
                createInput('account-B', 'B3', { ownershipProof: '03B3' }),
            ],
            { ...server?.requestOptions, round: { id: '03' } },
        );
        processRounds([ROUND3]).then(rounds => {
            rounds.forEach(round => {
                round.inputs.forEach(input => {
                    expect(input.registrationData).toBeTruthy();
                });
                expect(round.failed.length).toBe(0);
            });
            done();
        });
    }, 50000);
});
