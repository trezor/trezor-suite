/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
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
import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol, getMainnets } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { FirmwareType } from '@trezor/device-utils';

import {
    type UseGlobalReceiveAssetsParams,
    useGlobalReceiveAssets,
} from './useGlobalReceiveAssets';
import * as globalReceiveAssetUtils from '../globalReceiveAssetUtils';

jest.mock('@suite-common/token-definitions', () => ({
    ...jest.requireActual('@suite-common/token-definitions'),
    fetchRankedTokenDefinitions: jest.fn(),
}));

jest.mock('../globalReceiveAssetUtils', () => {
    const utils = jest.requireActual<typeof globalReceiveAssetUtils>('../globalReceiveAssetUtils');

    return {
        ...utils,
        buildGlobalReceiveAssetSearchIndex: jest.fn(utils.buildGlobalReceiveAssetSearchIndex),
    };
});

// The hook selects shared wallet state only — none of it app-layer.
type TestRootState = DeviceRootState &
    AccountsRootState &
    FiatRatesRootState &
    NetworksRootState &
    TransactionsRootState &
    WalletSettingsRootState;

const definitions: RankedTokenStructure = [
    {
        assetPlatformId: 'solana',
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'wsol',
        name: 'Wrapped SOL',
        marketCap: 0,
    },
];

const initialFilters: UseGlobalReceiveAssetsParams = {
    search: '',
    networkSymbol: undefined,
};

