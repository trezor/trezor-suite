import type { CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { act, renderHook } from '@suite-native/test-utils';
import { btc1NormalAccount, eth1NormalAccount } from '@suite-native/trading-fixtures';
import {
    type MyAssetRow,
    type MyAssetTradeable,
    type MyAssetsDisabled,
} from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { useMyAssetsFilteredData } from '../useMyAssetsFilteredData';

const btcAsset: MyAssetTradeable = {
    name: 'Bitcoin',
    symbol: 'btc' as NetworkSymbol,
    cryptoId: 'bitcoin' as CryptoId,
    balance: '1.0',
    fiatBalance: asBaseCurrencyAmount(new BigNumber(50000)),
    isEnabled: true,
};

const ethAsset: MyAssetTradeable = {
    name: 'Ethereum',
    symbol: 'eth' as NetworkSymbol,
    cryptoId: 'ethereum' as CryptoId,
    balance: '2.0',
    fiatBalance: asBaseCurrencyAmount(new BigNumber(5000)),
    isEnabled: true,
};

const usdcAsset: MyAssetTradeable = {
    name: 'USD Coin',
    symbol: 'eth' as NetworkSymbol,
    tokenSymbol: 'usdc' as TokenSymbol,
    cryptoId: 'usd-coin' as CryptoId,
    balance: '100.0',
    fiatBalance: asBaseCurrencyAmount(new BigNumber(100)),
    isEnabled: true,
};

const disabledRow: MyAssetsDisabled = {
    name: 'non-tradeable-assets',
    count: 2,
    isEnabled: false,
};

const btcSection = {
    key: 'section_btc',
    label: 'BTC Account #1',
    sectionData: btc1NormalAccount,
    data: [btcAsset] as MyAssetRow[],
};

const ethSection = {
    key: 'section_eth',
    label: 'ETH Account #1',
    sectionData: eth1NormalAccount,
    data: [ethAsset, usdcAsset, disabledRow] as MyAssetRow[],
};

const mockSections = [btcSection, ethSection];

describe('useMyAssetsFilteredData', () => {
    const renderFilter = () => renderHook(() => useMyAssetsFilteredData(mockSections));

    it('should return all sections unchanged when no filter is applied', () => {
        const { result } = renderFilter();

        expect(result.current.filteredSections).toBe(mockSections);
    });

    it('should filter assets by network symbol', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterSymbol('btc' as NetworkSymbol);
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0].data).toHaveLength(1);
        expect(result.current.filteredSections[0].data[0]).toBe(btcAsset);
    });

    it('should filter assets by text search on name', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('Bitcoin');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0].data).toHaveLength(1);
        expect(result.current.filteredSections[0].data[0]).toBe(btcAsset);
    });

    it('should filter assets by text search on symbol', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('eth');
        });

        // ethAsset.symbol = 'eth', usdcAsset.symbol = 'eth'
        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0].data).toHaveLength(2);
    });

    it('should filter assets by text search on tokenSymbol', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('usdc');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0].data).toHaveLength(1);
        expect(result.current.filteredSections[0].data[0]).toBe(usdcAsset);
    });

    it('should filter assets by text search on cryptoId', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('usd-coin');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0].data).toHaveLength(1);
        expect(result.current.filteredSections[0].data[0]).toBe(usdcAsset);
    });

    it('should be case-insensitive', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('BITCOIN');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0].data[0]).toBe(btcAsset);
    });

    it('should remove sections with no matching assets', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('NonExistentAsset');
        });

        expect(result.current.filteredSections).toHaveLength(0);
    });

    it('should hide disabled rows when text filter is active', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('USD');
        });

        // Only usdcAsset in ethSection matches "USD"; disabled row should be hidden
        expect(result.current.filteredSections).toHaveLength(1);
        const ethSectionData = result.current.filteredSections[0].data;
        expect(ethSectionData.every(item => item.isEnabled)).toBe(true);
    });

    it('should hide disabled rows when network filter is active', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterSymbol('eth' as NetworkSymbol);
        });

        const ethSectionData = result.current.filteredSections[0].data;
        expect(ethSectionData.every(item => item.isEnabled)).toBe(true);
    });

    it('should show disabled rows when no filter is active', () => {
        const { result } = renderFilter();

        const ethSectionData = result.current.filteredSections[1].data;
        expect(ethSectionData.some(item => !item.isEnabled)).toBe(true);
    });

    it('should combine network symbol filter with text search', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterSymbol('eth' as NetworkSymbol);
            result.current.setFilterValue('usd');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0].data).toHaveLength(1);
        expect(result.current.filteredSections[0].data[0]).toBe(usdcAsset);
    });

    it('should return correct availableNetworks from all enabled assets', () => {
        const { result } = renderFilter();

        expect(result.current.availableNetworks).toContain('btc');
        expect(result.current.availableNetworks).toContain('eth');
        // eth appears twice (ethAsset and usdcAsset) but should only be in list once
        expect(result.current.availableNetworks.filter(n => n === 'eth')).toHaveLength(1);
    });

    describe('filterValue composite key', () => {
        it('should have correct value with no filter applied', () => {
            const { result } = renderFilter();

            expect(result.current.filterValue).toBe('Network:all;Search:');
        });

        it('should reflect search text in filterValue', () => {
            const { result } = renderFilter();

            act(() => {
                result.current.setFilterValue('Bitcoin');
            });

            expect(result.current.filterValue).toBe('Network:all;Search:Bitcoin');
        });

        it('should reflect network symbol in filterValue', () => {
            const { result } = renderFilter();

            act(() => {
                result.current.setFilterSymbol('eth' as NetworkSymbol);
            });

            expect(result.current.filterValue).toBe('Network:eth;Search:');
        });

        it('should reflect both search text and network symbol in filterValue', () => {
            const { result } = renderFilter();

            act(() => {
                result.current.setFilterValue('usd');
                result.current.setFilterSymbol('eth' as NetworkSymbol);
            });

            expect(result.current.filterValue).toBe('Network:eth;Search:usd');
        });
    });
});
