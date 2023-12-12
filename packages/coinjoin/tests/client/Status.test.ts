import { Status } from '../../src/client/Status';
import * as http from '../../src/client/coordinatorRequest';
import { STATUS_TIMEOUT } from '../../src/constants';
import { createServer } from '../mocks/server';
import {
    AFFILIATE_INFO,
    DEFAULT_ROUND,
    STATUS_EVENT,
    createCoinjoinRound,
} from '../fixtures/round.fixture';

// using fakeTimers and async callbacks
const fastForward = (time: number) => jest.advanceTimersByTimeAsync(time);

// use getters to allow mocking different values in each test case
jest.mock('../../src/constants', () => {
    const originalModule = jest.requireActual('../../src/constants');
    return {
        __esModule: true,
        ...originalModule,
        get HTTP_REQUEST_TIMEOUT() {
            return 200;
        },
        STATUS_TIMEOUT: Object.keys(originalModule.STATUS_TIMEOUT).reduce(
            (obj, key) => ({
                ...obj,
                get [key]() {
                    return originalModule.STATUS_TIMEOUT[key];
                },
            }),
            {},
        ),
    };
});

describe('Status', () => {
    let server: Awaited<ReturnType<typeof createServer>>;
    let status: Status;

    beforeAll(async () => {
        server = await createServer();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();

        status?.stop();

        server?.removeAllListeners('test-handle-request');
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        server?.close();
    });

    it('setStatusTimeout by mode (default timeout)', async () => {
        jest.useFakeTimers();

        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        const coordinatorRequestSpy = jest.fn();
        jest.spyOn(http, 'coordinatorRequest').mockImplementation(url => {
            if (url === 'status') {
                coordinatorRequestSpy();
            }
            return Promise.resolve({
                ...STATUS_EVENT,
                RoundStates: [{ ...DEFAULT_ROUND }],
            });
        });

        status = new Status(server?.requestOptions);
        await status.start();
        expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), STATUS_TIMEOUT.idle);

        expect(setTimeoutSpy.mock.calls[0][1]).toEqual(STATUS_TIMEOUT.idle);

        status.setMode('enabled');
        expect(setTimeoutSpy).toHaveBeenLastCalledWith(
            expect.any(Function),
            STATUS_TIMEOUT.enabled,
        );

        await fastForward(STATUS_TIMEOUT.enabled);
        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(2);

        status.setMode('registered');
        expect(setTimeoutSpy).toHaveBeenLastCalledWith(
            expect.any(Function),
            STATUS_TIMEOUT.registered,
        );

        await fastForward(STATUS_TIMEOUT.registered);

        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(3);

        status.setMode('idle');
        // actually, new timeout is greater than current (STATUS_TIMEOUT.registered < STATUS_TIMEOUT.idle)
        await fastForward(STATUS_TIMEOUT.registered);

        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(4);

        // next timeout is set to idle now
        expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), STATUS_TIMEOUT.idle);
    });

    it('setStatusTimeout by following CoinjoinRound', async () => {
        const coinjoinRound = createCoinjoinRound([], {
            round: {
                phaseDeadline: Date.now() + 1000, // initial phaseDeadline is lower than STATUS_TIMEOUT.enabled / 2
            },
            ...server?.requestOptions,
        });

        jest.useFakeTimers();

        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        const coordinatorRequestSpy = jest.fn();
        jest.spyOn(http, 'coordinatorRequest').mockImplementation(url => {
            if (url === 'status') {
                coordinatorRequestSpy();
            }
            return Promise.resolve({
                ...STATUS_EVENT,
                RoundStates: [{ ...DEFAULT_ROUND, Phase: coordinatorRequestSpy.mock.calls.length }], // increment phase on each request to trigger update event
            });
        });

        const half = STATUS_TIMEOUT.enabled / 2;

        status = new Status(server?.requestOptions);
        status.setMode('enabled');
        status.startFollowRound(coinjoinRound);

        await status.start();

        status.on('update', () => {
            const calls = coordinatorRequestSpy?.mock.calls.length - 1;
            coinjoinRound.phaseDeadline = Date.now() + calls * half + 2500;
        });

        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(1); // status fetched once on start
        expect(setTimeoutSpy.mock.calls[0][1]).toEqual(half); // setTimeout is set to ~1500ms (half of defaultTimeout > coinjoinRound.phaseDeadline)

        await fastForward(half);

        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(2);
        expect(setTimeoutSpy.mock.calls[1][1]).toBeGreaterThan(half); // setTimeout is set to ~2500ms (half of defaultTimeout < coinjoinRound.phaseDeadline < defaultTimeout)
        expect(setTimeoutSpy.mock.calls[1][1]).toBeLessThanOrEqual(half + 2500);

        await fastForward(half + 2500);

        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(3);
        expect(setTimeoutSpy.mock.calls[2][1]).toEqual(STATUS_TIMEOUT.enabled); // setTimeout is set to 3000ms (coinjoinRound.phaseDeadline > defaultTimeout)
    });

    it('Status identities', async () => {
        const identities: string[] = [];
        jest.spyOn(http, 'coordinatorRequest').mockImplementation((url, _b, options) => {
            if (url === 'status') {
                const id = options?.identity;
                if (id && !identities.includes(id)) {
                    identities.push(id);
                }
            }
            return Promise.resolve({
                ...STATUS_EVENT,
                RoundStates: [{ ...DEFAULT_ROUND }],
            });
        });

        jest.useFakeTimers();

        status = new Status(server?.requestOptions);
        await status.start();

        status.addIdentity('A');
        status.addIdentity('B');
        status.addIdentity('C');

        status.setMode('registered');

        // wait 3 iterations
        await fastForward(STATUS_TIMEOUT.registered);
        await fastForward(STATUS_TIMEOUT.registered);
        await fastForward(STATUS_TIMEOUT.registered);

        // at least two identities used. probably all defined above were used but it's not deterministic
        expect(identities.length).toBeGreaterThanOrEqual(2);

        // clear identities
        status.removeIdentity('A');
        status.removeIdentity('B');
        status.removeIdentity('C');
        identities.splice(0);

        // wait 3 iterations
        await fastForward(STATUS_TIMEOUT.registered);
        await fastForward(STATUS_TIMEOUT.registered);
        await fastForward(STATUS_TIMEOUT.registered);

        // only default identity left
        expect(identities.length).toEqual(1);
    });

    it('Status start and immediate stop', done => {
        status = new Status(server?.requestOptions);
        const errorListener = jest.fn();
        status.on('log', errorListener);
        const updateListener = jest.fn();
        status.on('update', updateListener);
        const requestListener = jest.fn();
        server?.addListener('test-handle-request', requestListener);

        // start but not await
        status.start().then(() => {
            expect(requestListener).toHaveBeenCalledTimes(0); // aborted, request not sent
            expect(updateListener).toHaveBeenCalledTimes(0); // not emitted, listener removed by .stop()
            expect(errorListener).toHaveBeenCalledTimes(0); // not emitted, listener removed by .stop()
            done();
        });
        // immediate stop
        status.stop();
    });

    it('Status start attempts, keep lifecycle regardless of failed requests', async () => {
        jest.spyOn(STATUS_TIMEOUT, 'registered', 'get').mockReturnValue(250 as any);

        let request = 0;
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                if (request === 6) {
                    resolve({
                        ...STATUS_EVENT,
                        RoundStates: [{ ...DEFAULT_ROUND, Phase: 1 }],
                    });
                } else if (request > 0 && request % 2 === 0) {
                    // timeout error on every second request
                    setTimeout(resolve, 500);
                } else {
                    resolve();
                }
                request++;
            } else {
                resolve();
            }
        });

        status = new Status(server?.requestOptions);

        const errorListener = jest.fn();
        status.on('log', ({ level }) => {
            if (level === 'warn') errorListener();
        });
        const updateListener = jest.fn();
        status.on('update', updateListener);

        await status.start();
        status.setMode('registered'); // set faster iterations

        await new Promise<void>(resolve => {
            status.on('update', () => {
                expect(errorListener).toHaveBeenCalledTimes(2);
                expect(updateListener).toHaveBeenCalledTimes(2);
                status.stop();
                resolve();
            });
        });
    });

    it('Status onStatusChange with delayed affiliateRequest', async () => {
        const round = {
            ...DEFAULT_ROUND,
            Phase: 3,
        };

        const affiliateDataBase64 = Buffer.from('{}', 'utf-8').toString('base64');

        const coordinatorRequestSpy = jest.fn();
        jest.spyOn(http, 'coordinatorRequest').mockImplementation(url => {
            if (url === 'status') {
                coordinatorRequestSpy();
            }
            return Promise.resolve({
                ...STATUS_EVENT,
                RoundStates: [{ ...round }], // NOTE: always return new reference for the Round from mock
                AffiliateInformation: {
                    ...AFFILIATE_INFO,
                    AffiliateData:
                        coordinatorRequestSpy.mock.calls.length > 3 // return affiliateData after 3rd iteration
                            ? { [round.Id]: { trezor: affiliateDataBase64 } }
                            : AFFILIATE_INFO.AffiliateData,
                },
            });
        });

        jest.useFakeTimers();

        status = new Status(server?.requestOptions);

        const onUpdateListener = jest.fn();
        status.on('update', onUpdateListener);

        status.setMode('enabled');
        await status.start();

        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(1); // status fetched once, on start
        expect(onUpdateListener).toHaveBeenCalledTimes(1); // status changed once, on start

        // wait 3 iterations
        await fastForward(STATUS_TIMEOUT.enabled);
        await fastForward(STATUS_TIMEOUT.enabled);
        await fastForward(STATUS_TIMEOUT.enabled);

        expect(coordinatorRequestSpy).toHaveBeenCalledTimes(4); // status fetched 4 times
        expect(onUpdateListener).toHaveBeenCalledTimes(4); // affiliateData added at 3rd iteration

        expect(onUpdateListener.mock.calls[3][0]).toMatchObject({
            changed: [{ AffiliateRequest: affiliateDataBase64 }],
        });
    });

    it('Status onStatusChange with error in processStatus', async () => {
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                resolve({
                    ...STATUS_EVENT,
                    RoundStates: [{}],
                });
            }
            resolve();
        });

        status = new Status(server?.requestOptions);

        const onUpdateListener = jest.fn();
        const onExceptionListener = jest.fn();
        status.on('update', onUpdateListener);
        status.on('log', onExceptionListener);

        status.setMode('enabled');
        await status.start();

        expect(onUpdateListener).toHaveBeenCalledTimes(0); // status not changed once, error on processing
        expect(onExceptionListener).toHaveBeenCalledTimes(1);
        expect(onExceptionListener).toHaveBeenCalledWith({
            level: 'error',
            payload: expect.any(String), // Cannot read properties of undefined (reading 'events')
        });
    });

    it('just for coverage', () => {
        status = new Status(server?.requestOptions);
        status.getStatus(); // calling getStatus before start

        status.addIdentity('A');
        status.addIdentity('A'); // adding same identity twice

        status.setMode('idle');
        status.setMode('idle'); // set same mode twice
    });
});
