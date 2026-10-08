import { type PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider, commonQueryKeys } from '@suite-common/react-query';
import {
    type RankedTokenStructure,
    fetchRankedTokenDefinitions,
} from '@suite-common/token-definitions';
import { type Network, getNetwork } from '@suite-common/wallet-config';
import { renderHookWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { useNetworkRepresentativeAssets } from './useNetworkRepresentativeAssets';

jest.mock('@suite-common/token-definitions', () => ({
    ...jest.requireActual('@suite-common/token-definitions'),
    fetchRankedTokenDefinitions: jest.fn(),
}));

const ethereum = getNetwork('eth');
const bitcoin = getNetwork('btc');
const definitions: RankedTokenStructure = [
    { assetPlatformId: 'ethereum', address: '0x1', symbol: 'usdc', name: 'USDC', marketCap: 1 },
];

const renderAssets = async (
    networks: readonly Network[],
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
    const rendered = await renderHookWithBasicProvider(
        () => useNetworkRepresentativeAssets(networks),
        {
            wrapper: ({ children }: PropsWithChildren) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        },
    );

    return { ...rendered, queryClient };
};

describe('useNetworkRepresentativeAssets', () => {
    beforeEach(() => {
        jest.mocked(fetchRankedTokenDefinitions).mockReset();
        jest.mocked(fetchRankedTokenDefinitions).mockResolvedValue(definitions);
    });

    it('loads one wallet-independent catalogue for the whole network list', async () => {
        const { result, unmount, queryClient } = await renderAssets([ethereum, bitcoin]);

        await waitFor(() =>
            expect(result.current.get(ethereum.symbol)).toEqual([
                { symbol: 'ETH' },
                { symbol: 'USDC', contract: '0x1' },
            ]),
        );
        expect(result.current.get(bitcoin.symbol)).toEqual([{ symbol: 'BTC' }]);
        expect(fetchRankedTokenDefinitions).toHaveBeenCalledTimes(1);
        expect(fetchRankedTokenDefinitions).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
        });
        await unmount();
        queryClient.clear();
    });

    it('reuses the cached catalogue without another request', async () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(commonQueryKeys.rankedTokenDefinitions(), definitions);
        const { result, unmount } = await renderAssets([ethereum], queryClient);

        expect(result.current.get(ethereum.symbol)).toHaveLength(2);
        expect(fetchRankedTokenDefinitions).not.toHaveBeenCalled();
        await unmount();
        queryClient.clear();
    });

    it.each([
        { name: 'tokenless networks', networks: [bitcoin] },
        { name: 'testnets', networks: [getNetwork('tsep')] },
        { name: 'an empty list', networks: [] },
    ])('does not download definitions for $name', async ({ networks }) => {
        const { unmount, queryClient } = await renderAssets(networks);

        expect(fetchRankedTokenDefinitions).not.toHaveBeenCalled();
        await unmount();
        queryClient.clear();
    });

    it('keeps native icons when the catalogue is unavailable', async () => {
        jest.mocked(fetchRankedTokenDefinitions).mockRejectedValueOnce(new Error('unavailable'));
        const { result, unmount, queryClient } = await renderAssets([ethereum, bitcoin]);

        await waitFor(() =>
            expect(
                queryClient.getQueryState(commonQueryKeys.rankedTokenDefinitions())?.status,
            ).toBe('error'),
        );
        expect(result.current.get(ethereum.symbol)).toEqual([{ symbol: 'ETH' }]);
        expect(result.current.get(bitcoin.symbol)).toEqual([{ symbol: 'BTC' }]);
        await unmount();
        queryClient.clear();
    });

    it('keeps native icons while loading and aborts an unused request on unmount', async () => {
        jest.mocked(fetchRankedTokenDefinitions).mockImplementation(() => new Promise(() => {}));
        const { result, unmount, queryClient } = await renderAssets([ethereum]);
        const signal = jest.mocked(fetchRankedTokenDefinitions).mock.calls[0]?.[0]?.signal;

        expect(result.current.get(ethereum.symbol)).toEqual([{ symbol: 'ETH' }]);
        expect(signal?.aborted).toBe(false);
        await unmount();
        expect(signal?.aborted).toBe(true);
        queryClient.clear();
    });
});
