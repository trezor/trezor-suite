import * as trezorUtils from '@trezor/utils';

import { createServer } from '../mocks/server';
import { DEFAULT_ROUND, createCoinjoinRound } from '../fixtures/round.fixture';
import { createInput } from '../fixtures/input.fixture';
import * as CONSTANTS from '../../src/constants';

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
    const originalModule = jest.requireActual('../../src/constants');

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
    let server: Awaited<ReturnType<typeof createServer>>;
    const logger = {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    beforeAll(async () => {
        server = await createServer();
    });

    afterEach(() => {
        jest.clearAllMocks();
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        server?.close();
    });

    it('catch not signed Round (missing affiliate request)', async () => {
        // create CoinjoinRound in phase 3 (TransactionSigning)
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                }),
            ],
            {
                ...server?.requestOptions,
                logger,
                round: {
                    phase: 3,
                    addresses: [
                        {
                            accountKey: 'account-A',
                            address: 'doesnt matter',
                            path: '',
                            scriptPubKey: '',
                        },
                    ],
                },
            },
        );
        // tx not signed, waiting for affiliate request
        await round.process([]);

        // change phase to Ended
        await round.onPhaseChange({ ...DEFAULT_ROUND, Phase: 4, EndRoundState: 5 });

        await round.process([]);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringMatching(/Missing affiliate request/),
        );
    });

    it('catch failed Round', async () => {
        // create CoinjoinRound in phase 2 (OutputRegistration)
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', {
                    ownershipProof: '01A1',
                    registrationData: {
                        AliceId: '01A1-01a1',
                    },
                    realAmountCredentials: {},
                    realVsizeCredentials: {},
                    confirmationData: {},
                    confirmedAmountCredentials: {},
                    confirmedVsizeCredentials: {},
                }),
            ],
            {
                ...server?.requestOptions,
                logger,
                round: {
                    phase: 2,
                    affiliateRequest: Buffer.from('0'.repeat(97 * 2 + 4), 'hex').toString('base64'),
                },
            },
        );

        // process phase (will throw error Missing credentials to join)
        await round.process([]);

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringMatching(/Output registration failed/),
        );
    });

    it('end Round if any input-registration fails and there is only one account', async () => {
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.endsWith('/input-registration') && data.Input === 'A2') {
                // fail on second input
                reject(500, { errorCode: 'InputBanned', exceptionData: {} });
            }
            resolve();
        });

        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-A', 'A2', { ownershipProof: '01A2' }),
                createInput('account-A', 'A3', { ownershipProof: '01A3' }),
            ],
            server?.requestOptions,
        );

        await round.process([]);

        expect(round.phase).toBe(4); // RoundPhase.Ended
        expect(round.inputs.length).toBe(0); // all inputs are removed
    });

    it('exclude all account inputs from the Round if any input-registration fails', async () => {
        server?.addListener('test-request', ({ url, data, resolve, reject }) => {
            if (url.endsWith('/input-registration') && data.Input === 'B2') {
                // fail on second input of account-B
                reject(500, { errorCode: 'InputBanned', exceptionData: {} });
            }
            resolve();
        });

        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
                createInput('account-A', 'A2', { ownershipProof: '01A2' }),
                createInput('account-B', 'B2', { ownershipProof: '01B2' }),
            ],
            server?.requestOptions,
        );

        await round.process([]);

        expect(round.phase).toBe(0); // RoundPhase did not ended
        expect(round.inputs.map(i => i.outpoint)).toEqual(['A1', 'A2']); // inputs from the account-A are still in the Round

        round.unregisterAccount('account-A'); // unregister account-A to stop confirmationInterval
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
                    ConnectionConfirmationTimeout: '0d 0h 0m 4s',
                },
            },
        );

        // process but not wait for the result
        round.process([]);

        // input-registration is now set with delay ~0.8 sec.
        // we want to change phase earlier
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(registrationSpy).toHaveBeenCalledTimes(0); // no registrations yet

        // change Round phase before input-registration was called
        await round.onPhaseChange({ ...DEFAULT_ROUND, Phase: 1 });

        // registrationData should be assigned,
        // confirmationInterval should be assigned,
        // lock was not aborted (no error in input => signal was not aborted)
        round.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.registrationData).not.toBeUndefined();
            expect(input.getConfirmationInterval).not.toBeUndefined();
        });
        expect(registrationSpy).toHaveBeenCalledTimes(2); // two registrations
        expect(confirmationSpy).toHaveBeenCalledTimes(0); // no confirmations yet

        await round.process([]);
        round.inputs.forEach(input => {
            expect(input.error).toBeUndefined();
            expect(input.confirmationData).not.toBeUndefined();
        });
        expect(confirmationSpy).toHaveBeenCalledTimes(2); // two confirmations

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
                    ConnectionConfirmationTimeout: '0d 0h 0m 5s',
                },
            },
        );

        // process phase 0 but not wait for the result
        round.process([]);

        // input-registration will respond in  ~2 sec.
        // we want to change phase earlier
        await new Promise(resolve => setTimeout(resolve, 500));

        // change Round phase before input-registration was called
        await round.onPhaseChange({ ...DEFAULT_ROUND, Phase: 1 });

        // registrationData should NOT be assigned,
        // confirmationInterval should NOT be assigned,
        // lock was aborted, registration request was aborted
        round.inputs.forEach(input => {
            expect(input.error?.message).toMatch(/Aborted by signal/);
            expect(input.registrationData).toBeUndefined();
            expect(input.getConfirmationInterval()).toBeUndefined();
        });

        // process phase 1
        await round.process([]);

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
        round.process([]);

        // we want to change phase before input-registration response
        await new Promise(resolve => setTimeout(resolve, 500));

        // change Round phase to Ended
        await round.onPhaseChange({ ...DEFAULT_ROUND, Phase: 4 });

        expect(round.inputs.length).toBe(0); // no valid inputs, requests aborted
        expect(round.failed.length).toBe(0); // no errored inputs, inputs with errors in inputRegistration are not passed further

        expect(spy).toHaveBeenCalledTimes(2); // two registrations called
    });

    it('unregisterAccount not in critical phase', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
            ],
            {
                ...server?.requestOptions,
            },
        );

        const spyEnded = jest.fn();
        const spyChanged = jest.fn();
        round.on('ended', spyEnded);
        round.on('changed', spyChanged);

        round.unregisterAccount('account-A');
        expect(spyEnded).toHaveBeenCalledTimes(0); // not called because there is also account-B input in round

        round.unregisterAccount('account-B');
        expect(spyEnded).toHaveBeenCalledTimes(1);
        expect(spyChanged).toHaveBeenCalledTimes(1);
    });

    it('unregisterAccount in critical phase', () => {
        const round = createCoinjoinRound(
            [
                createInput('account-A', 'A1', { ownershipProof: '01A1' }),
                createInput('account-B', 'B1', { ownershipProof: '01B1' }),
            ],
            {
                ...server?.requestOptions,
                round: { phase: 2 },
            },
        );

        const spyEnded = jest.fn();
        const spyChanged = jest.fn();
        round.on('ended', spyEnded);
        round.on('changed', spyChanged);

        round.unregisterAccount('account-A');
        expect(spyEnded).toHaveBeenCalledTimes(1); // called immediately event if there is account-B input in round
        expect(spyChanged).toHaveBeenCalledTimes(1);
    });

    it('unregisterAccount when round is locked', async () => {
        const delayMock = jest
            .spyOn(trezorUtils, 'getRandomNumberInRange')
            .mockImplementation(() => 800);

        const constantsMock = jest
            .spyOn(CONSTANTS, 'ROUND_SELECTION_REGISTRATION_OFFSET', 'get')
            .mockReturnValue(1000 as any);

        const round = createCoinjoinRound(
            [createInput('account-A', 'A1', { ownershipProof: '01A1' })],
            {
                ...server?.requestOptions,
                round: { phaseDeadline: Date.now() + 10000 },
                roundParameters: {
                    ConnectionConfirmationTimeout: '0d 0h 0m 4s',
                },
            },
        );

        const spyEnded = jest.fn();
        const spyChanged = jest.fn();
        round.on('ended', spyEnded);
        round.on('changed', spyChanged);

        // process but not wait for the result
        round.process([]).then(() => {
            expect(spyEnded).toHaveBeenCalledTimes(1);
            expect(spyChanged).toHaveBeenCalledTimes(1);
        });

        // we want to unregister account before input-registration response
        await new Promise(resolve => setTimeout(resolve, 100));
        round.unregisterAccount('account-A');

        delayMock.mockRestore();
        constantsMock.mockRestore();
    });
});
