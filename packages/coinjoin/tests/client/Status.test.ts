import { Status } from '../../src/client/Status';
import { ROUND_REGISTRATION_END_OFFSET, STATUS_TIMEOUT } from '../../src/constants';
import { createServer } from '../mocks/server';
import { DEFAULT_ROUND, ROUND_CREATION_EVENT, AFFILIATE_INFO } from '../fixtures/round.fixture';

let server: Awaited<ReturnType<typeof createServer>>;

const waitForStatus = (ms: number) => new Promise(resolve => setTimeout(resolve, ms + 100));

// mock STATUS_TIMEOUT
jest.mock('../../src/constants', () => {
    const originalModule = jest.requireActual('../../src/constants');
    return {
        __esModule: true,
        ...originalModule,
        HTTP_REQUEST_TIMEOUT: 1000,
        STATUS_TIMEOUT: {
            idle: 5000, // no registered accounts, occasionally fetch status to read fees
            enabled: 3000, // account is registered but utxo was not paired with Round
            registered: 500, // utxo is registered in Round
        },
    };
});

describe('Status', () => {
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

    it('Status mode timeouts', async () => {
        const status = new Status(server?.requestOptions);

        const requestListener = jest.fn(({ request, resolve }) => {
            expect(request.headers).toMatchObject({
                'proxy-authorization': 'Basic Satoshi',
            });
            resolve();
        });
        server?.addListener('test-request', requestListener);

        await status.start();

        status.setMode('enabled');

        await waitForStatus(STATUS_TIMEOUT.enabled); // wait 3 sec (mocked STATUS_TIMEOUT.enabled)

        expect(requestListener).toHaveBeenCalledTimes(2);

        status.setMode('registered');
        await waitForStatus(STATUS_TIMEOUT.registered); // wait 0.5 sec (mocked STATUS_TIMEOUT.registered)

        expect(requestListener).toHaveBeenCalledTimes(3);

        status.setMode('idle');
        await waitForStatus(STATUS_TIMEOUT.idle + STATUS_TIMEOUT.registered); // wait 5.5 sec (mocked STATUS_TIMEOUT.idle)

        expect(requestListener).toHaveBeenCalledTimes(5); // 5 because new timeout is greater than current (STATUS_TIMEOUT.registered < STATUS_TIMEOUT.idle)

        status.stop();
    }, 10000);

    it('Status identities', async () => {
        const status = new Status(server?.requestOptions);

        const identities: string[] = [];
        const requestListener = jest.fn(({ request, resolve }) => {
            const id = request.headers['proxy-authorization'];
            if (!identities.includes(id)) {
                identities.push(id);
            }
            resolve();
        });
        server?.addListener('test-request', requestListener);

        await status.start();

        status.addIdentity('A');
        status.addIdentity('B');
        status.addIdentity('C');

        status.setMode('registered');
        await waitForStatus(5000); // wait 5 sec, collect multiple requests

        expect(identities.length).toBeGreaterThanOrEqual(2); // at least two identities used. probably all defined above were used but it's not deterministic

        status.removeIdentity('A');
        status.removeIdentity('B');
        status.removeIdentity('C');
        identities.splice(0);

        await waitForStatus(3000); // wait 3 sec, collect multiple requests
        expect(identities.length).toEqual(1); // only default identity left

        status.stop();
    }, 10000);

    it('Status start and immediate stop', done => {
        const status = new Status(server?.requestOptions);
        const errorListener = jest.fn();
        status.on('exception', errorListener);
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

        // resolved in then block
    });

    it('Status start attempts, keep lifecycle regardless of failed requests', async done => {
        let request = 0;

        server?.addListener('test-request', ({ resolve }) => {
            if (request === 6) {
                resolve({
                    roundStates: [{ ...DEFAULT_ROUND, phase: 1 }],
                    affiliateInformation: AFFILIATE_INFO,
                });
            } else {
                setTimeout(
                    () => {
                        resolve({
                            roundStates: [DEFAULT_ROUND],
                            affiliateInformation: AFFILIATE_INFO,
                        });
                    },
                    request % 2 === 0 ? 5000 : 0, // timeout error on every second request
                );
            }
            request++;
        });

        const status = new Status(server?.requestOptions);

        const errorListener = jest.fn();
        status.on('exception', errorListener);
        const updateListener = jest.fn();
        status.on('update', updateListener);

        await status.start();
        status.setMode('registered'); // set faster iterations

        status.on('update', () => {
            expect(errorListener).toHaveBeenCalledTimes(2);
            expect(updateListener).toHaveBeenCalledTimes(2);
            status.stop();
            done();
        });
    }, 7000);

    it('Status onStatusChange', async () => {
        const status = new Status(server?.requestOptions);

        const onUpdateListener = jest.fn();
        status.on('update', onUpdateListener);

        const requestListener = jest.fn();
        server?.addListener('test-handle-request', requestListener);

        const round = {
            ...DEFAULT_ROUND,
            inputRegistrationEnd: Date.now() + 500,
            coinjoinState: {
                events: [
                    {
                        ...ROUND_CREATION_EVENT,
                        roundParameters: {
                            ...ROUND_CREATION_EVENT.roundParameters,
                            connectionConfirmationTimeout: '0d 0h 0m 5s',
                            outputRegistrationTimeout: '0d 0h 0m 2s',
                            transactionSigningTimeout: '0d 0h 0m 2s',
                        },
                    },
                ],
            },
        };

        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                resolve({
                    roundStates: [round],
                    affiliateInformation: AFFILIATE_INFO,
                });
            }
            resolve();
        });

        status.setMode('enabled');
        await status.start();

        await waitForStatus(ROUND_REGISTRATION_END_OFFSET + 600); // wait 0.6 sec + offset (inputRegistrationEnd)

        expect(requestListener).toHaveBeenCalledTimes(2); // status fetched twice, because Round.inputRegistrationEnd timeout < STATUS_TIMEOUT.enabled
        expect(onUpdateListener).toHaveBeenCalledTimes(1); // status changed only once

        server?.removeAllListeners('test-request');
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                round.phase++;
                if (round.phase <= 4) {
                    resolve({
                        roundStates: [
                            round,
                            {
                                ...round,
                                id: 'pendingRound',
                                phase: 2, // intentionally keep it in one phase, see pendingRound explanation below
                            },
                        ],
                        affiliateInformation: AFFILIATE_INFO,
                    });
                } else {
                    // remove all rounds from state
                    resolve({
                        roundStates: [],
                        affiliateInformation: AFFILIATE_INFO,
                    });
                }
            }
        });

        await waitForStatus(STATUS_TIMEOUT.enabled); // wait 3 sec (STATUS_TIMEOUT.enabled)

        expect(requestListener).toHaveBeenCalledTimes(3);
        expect(onUpdateListener).toHaveBeenCalledTimes(2);
        await waitForStatus(STATUS_TIMEOUT.enabled); // wait 3 sec of STATUS_TIMEOUT.enabled  < connectionConfirmationTimeout 5 sec

        expect(requestListener).toHaveBeenCalledTimes(4);
        expect(onUpdateListener).toHaveBeenCalledTimes(3);

        await waitForStatus(2000); // wait 2 sec of outputRegistrationTimeout < STATUS_TIMEOUT.enabled 3 sec

        expect(requestListener).toHaveBeenCalledTimes(5);
        expect(onUpdateListener).toHaveBeenCalledTimes(4);

        await waitForStatus(2000); // wait 2 sec of transactionSigningTimeout < STATUS_TIMEOUT.enabled 3 sec

        expect(requestListener).toHaveBeenCalledTimes(6);
        expect(onUpdateListener).toHaveBeenCalledTimes(5);

        await waitForStatus(STATUS_TIMEOUT.enabled); // wait 3 sec (STATUS_TIMEOUT.enabled)
        expect(requestListener).toHaveBeenCalledTimes(7);
        expect(onUpdateListener).toHaveBeenCalledTimes(6);

        // pendingRound should be ended. /status didn't report phase change until now, but round does not exists anymore
        const lastParams = onUpdateListener.mock.calls[5][0];
        expect(lastParams).toMatchObject({
            changed: [expect.objectContaining({ id: 'pendingRound', phase: 4 })],
            rounds: [],
        });

        status.stop();
    }, 20000);

    it('Status onStatusChange with delayed affiliateRequest', async () => {
        const round = {
            ...DEFAULT_ROUND,
            phase: 3,
            inputRegistrationEnd: Date.now(),
            coinjoinState: {
                events: [
                    {
                        ...ROUND_CREATION_EVENT,
                        roundParameters: {
                            ...ROUND_CREATION_EVENT.roundParameters,
                            transactionSigningTimeout: '0d 0h 0m 1s',
                        },
                    },
                ],
            },
        };

        const affiliateData = Buffer.from('{}', 'utf-8').toString('base64');
        const requestListener = jest.fn();
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                const calls = requestListener.mock.calls.length;
                requestListener();

                if (calls > 2) {
                    // start sending coinjoinRequests after third iteration
                    const coinjoinRequests = { [round.id]: { trezor: affiliateData } };
                    resolve({
                        roundStates: [round],
                        affiliateInformation: {
                            ...AFFILIATE_INFO,
                            coinjoinRequests,
                        },
                    });
                } else {
                    resolve({
                        roundStates: [round],
                        affiliateInformation: AFFILIATE_INFO,
                    });
                }
            }
        });

        const status = new Status(server?.requestOptions);

        const onUpdateListener = jest.fn();
        status.on('update', onUpdateListener);

        status.setMode('enabled');
        await status.start();

        expect(requestListener).toHaveBeenCalledTimes(1); // status fetched once, on start
        expect(onUpdateListener).toHaveBeenCalledTimes(1); // status changed once, on start

        await waitForStatus(3000); // wait 3 iterations, transactionSigningTimeout = 1 sec.

        expect(requestListener).toHaveBeenCalledTimes(4); // status fetched 4 times
        expect(onUpdateListener).toHaveBeenCalledTimes(2); // status changed twice, coinjoinRequests added at 3rd iteration

        expect(onUpdateListener.mock.calls[1][0]).toMatchObject({
            changed: [{ affiliateRequest: affiliateData }],
        });
    });

    it('just for coverage', () => {
        const status = new Status(server?.requestOptions);
        status.getStatus(); // calling getStatus before start

        status.addIdentity('A');
        status.addIdentity('A'); // adding same identity twice

        status.setMode('idle');
        status.setMode('idle'); // set same mode twice

        status.stop();
    });
});