const renderAssets = (
    firmwareType = FirmwareType.Universal,
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
    const { services } = createTestCompositionRoot<void, TestRootState>({
        preloadedState: {
            device: { devices: [], selectedDevice: mockSuiteDevice({ firmwareType }) },
            networks: Object.fromEntries(getMainnets().map(network => [network.symbol, network])),
            wallet: {
                accounts: [],
                settings: { enabledNetworks: [], localCurrency: 'usd' },
                transactions: { transactions: {}, phishing: {}, fetchStatusDetail: {} },
            },
        },
    });
    const rendered = renderHookWithStoreProvider(useGlobalReceiveAssets, {
        services,
        initialProps: initialFilters,
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
        jest.mocked(globalReceiveAssetUtils.buildGlobalReceiveAssetSearchIndex).mockClear();
    });

    it('includes zero-balance history only from visible, enabled accounts of the selected wallet', async () => {
        const contract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        jest.mocked(fetchRankedTokenDefinitions).mockResolvedValueOnce([
            ...definitions,
            {
                assetPlatformId: 'ethereum',
                address: contract,
                symbol: 'usdc',
                name: 'USD Coin',
                marketCap: 1,
            },
        ]);
        const usedAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            formattedBalance: '0',
            tokens: [mockAccountToken({ contract, balance: '0', totalSent: '1' })],
        });
        const { services } = createTestCompositionRoot<void, TestRootState>({
            preloadedState: {
                device: {
                    devices: [],
                    selectedDevice: mockSuiteDevice({
                        state: { staticSessionId: usedAccount.deviceState },
                    }),
                },
                networks: Object.fromEntries(
                    getMainnets().map(network => [network.symbol, network]),
                ),
                wallet: {
                    accounts: [
                        usedAccount,
                        mockWalletAccount({
                            symbol: asNetworkSymbol('btc'),
                            empty: true,
                            history: { total: 0, unconfirmed: 0 },
                        }),
                        mockWalletAccount({ symbol: asNetworkSymbol('sol'), visible: false }),
                        mockWalletAccount({ symbol: asNetworkSymbol('xrp') }),
                        mockWalletAccount({
                            symbol: asNetworkSymbol('ada'),
                            deviceState: 'otherWallet@device:0',
                        }),
                    ],
                    settings: {
                        enabledNetworks: ['eth', 'btc', 'sol', 'ada'].map(asNetworkSymbol),
                        localCurrency: 'usd',
                    },
                    transactions: { transactions: {}, phishing: {}, fetchStatusDetail: {} },
                },
            },
        });
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const { result, unmount } = renderHookWithStoreProvider(useGlobalReceiveAssets, {
            services,
            initialProps: initialFilters,
            wrapper: ({ children }: PropsWithChildren) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        });

        await waitFor(() => expect(result.current.catalogStatus).toBe('ready'));
        expect(result.current.myAssets.map(({ asset }) => asset.id)).toEqual([
            getCryptoId(usedAccount.symbol),
            getCryptoId(usedAccount.symbol, contract),
        ]);
        result.current.myAssets.forEach(({ balance }) => {
            expect(balance?.cryptoAmount).toBe('0');
            expect(balance?.fiatAmount?.isZero()).toBe(true);
        });
        unmount();
        queryClient.clear();
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

    it('returns filtered sections without rebuilding the index or reloading the catalogue', async () => {
        const { result, rerender, unmount, queryClient } = renderAssets();
        await waitFor(() => expect(result.current.catalogStatus).toBe('ready'));

        const { assets, myAssets, otherAssets, networks } = result.current;
        const indexBuildCount = jest.mocked(
            globalReceiveAssetUtils.buildGlobalReceiveAssetSearchIndex,
        ).mock.calls.length;
        expect(myAssets).toEqual([]);
        expect(otherAssets.map(({ asset }) => asset)).toEqual(assets);

        rerender(initialFilters);
        expect(result.current.myAssets).toBe(myAssets);
        expect(result.current.otherAssets).toBe(otherAssets);

        rerender({ search: 'WrÁppéd', networkSymbol: undefined });
        expect(result.current.otherAssets).toEqual([
            expect.objectContaining({ asset: expect.objectContaining({ name: 'Wrapped SOL' }) }),
        ]);

        rerender({ search: 'wsol', networkSymbol: asNetworkSymbol('eth') });
        expect(result.current.otherAssets).toEqual([]);

        rerender({ search: '', networkSymbol: asNetworkSymbol('sol') });
        expect(result.current.otherAssets.map(({ asset }) => asset.displaySymbol)).toEqual([
            'SOL',
            'WSOL',
        ]);

        rerender({ search: 'no matching asset', networkSymbol: undefined });
        expect(result.current.myAssets).toEqual([]);
        expect(result.current.otherAssets).toEqual([]);

        rerender(initialFilters);
        expect(result.current.otherAssets.map(({ asset }) => asset)).toEqual(assets);
        expect(result.current.assets).toBe(assets);
        expect(result.current.networks).toBe(networks);
        expect(globalReceiveAssetUtils.buildGlobalReceiveAssetSearchIndex).toHaveBeenCalledTimes(
            indexBuildCount,
        );
        expect(fetchRankedTokenDefinitions).toHaveBeenCalledTimes(1);
        unmount();
        queryClient.clear();
    });

    it('rebuilds the search index when the catalogue changes', async () => {
        const { result, rerender, unmount, queryClient } = renderAssets();
        await waitFor(() => expect(result.current.catalogStatus).toBe('ready'));
        const { assets } = result.current;
        const indexBuildCount = jest.mocked(
            globalReceiveAssetUtils.buildGlobalReceiveAssetSearchIndex,
        ).mock.calls.length;

        const updatedDefinitions: RankedTokenStructure = [
            ...definitions,
            {
                assetPlatformId: 'solana',
                address: 'NewTokenMint',
                symbol: 'NEW',
                name: 'New Token',
                marketCap: 1,
            },
        ];
        act(() => {
            queryClient.setQueryData(desktopQueryKeys.rankedTokenDefinitions(), updatedDefinitions);
        });

        await waitFor(() => expect(result.current.assets).not.toBe(assets));
        expect(globalReceiveAssetUtils.buildGlobalReceiveAssetSearchIndex).toHaveBeenCalledTimes(
            indexBuildCount + 1,
        );
        rerender({ search: 'newtokenmint', networkSymbol: undefined });
        expect(result.current.otherAssets).toEqual([
            expect.objectContaining({ asset: expect.objectContaining({ name: 'New Token' }) }),
        ]);
        unmount();
        queryClient.clear();
    });

    it('does not load or expose a catalogue on Bitcoin-only firmware, including manual retry', () => {
        const { result, unmount, queryClient } = renderAssets(FirmwareType.BitcoinOnly);
        expect(result.current.catalogStatus).toBe('ready');
        expect(result.current.assets).toEqual([]);
        expect(result.current.myAssets).toEqual([]);
        expect(result.current.otherAssets).toEqual([]);
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
