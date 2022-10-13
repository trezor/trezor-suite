import { CoinjoinClient } from '../../src';
import { createServer, Server } from '../mocks/server';
import { DEFAULT_ROUND } from '../fixtures/round.fixture';

let server: Server | undefined;

describe(`CoinjoinClient`, () => {
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

    it('enable success', async () => {
        server?.addListener('test-request', ({ url }, req, _res) => {
            let response: any;
            if (url.endsWith('/status')) {
                response = {
                    roundStates: [DEFAULT_ROUND],
                    coinJoinFeeRateMedians: [],
                };
            }
            req.emit('test-response', response);
        });

        const cli = new CoinjoinClient({
            network: 'regtest',
            ...server?.requestOptions,
        });

        const status = await cli.enable();
        expect(status?.rounds.length).toBeGreaterThan(0);
        expect(status?.coordinatorFeeRate).toBeGreaterThan(0);

        cli.disable();
    });
});
