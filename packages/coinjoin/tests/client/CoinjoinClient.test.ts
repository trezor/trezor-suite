import { CoinjoinClient } from '../../src';
import { createServer } from '../mocks/server';
import { DEFAULT_ROUND, AFFILIATE_INFO } from '../fixtures/round.fixture';

let server: Awaited<ReturnType<typeof createServer>>;

describe(`CoinjoinClient`, () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('enable success', async () => {
        server?.addListener('test-request', ({ url, resolve }) => {
            if (url.endsWith('/status')) {
                resolve({
                    roundStates: [DEFAULT_ROUND],
                    coinJoinFeeRateMedians: [],
                    affiliateInformation: AFFILIATE_INFO,
                });
            }
            resolve();
        });

        const cli = new CoinjoinClient(server?.requestOptions);

        const status = await cli.enable();
        expect(status?.rounds.length).toBeGreaterThan(0);
        expect(status?.coordinationFeeRate.rate).toBeGreaterThan(0);

        cli.disable();
    });
});
