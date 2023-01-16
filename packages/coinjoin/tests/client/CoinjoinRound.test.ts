import * as trezorUtils from '@trezor/utils';

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
        get ROUND_SELECTION_REGISTRATION_OFFSET() {
            return 30000;
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
        const delayMock = jest
            .spyOn(trezorUtils, 'getRandomNumberInRange')
            .mockImplementation(() => 800);

        const constantsMock = jest
            .spyOn(CONSTANTS, 'ROUND_SELECTION_REGISTRATION_OFFSET', 'get')
            .mockReturnValue(1000 as any);

        const registrationSpy = jest.fn();
        const confirmationSpy = jest.fn();

        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/input-registration')) {
                registrationSpy();
            }
            if (url.endsWith('/connection-confirmation')) {
                confirmationSpy();
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
                    connectionConfirmationTimeout: '0d 0h 0m 4s',
                },
            },
        );

        // process but not wait for the result
        round.process([], PRISON);

        // input-registration is now set with delay ~0.8 sec.
        // we want to change phase earlier
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(registrationSpy).toBeCalledTimes(0); // no registrations yet

        // change Round phase before input-registration was called
        await round.onPhaseChange({ ...DEFAULT_ROUND, phase: 1 });

        // registrationData should be assigned,
        // confirmationInterval should be assigned,
        // lock was not aborted (no error in input => signal was not aborted)
        round.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.registrationData).not.toBeUndefined();
            expect(input.getConfirmationInterval).not.toBeUndefined();
        });
        expect(registrationSpy).toBeCalledTimes(2); // two registrations
        expect(confirmationSpy).toBeCalledTimes(0); // no confirmations yet

        await round.process([], PRISON);
        round.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.confirmationData).not.toBeUndefined();
        });
        expect(confirmationSpy).toBeCalledTimes(2); // two confirmations

        delayMock.mockRestore();
        constantsMock.mockRestore();
    });

    it('onPhaseChange lock cool off aborted', async () => {
        const constantsMock = jest
            .spyOn(CONSTANTS, 'ROUND_PHASE_PROCESS_TIMEOUT', 'get')
            .mockReturnValue(500 as any);

        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/input-registration')) {
                setTimeout(resolve, 2000);
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
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    connectionConfirmationTimeout: '0d 0h 0m 5s',
                },
            },
        );

        // process phase 0 but not wait for the result
        round.process([], PRISON);

        // input-registration will respond in  ~2 sec.
        // we want to change phase earlier
        await new Promise(resolve => setTimeout(resolve, 500));

        // change Round phase before input-registration was called
        await round.onPhaseChange({ ...DEFAULT_ROUND, phase: 1 });

        // registrationData should NOT be assigned,
        // confirmationInterval should NOT be assigned,
        // lock was aborted, registration request was aborted
        round.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/Aborted by signal/);
            expect(input.registrationData).toBeUndefined();
            expect(input.getConfirmationInterval()).toBeUndefined();
        });

        // process phase 1
        await round.process([], PRISON);

        expect(round.inputs.length).toBe(0); // no valid inputs, requests aborted
        expect(round.failed.length).toBe(0); // no errored inputs, inputs with errors in inputRegistration are not passed further

        constantsMock.mockRestore();
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
