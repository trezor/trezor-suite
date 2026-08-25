import type { CryptoId } from 'invity-api';

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
    symbol: 'eth',
    cryptoId: 'ethereum' as CryptoId,
    balance: '2',
    fiatBalance: asBaseCurrencyAmount(new BigNumber('5000')),
    isEnabled: true,
    ...overrides,
});

const btcAsset = createAsset({
    name: 'Bitcoin',
    symbol: 'btc',
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
const nonTradableLowBalanceAsset = createAsset({
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
            nonTradableLowBalanceAsset,
        ],
    },
];

const preferredCurrencyUsdThreshold = asBaseCurrencyAmount(new BigNumber('0.1'));

describe('useMyAssetsFilteredData', () => {
    const renderFilter = (threshold: BaseCurrencyAmount | null = preferredCurrencyUsdThreshold) => {
        mockUseTradingMyAssets.mockReturnValue(sections);
        mockUsePreferredCurrencyUsdThreshold.mockReturnValue(threshold);

        return renderHook(() => useMyAssetsFilteredData('sell'));
    };

    it('groups each account assets by tradeability and low balance', () => {
        const { result } = renderFilter();
        const ethSection = result.current.filteredSections[1];

        expect(mockUseTradingMyAssets).toHaveBeenCalledWith('sell');
        expect(ethSection?.assets).toEqual([
            expect.objectContaining({ name: 'Ethereum' }),
            thresholdAsset,
            unknownFiatAsset,
        ]);
        expect(ethSection?.lowBalanceAssets).toEqual([lowBalanceAsset]);
        expect(ethSection?.nonTradableAssets).toEqual([nonTradableLowBalanceAsset]);
    });

    it('keeps all tradeable assets in the main list when the threshold is unavailable', () => {
        const { result } = renderFilter(null);
        const ethSection = result.current.filteredSections[1];

        expect(ethSection?.lowBalanceAssets).toEqual([]);
        expect(ethSection?.assets).toHaveLength(4);
        expect(ethSection?.nonTradableAssets).toEqual([nonTradableLowBalanceAsset]);
    });

    it('uses the supplied preferred-currency threshold', () => {
        const { result } = renderFilter(asBaseCurrencyAmount(new BigNumber('0.09')));
        const ethSection = result.current.filteredSections[1];

        expect(ethSection?.lowBalanceAssets).toEqual([]);
        expect(ethSection?.assets).toContain(lowBalanceAsset);
    });

    it('searches all categories without flattening them', () => {
        const { result } = renderFilter();

        act(() => result.current.setFilterValue('disabled low'));

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0]?.assets).toEqual([]);
        expect(result.current.filteredSections[0]?.lowBalanceAssets).toEqual([]);
        expect(result.current.filteredSections[0]?.nonTradableAssets).toEqual([
            nonTradableLowBalanceAsset,
        ]);
    });

    it('combines case-insensitive search and network filters', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterSymbol('eth');
            result.current.setFilterValue('LOW USDC');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0]?.lowBalanceAssets).toEqual([lowBalanceAsset]);
    });

    it('updates the scroll reset key for both filters', () => {
        const { result } = renderFilter();

        expect(result.current.scrollResetKey).toBe('Network:all;Search:');

        act(() => {
            result.current.setFilterSymbol('eth');
            result.current.setFilterValue('usd');
        });

        expect(result.current.scrollResetKey).toBe('Network:eth;Search:usd');
    });
});
