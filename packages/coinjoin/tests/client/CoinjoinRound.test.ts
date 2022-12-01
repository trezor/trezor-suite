import { createServer } from '../mocks/server';
import { DEFAULT_ROUND, createCoinjoinRound } from '../fixtures/round.fixture';
import { createInput } from '../fixtures/input.fixture';
import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';
import * as CONSTANTS from '../../src/constants';

let server: Awaited<ReturnType<typeof createServer>>;

const PRISON = new CoinjoinPrison();

// mock random delay function
jest.mock('@trezor/utils', () => {
    const originalModule = jest.requireActual('@trezor/utils');
    return {
        __esModule: true,
        ...originalModule,
        getRandomNumberInRange: () => 0,
    };
});

// mock ROUND_PHASE_PROCESS_TIMEOUT, use getter to mock individually for each test
jest.mock('../../src/constants', () => {
    const originalModule = jest.requireActual('@trezor/utils');
    return {
        __esModule: true,
        ...originalModule,
        get ROUND_PHASE_PROCESS_TIMEOUT() {
            return 10000;
        },
    };
});

describe(`CoinjoinRound`, () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server.removeAllListeners('test-request');
    });

    afterAll(() => {
        server.close();
        jest.clearAllMocks();
    });

    it('onPhaseChange lock cool off resolved', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/connection-confirmation')) {
                spy();
            }
            resolve();
        });

        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
            ],
            {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    connectionConfirmationTimeout: '0d 0h 0m 5s',
                },
            },
        );

        // process but not wait for the result
        round.process([], PRISON);

        // confirmationInterval is now set to ~2.5 sec.
        // we want to change phase earlier
        await new Promise(resolve => setTimeout(resolve, 500));

        // change Round phase before confirmationInterval was called
        await round.onPhaseChange({ ...DEFAULT_ROUND, phase: 1 });

        // confirmationData should be assigned,
        // confirmationInterval was called successfully,
        // lock was not aborted
        round.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.confirmationData).not.toBeUndefined();
        });
        expect(spy).toBeCalledTimes(2); // two confirmations

        await round.process([], PRISON);
        round.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.confirmationData).not.toBeUndefined();
        });
        expect(spy).toBeCalledTimes(2); // no more confirmations
    });

    it('onPhaseChange lock cool off aborted', async () => {
        jest.spyOn(CONSTANTS, 'ROUND_PHASE_PROCESS_TIMEOUT', 'get').mockReturnValue(500 as any);

        const spy = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/connection-confirmation')) {
                spy();
            }
            resolve();
        });

        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
            ],
            {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    connectionConfirmationTimeout: '0d 0h 0m 5s',
                },
            },
        );

        // process phase 0 but not wait for the result
        round.process([], PRISON);

        // confirmationInterval is now set to ~2.5 sec.
        // we want to change phase earlier
        await new Promise(resolve => setTimeout(resolve, 500));

        // change Round phase before confirmationInterval was called
        await round.onPhaseChange({ ...DEFAULT_ROUND, phase: 1 });

        // confirmationData should NOT be assigned,
        // confirmationInterval was aborted,
        // lock was aborted
        round.inputs.forEach(input => {
            expect(input.error).toBeUndefined(); // confirmationInterval errors are "expected" therefore not assigned
            expect(input.confirmationData).toBeUndefined();
            expect(input.confirmationParams).not.toBeUndefined(); // confirmationParams are stored for retry
        });
        expect(spy).toBeCalledTimes(0); // no confirmations

        // process phase 1
        await round.process([], PRISON);

        // confirmationData are assigned
        round.inputs.forEach(input => {
            expect(input.confirmationData).not.toBeUndefined();
            expect(input.confirmationParams).toBeUndefined(); // params are cleared
        });
        expect(spy).toBeCalledTimes(2); // two confirmations
    });

    it('onPhaseChange lock cool off not used', async () => {
        const spy = jest.fn();
        server.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/input-registration')) {
                spy();
                // throttle request so it can be aborted
                setTimeout(resolve, 5000);
            } else {
                resolve();
            }
        });

        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
            ],
            {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 5000 },
            },
        );

        // process but not wait for the result
        round.process([], PRISON);

        // we want to change phase before input-registration response
        await new Promise(resolve => setTimeout(resolve, 500));

        // change Round phase to Ended
        await round.onPhaseChange({ ...DEFAULT_ROUND, phase: 4 });

        expect(round.inputs.length).toBe(0); // no valid inputs, requests aborted
        expect(round.failed.length).toBe(0); // no errored inputs, inputs with errors in inputRegistration are not passed further

        expect(spy).toBeCalledTimes(2); // two registrations called
    });
});
