import { type PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider, commonQueryKeys } from '@suite-common/react-query';
import { renderHook, waitFor } from '@suite-common/test-utils';
import {
    type RankedTokenStructure,
    fetchRankedTokenDefinitions,
} from '@suite-common/token-definitions';
import { type Network, getNetwork } from '@suite-common/wallet-config';

import { useNetworkRepresentativeAssets } from './useNetworkRepresentativeAssets';

jest.mock('@suite-common/token-definitions', () => ({
    ...jest.requireActual('@suite-common/token-definitions'),
    fetchRankedTokenDefinitions: jest.fn(),
}));

const ethereum = getNetwork('eth');
const definitions: RankedTokenStructure = [
    { assetPlatformId: 'ethereum', address: '0x1', symbol: 'usdc', name: 'USDC', marketCap: 1 },
];
const renderAssets = (
    networks: readonly Network[] = [ethereum],
    isEnabled = true,
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
    const rendered = renderHook(() => useNetworkRepresentativeAssets(networks, isEnabled), {
        wrapper: ({ children }: PropsWithChildren) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
    });

    return { ...rendered, queryClient };
};

describe('useNetworkRepresentativeAssets', () => {
    beforeEach(() => {
        jest.mocked(fetchRankedTokenDefinitions).mockReset();
        jest.mocked(fetchRankedTokenDefinitions).mockResolvedValue(definitions);
    });

    it('loads a wallet-independent catalogue and keeps the native icon while loading', async () => {
        const { result, unmount, queryClient } = renderAssets();
        expect(result.current.get(ethereum.symbol)).toEqual([{ symbol: 'ETH' }]);
        await waitFor(() => expect(result.current.get(ethereum.symbol)).toHaveLength(2));
        expect(fetchRankedTokenDefinitions).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
        });
        unmount();
        queryClient.clear();
    });

    it('reuses the catalogue cache shared with Global Receive without another request', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(commonQueryKeys.rankedTokenDefinitions(), definitions);
        const { result, unmount } = renderAssets([ethereum], true, queryClient);

        expect(result.current.get(ethereum.symbol)).toHaveLength(2);
        expect(fetchRankedTokenDefinitions).not.toHaveBeenCalled();
        unmount();
        queryClient.clear();
    });

    it.each([
        { networks: [ethereum], isEnabled: false },
        { networks: [getNetwork('btc')], isEnabled: true },
        { networks: [getNetwork('tsep')], isEnabled: true },
    ])('does not download unused definitions: %o', ({ networks, isEnabled }) => {
        const { unmount, queryClient } = renderAssets(networks, isEnabled);

        expect(fetchRankedTokenDefinitions).not.toHaveBeenCalled();
        unmount();
        queryClient.clear();
    });

    it('keeps the native icon when the catalogue is unavailable', async () => {
        jest.mocked(fetchRankedTokenDefinitions).mockRejectedValueOnce(new Error('unavailable'));
        const { result, unmount, queryClient } = renderAssets();
        await waitFor(() =>
            expect(
                queryClient.getQueryState(commonQueryKeys.rankedTokenDefinitions())?.status,
            ).toBe('error'),
        );

        expect(result.current.get(ethereum.symbol)).toEqual([{ symbol: 'ETH' }]);
        unmount();
        queryClient.clear();
    });

    it('aborts an unused request when the network list unmounts', () => {
        jest.mocked(fetchRankedTokenDefinitions).mockImplementation(() => new Promise(() => {}));
        const { unmount, queryClient } = renderAssets();
        const signal = jest.mocked(fetchRankedTokenDefinitions).mock.calls[0]?.[0]?.signal;
        expect(signal?.aborted).toBe(false);

        unmount();
        expect(signal?.aborted).toBe(true);
        queryClient.clear();
    });
});
