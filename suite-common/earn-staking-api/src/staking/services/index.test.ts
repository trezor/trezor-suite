import type * as contextModule from '../../context';

import type * as servicesModule from './index';

const LOCALHOST_BASE_URL = 'http://localhost:3001/staking/v1';
const DEV_BASE_URL = 'https://dev-earn.suite.sldev.cz/staking/v1';

let fetchSpy: jest.SpiedFunction<typeof fetch>;
let earnStakingWorkerBaseUrl: typeof contextModule.earnStakingWorkerBaseUrl;
let reportStakingTxIds: typeof servicesModule.reportStakingTxIds;

const sendReport = () =>
    reportStakingTxIds({ body: { txid: 'a'.repeat(64), network: 'tron', kind: 'vote' } });

const getRequestedUrls = () => fetchSpy.mock.calls.map(([request]) => (request as Request).url);

const flushPendingTasks = () => new Promise(resolve => setTimeout(resolve, 0));

// `createHttpClient` captures `globalThis.fetch` when the services module is evaluated, so the spy
// has to exist before it is loaded. Fresh modules also give every test an unset context.
beforeEach(() => {
    jest.resetModules();
    fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(new Response('{}')));
    ({ earnStakingWorkerBaseUrl } = require('../../context') as typeof contextModule);
    ({ reportStakingTxIds } = require('./index') as typeof servicesModule);
});

afterEach(() => {
    fetchSpy.mockRestore();
});

describe('earn staking worker requests', () => {
    it('are sent to the base URL selected in the context', async () => {
        earnStakingWorkerBaseUrl.set(LOCALHOST_BASE_URL);

        await sendReport();

        expect(getRequestedUrls()).toEqual([`${LOCALHOST_BASE_URL}/report`]);
    });

    it('wait until a base URL is selected', async () => {
        const pendingReport = sendReport();
        await flushPendingTasks();

        expect(fetchSpy).not.toHaveBeenCalled();

        earnStakingWorkerBaseUrl.set(DEV_BASE_URL);
        await pendingReport;

        expect(getRequestedUrls()).toEqual([`${DEV_BASE_URL}/report`]);
    });

    it('follow a newly selected base URL', async () => {
        earnStakingWorkerBaseUrl.set(DEV_BASE_URL);
        await sendReport();

        earnStakingWorkerBaseUrl.set(LOCALHOST_BASE_URL);
        await sendReport();

        expect(getRequestedUrls()).toEqual([
            `${DEV_BASE_URL}/report`,
            `${LOCALHOST_BASE_URL}/report`,
        ]);
    });
});
