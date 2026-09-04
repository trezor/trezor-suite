import type { CryptoId } from 'invity-api';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BaseCurrencyAmount,
    type TokenSymbol,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { act, renderHook } from '@suite-native/test-utils';
import { btc1NormalAccount, eth1NormalAccount } from '@suite-native/trading-fixtures';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { useMyAssetsFilteredData } from './useMyAssetsFilteredData';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const mockUsePreferredCurrencyUsdThreshold = jest.fn();
const mockUseTradingMyAssets = jest.fn();

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    usePreferredCurrencyUsdThreshold: () => mockUsePreferredCurrencyUsdThreshold(),
}));

jest.mock('./useTradingMyAssets', () => ({
    useTradingMyAssets: (tradingType: 'sell' | 'exchange') => mockUseTradingMyAssets(tradingType),
}));

const createAsset = (overrides: Partial<MyAsset> = {}): MyAsset => ({
    name: 'Ethereum',
    symbol: ethSymbol,
    cryptoId: 'ethereum' as CryptoId,
    balance: '2',
    fiatBalance: asBaseCurrencyAmount(new BigNumber('5000')),
    isEnabled: true,
    ...overrides,
});

const btcAsset = createAsset({
    name: 'Bitcoin',
    symbol: btcSymbol,
    cryptoId: 'bitcoin' as CryptoId,
});
const lowBalanceAsset = createAsset({
    name: 'Low USDC',
    tokenSymbol: 'USDC' as TokenSymbol,
    cryptoId: 'ethereum--low-usdc' as CryptoId,
    fiatBalance: asBaseCurrencyAmount(new BigNumber('0.09')),
});
const thresholdAsset = createAsset({
    name: 'Threshold token',
    cryptoId: 'ethereum--threshold' as CryptoId,
    fiatBalance: asBaseCurrencyAmount(new BigNumber('0.1')),
});
const unknownFiatAsset = createAsset({
    name: 'Unknown fiat',
    cryptoId: 'ethereum--unknown' as CryptoId,
    fiatBalance: null,
});
const nonTradeableLowBalanceAsset = createAsset({
    name: 'Disabled low token',
    cryptoId: 'ethereum--disabled' as CryptoId,
    fiatBalance: asBaseCurrencyAmount(new BigNumber('0.01')),
    isEnabled: false,
});

const sections = [
    {
        key: 'section_btc',
        label: 'BTC Account #1',
        sectionData: btc1NormalAccount,
        data: [btcAsset],
    },
    {
        key: 'section_eth',
        label: 'ETH Account #1',
        sectionData: eth1NormalAccount,
        data: [
            createAsset(),
            lowBalanceAsset,
            thresholdAsset,
            unknownFiatAsset,
            nonTradeableLowBalanceAsset,
        ],
    },
];

const preferredCurrencyUsdThreshold = asBaseCurrencyAmount(new BigNumber('0.1'));

describe('useMyAssetsFilteredData', () => {
    const renderFilter = async (
        threshold: BaseCurrencyAmount | null = preferredCurrencyUsdThreshold,
    ) => {
        mockUseTradingMyAssets.mockReturnValue(sections);
        mockUsePreferredCurrencyUsdThreshold.mockReturnValue(threshold);

        return await renderHook(() => useMyAssetsFilteredData('sell'));
    };

    it('groups each account assets by tradeability and low balance', async () => {
        const { result } = await renderFilter();
        const ethSection = result.current.filteredSections[1];

        expect(mockUseTradingMyAssets).toHaveBeenCalledWith('sell');
        expect(ethSection?.assets).toEqual([
            expect.objectContaining({ name: 'Ethereum' }),
            thresholdAsset,
            unknownFiatAsset,
        ]);
        expect(ethSection?.lowBalanceAssets).toEqual([lowBalanceAsset]);
        expect(ethSection?.nonTradeableAssets).toEqual([nonTradeableLowBalanceAsset]);
    });

    it('keeps all tradeable assets in the main list when the threshold is unavailable', async () => {
        const { result } = await renderFilter(null);
        const ethSection = result.current.filteredSections[1];

        expect(ethSection?.lowBalanceAssets).toEqual([]);
        expect(ethSection?.assets).toHaveLength(4);
        expect(ethSection?.nonTradeableAssets).toEqual([nonTradeableLowBalanceAsset]);
    });

    it('uses the supplied preferred-currency threshold', async () => {
        const { result } = await renderFilter(asBaseCurrencyAmount(new BigNumber('0.09')));
        const ethSection = result.current.filteredSections[1];

        expect(ethSection?.lowBalanceAssets).toEqual([]);
        expect(ethSection?.assets).toContain(lowBalanceAsset);
    });

    it('searches all categories without flattening them', async () => {
        const { result } = await renderFilter();

        await act(() => result.current.setFilterValue('disabled low'));

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0]?.assets).toEqual([]);
        expect(result.current.filteredSections[0]?.lowBalanceAssets).toEqual([]);
        expect(result.current.filteredSections[0]?.nonTradeableAssets).toEqual([
            nonTradeableLowBalanceAsset,
        ]);
    });

    it('combines case-insensitive search and network filters', async () => {
        const { result } = await renderFilter();

        await act(() => {
            result.current.setFilterSymbol(ethSymbol);
            result.current.setFilterValue('LOW USDC');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0]?.lowBalanceAssets).toEqual([lowBalanceAsset]);
    });

    it('updates the scroll reset key for both filters', async () => {
        const { result } = await renderFilter();

        expect(result.current.scrollResetKey).toBe('Network:all;Search:');

        await act(() => {
            result.current.setFilterSymbol(ethSymbol);
            result.current.setFilterValue('usd');
        });

        expect(result.current.scrollResetKey).toBe('Network:eth;Search:usd');
    });
});
