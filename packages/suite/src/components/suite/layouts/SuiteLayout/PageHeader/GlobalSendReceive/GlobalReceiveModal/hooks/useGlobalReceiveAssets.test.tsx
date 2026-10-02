import { type PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider, desktopQueryKeys } from '@suite-common/react-query';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import {
    type RankedTokenStructure,
    fetchRankedTokenDefinitions,
} from '@suite-common/token-definitions';
import { getMainnets } from '@suite-common/wallet-config';
import { FirmwareType } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';

import { useGlobalReceiveAssets } from './useGlobalReceiveAssets';

jest.mock('@suite-common/token-definitions', () => ({
    ...jest.requireActual('@suite-common/token-definitions'),
    fetchRankedTokenDefinitions: jest.fn(),
}));

const definitions: RankedTokenStructure = [
    {
        assetPlatformId: 'solana',
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'wsol',
        name: 'Wrapped SOL',
        marketCap: 0,
    },
];

const renderAssets = (
    firmwareType = FirmwareType.Universal,
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            device: { devices: [], selectedDevice: mockSuiteDevice({ firmwareType }) },
            networks: Object.fromEntries(getMainnets().map(network => [network.symbol, network])),
            wallet: { accounts: [], settings: { enabledNetworks: [], localCurrency: 'usd' } },
        },
    });
    const rendered = renderHookWithStoreProvider(useGlobalReceiveAssets, {
        services,
        wrapper: ({ children }: PropsWithChildren) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
    });

    return { ...rendered, queryClient, services };
};

describe('useGlobalReceiveAssets', () => {
    beforeEach(() => {
        jest.mocked(fetchRankedTokenDefinitions).mockReset();
        jest.mocked(fetchRankedTokenDefinitions).mockResolvedValue(definitions);
    });

    it('loads definitions without dispatching trading actions and caches them across modal opens', async () => {
        const first = renderAssets();
        expect(first.result.current.catalogStatus).toBe('loading');
        await waitFor(() => expect(first.result.current.catalogStatus).toBe('ready'));
        expect(first.result.current.assets).toContainEqual(
            expect.objectContaining({ name: 'Wrapped SOL', displaySymbol: 'WSOL' }),
        );
        expect(first.services.store.getActions()).toEqual([]);
        first.unmount();

        const second = renderAssets(FirmwareType.Universal, first.queryClient);
        expect(second.result.current.catalogStatus).toBe('ready');
        expect(fetchRankedTokenDefinitions).toHaveBeenCalledTimes(1);
        second.unmount();
        first.queryClient.clear();
    });

    it('does not load or expose a catalogue on Bitcoin-only firmware, including manual retry', () => {
        const { result, unmount, queryClient } = renderAssets(FirmwareType.BitcoinOnly);
        expect(result.current.catalogStatus).toBe('ready');
        expect(result.current.assets).toEqual([]);
        expect(result.current.networks).toEqual([]);
        act(() => result.current.retry());
        expect(fetchRankedTokenDefinitions).not.toHaveBeenCalled();
        unmount();
        queryClient.clear();
    });

    it('cancels an unfinished catalogue request when the modal unmounts', () => {
        jest.mocked(fetchRankedTokenDefinitions).mockImplementation(() => new Promise(() => {}));
        const { unmount, queryClient } = renderAssets();
        const signal = jest.mocked(fetchRankedTokenDefinitions).mock.calls[0]?.[0]?.signal;
        expect(signal?.aborted).toBe(false);
        unmount();
        expect(signal?.aborted).toBe(true);
        queryClient.clear();
    });

    it('offers retry after failure and keeps native networks available to the filter', async () => {
        jest.mocked(fetchRankedTokenDefinitions).mockRejectedValueOnce(new Error('unavailable'));
        const { result, unmount, queryClient } = renderAssets();
        await waitFor(() => expect(result.current.catalogStatus).toBe('error'));
        expect(result.current.networks).toEqual(getMainnets().map(network => network.symbol));

        act(() => result.current.retry());
        await waitFor(() => expect(result.current.catalogStatus).toBe('ready'));
        expect(fetchRankedTokenDefinitions).toHaveBeenCalledTimes(2);
        expect(queryClient.getQueryData(desktopQueryKeys.rankedTokenDefinitions())).toEqual(
            definitions,
        );
        unmount();
        queryClient.clear();
    });
});
