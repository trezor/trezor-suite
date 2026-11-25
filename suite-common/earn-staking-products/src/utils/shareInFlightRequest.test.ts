import { createDeferred } from '@trezor/utils';

import { shareInFlightRequest } from './shareInFlightRequest';

type StatsRequestOptions = {
    routeParams: { networkSymbol: 'eth' | 'sol' };
    signal?: AbortSignal;
};

const createStatsRequest = () => {
    const response = createDeferred<string>();
    const request = jest.fn((_options: StatsRequestOptions) => response.promise);

    return { request, response };
};

const eth = { routeParams: { networkSymbol: 'eth' } } as const;
const sol = { routeParams: { networkSymbol: 'sol' } } as const;

describe('shareInFlightRequest', () => {
    it('sends one request for concurrent calls with the same options', async () => {
        const { request, response } = createStatsRequest();
        const getStats = shareInFlightRequest(request);

        const results = Promise.all([getStats(eth), getStats(eth)]);
        response.resolve('eth stats');

        await expect(results).resolves.toEqual(['eth stats', 'eth stats']);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it('sends a request for each distinct options', () => {
        const { request } = createStatsRequest();
        const getStats = shareInFlightRequest(request);

        getStats(eth);
        getStats(sol);

        expect(request.mock.calls.map(([options]) => options.routeParams)).toEqual([
            eth.routeParams,
            sol.routeParams,
        ]);
    });

    it('sends a new request once the shared one has settled', async () => {
        const { request, response } = createStatsRequest();
        const getStats = shareInFlightRequest(request);
        response.resolve('eth stats');

        await getStats(eth);
        await getStats(eth);

        expect(request).toHaveBeenCalledTimes(2);
    });

    it('fails every concurrent call with the shared failure and retries on the next call', async () => {
        const { request, response } = createStatsRequest();
        const getStats = shareInFlightRequest(request);

        const results = Promise.allSettled([getStats(eth), getStats(eth)]);
        response.reject(new Error('Bad gateway'));

        await expect(results).resolves.toEqual([
            { status: 'rejected', reason: new Error('Bad gateway') },
            { status: 'rejected', reason: new Error('Bad gateway') },
        ]);

        await getStats(eth).catch(() => undefined);

        expect(request).toHaveBeenCalledTimes(2);
    });

    it('stops only the aborted call, leaving the shared request to the others', async () => {
        const { request, response } = createStatsRequest();
        const getStats = shareInFlightRequest(request);
        const abortController = new AbortController();

        const abortedResult = getStats({ ...eth, signal: abortController.signal });
        const result = getStats(eth);
        abortController.abort(new Error('Left the page'));
        response.resolve('eth stats');

        await expect(abortedResult).rejects.toThrow('Left the page');
        await expect(result).resolves.toBe('eth stats');
        expect(request.mock.calls[0]?.[0].signal).toBeUndefined();
    });
});
