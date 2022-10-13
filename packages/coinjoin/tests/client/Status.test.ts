import { Status } from '../../src/client/Status';
import { createServer, Server } from '../mocks/server';
import { DEFAULT_ROUND } from '../fixtures/round.fixture';

let server: Server | undefined;

const waitForStatus = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// mock STATUS_TIMEOUT
jest.mock('../../src/constants', () => {
    const originalModule = jest.requireActual('../../src/constants');
    return {
        __esModule: true,
        ...originalModule,
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

        const requestListener = jest.fn(req => {
            expect(req.headers).toMatchObject({
                'proxy-authorization': 'Basic Satoshi',
            });
        });
        server?.addListener('test-handle-request', requestListener);

        await status.start();

        status.setMode('enabled');

        await waitForStatus(3100); // wait 3 sec (mocked STATUS_TIMEOUT.enabled)

        expect(requestListener).toHaveBeenCalledTimes(2);

        status.setMode('registered');
        await waitForStatus(600); // wait 0.5 sec (mocked STATUS_TIMEOUT.registered)

        expect(requestListener).toHaveBeenCalledTimes(3);

        status.setMode('idle');
        await waitForStatus(5000 + 600); // wait 5 sec (mocked STATUS_TIMEOUT.idle)

        expect(requestListener).toHaveBeenCalledTimes(5); // 5 because new timeout is greater than current (STATUS_TIMEOUT.registered < STATUS_TIMEOUT.idle)

        status.stop();
    }, 10000);

    it('Status identities', async () => {
        const status = new Status(server?.requestOptions);

        const identities: string[] = [];
        const requestListener = jest.fn(req => {
            const id = req.headers['proxy-authorization'];
            if (!identities.includes(id)) {
                identities.push(id);
            }
        });
        server?.addListener('test-handle-request', requestListener);

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
                        Type: 'RoundCreated',
                        roundParameters: {
                            coordinationFeeRate: {},
                            connectionConfirmationTimeout: '0d 0h 0m 5s',
                            outputRegistrationTimeout: '0d 0h 0m 2s',
                            transactionSigningTimeout: '0d 0h 0m 2s',
                        },
                    },
                ],
            },
        };

        server?.addListener('test-request', ({ url }, req, _res) => {
            let response: any;
            if (url.endsWith('/status')) {
                response = {
                    roundStates: [round],
                };
            }
            req.emit('test-response', response);
        });

        status.setMode('enabled');
        await status.start();

        await waitForStatus(600); // wait 0.6 sec (inputRegistrationEnd)

        expect(requestListener).toHaveBeenCalledTimes(2); // status fetched twice, because Round.inputRegistrationEnd timeout < STATUS_TIMEOUT.enabled
        expect(onUpdateListener).toHaveBeenCalledTimes(1); // status changed only once

        let phase = 0;
        server?.removeAllListeners('test-request');
        server?.addListener('test-request', ({ url }, req, _res) => {
            let response: any;
            if (url.endsWith('/status')) {
                if (phase < 4) phase++;
                response = {
                    roundStates: [
                        {
                            ...round,
                            phase,
                        },
                    ],
                };
            }
            req.emit('test-response', response);
        });

        await waitForStatus(3100); // wait 3 sec (STATUS_TIMEOUT.enabled)

        expect(requestListener).toHaveBeenCalledTimes(3);
        expect(onUpdateListener).toHaveBeenCalledTimes(2);

        await waitForStatus(2100); // wait 2 sec (connectionConfirmationTimeout 5 sec - 3 sec from previous tick)

        expect(requestListener).toHaveBeenCalledTimes(4);
        expect(onUpdateListener).toHaveBeenCalledTimes(3);

        await waitForStatus(2100); // wait 2 sec (outputRegistrationTimeout)

        expect(requestListener).toHaveBeenCalledTimes(5);
        expect(onUpdateListener).toHaveBeenCalledTimes(4);

        await waitForStatus(2500); // wait 2 sec (transactionSigningTimeout)

        expect(requestListener).toHaveBeenCalledTimes(6);
        expect(onUpdateListener).toHaveBeenCalledTimes(5);

        status.stop();
    }, 20000);

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
