import { QueryClient, createQueryClient } from '@suite-common/react-query';

import { defaultEarnStakingWorkerBaseUrl, earnStakingWorkerBaseUrl } from '../../context';

import {
    createCardanoStakingApi,
    createEthereumStakingApi,
    createSolanaStakingApi,
    createTronStakingApi,
} from './index';

const ENDPOINT_RESPONSES: Record<string, unknown> = {
    '/eth/stats': { symbol: 'eth', apy: 3.08, nextRewardPayout: 0 },
    '/eth/validators-queue': { activationTime: 86_400 },
    '/sol/stats': { symbol: 'sol', apy: 6.24 },
    '/trx/stats': [
        { address: 'TAddress', name: 'LugaNodes', url: 'https://luganodes.com', apr: 4 },
    ],
    '/ada/pools?limit=1000': { pools: [{ id: 'pool1', apy: 2.5, saturation: 40 }] },
};

const ETH_STATS_OPTIONS = { routeParams: { networkSymbol: 'eth' } } as const;

const createApis = (
    queryClient: QueryClient = createQueryClient({ shouldRefetchOnEvents: false }),
) => ({
    ethereum: createEthereumStakingApi({ queryClient }),
    solana: createSolanaStakingApi({ queryClient }),
    cardano: createCardanoStakingApi({ queryClient }),
    tron: createTronStakingApi({ queryClient }),
});

describe('staking API queries', () => {
    let fetchSpy: jest.SpiedFunction<typeof fetch>;

    const getPath = (input: RequestInfo | URL) =>
        new Request(input).url.replace(defaultEarnStakingWorkerBaseUrl, '');

    const getRequestedPaths = () => fetchSpy.mock.calls.map(([input]) => getPath(input)).toSorted();

    beforeEach(() => {
        earnStakingWorkerBaseUrl.set(defaultEarnStakingWorkerBaseUrl);
        fetchSpy = jest
            .spyOn(globalThis, 'fetch')
            .mockImplementation(input =>
                Promise.resolve(Response.json(ENDPOINT_RESPONSES[getPath(input)] ?? {})),
            );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('sends one request for concurrent calls of the same endpoint', async () => {
        const { ethereum } = createApis();

        const results = await Promise.all([
            ethereum.getStakingStats(ETH_STATS_OPTIONS),
            ethereum.getStakingStats(ETH_STATS_OPTIONS),
        ]);

        expect(results).toEqual([
            ENDPOINT_RESPONSES['/eth/stats'],
            ENDPOINT_RESPONSES['/eth/stats'],
        ]);
        expect(getRequestedPaths()).toEqual(['/eth/stats']);
    });

    it('sends a request for each endpoint of every network', async () => {
        const { ethereum, solana, cardano, tron } = createApis();

        await Promise.all([
            ethereum.getStakingStats(ETH_STATS_OPTIONS),
            ethereum.getEthereumValidatorsQueue(),
            solana.getStakingStats({ routeParams: { networkSymbol: 'sol' } }),
            cardano.getCardanoPools({ params: { limit: 1000 } }),
            tron.getTronStakingStats(),
        ]);

        expect(getRequestedPaths()).toEqual([
            '/ada/pools?limit=1000',
            '/eth/stats',
            '/eth/validators-queue',
            '/sol/stats',
            '/trx/stats',
        ]);
    });

    it('fetches the endpoint again once the shared request has settled', async () => {
        const { ethereum } = createApis();

        await ethereum.getStakingStats(ETH_STATS_OPTIONS);
        await ethereum.getStakingStats(ETH_STATS_OPTIONS);

        expect(getRequestedPaths()).toEqual(['/eth/stats', '/eth/stats']);
    });

    it('leaves the retries to the caller', async () => {
        fetchSpy.mockImplementation(() =>
            Promise.resolve(new Response('Bad gateway', { status: 502 })),
        );
        const retryingQueryClient = new QueryClient({
            defaultOptions: { queries: { retry: 3, retryDelay: 0 } },
        });
        const { ethereum } = createApis(retryingQueryClient);

        await expect(ethereum.getStakingStats(ETH_STATS_OPTIONS)).rejects.toThrow();

        expect(getRequestedPaths()).toEqual(['/eth/stats']);
    });

    it('stops only the aborted caller, leaving the shared request to the others', async () => {
        const { ethereum } = createApis();
        const abortController = new AbortController();

        const abortedStats = ethereum.getStakingStats({
            ...ETH_STATS_OPTIONS,
            signal: abortController.signal,
        });
        const stats = ethereum.getStakingStats(ETH_STATS_OPTIONS);
        abortController.abort(new Error('Left the page'));

        await expect(abortedStats).rejects.toThrow('Left the page');
        await expect(stats).resolves.toEqual(ENDPOINT_RESPONSES['/eth/stats']);
        expect(getRequestedPaths()).toEqual(['/eth/stats']);
    });

    it.each<{ endpoint: string; query: (apis: ReturnType<typeof createApis>) => Promise<unknown> }>(
        [
            {
                endpoint: '/eth/stats',
                query: ({ ethereum }) =>
                    ethereum.getStakingStats({ ...ETH_STATS_OPTIONS, staleTime: Infinity }),
            },
            {
                endpoint: '/eth/validators-queue',
                query: ({ ethereum }) =>
                    ethereum.getEthereumValidatorsQueue({ staleTime: Infinity }),
            },
            {
                endpoint: '/sol/stats',
                query: ({ solana }) =>
                    solana.getStakingStats({
                        routeParams: { networkSymbol: 'sol' },
                        staleTime: Infinity,
                    }),
            },
            {
                endpoint: '/ada/pools?limit=1000',
                query: ({ cardano }) =>
                    cardano.getCardanoPools({ params: { limit: 1000 }, staleTime: Infinity }),
            },
            {
                endpoint: '/trx/stats',
                query: ({ tron }) => tron.getTronStakingStats({ staleTime: Infinity }),
            },
        ],
    )('passes the caller’s query options on for $endpoint', async ({ endpoint, query }) => {
        const apis = createApis();

        await query(apis);
        await query(apis);

        expect(getRequestedPaths()).toEqual([endpoint]);
    });

    it('lets the caller’s query options override the shared ones', async () => {
        fetchSpy.mockImplementation(() =>
            Promise.resolve(new Response('Bad gateway', { status: 502 })),
        );
        const { ethereum } = createApis();

        await expect(
            ethereum.getStakingStats({ ...ETH_STATS_OPTIONS, retry: 1, retryDelay: 0 }),
        ).rejects.toThrow();

        expect(getRequestedPaths()).toEqual(['/eth/stats', '/eth/stats']);
    });
});
