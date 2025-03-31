import { NetworkSymbol } from '@suite-common/wallet-config';
import { act, renderHook } from '@suite-native/test-utils';

import {
    btcAsset,
    ethAsset,
    jitoOnSolanaAsset,
    jupOnSolanaAsset,
    rethOnBaseAsset,
    usdcAsset,
    usdtOnArbAsset,
    usdtOnBscAsset,
} from '../../__fixtures__/tradeableAssets';
import { TradeableAsset } from '../../types';
import { useTradeableAssetsFilteredData } from '../useTradeableAssetsFilteredData';

const mockAssets: TradeableAsset[] = [
    btcAsset,
    ethAsset,
    usdcAsset,
    rethOnBaseAsset,
    jitoOnSolanaAsset,
    jupOnSolanaAsset,
    usdtOnArbAsset,
    usdtOnBscAsset,
];

describe('useTradeableAssetsFilteredData', () => {
    const renderUseTradeableAssetsFilteredData = () =>
        renderHook(() => useTradeableAssetsFilteredData({ assets: mockAssets }));

    it('should return all assets when no filter is applied', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        expect(result.current.filteredData).toEqual(mockAssets);
    });

    it('should filter assets by network symbol', () => {
        const { result } = renderUseTradeableAssetsFilteredData();

        act(() => {
            result.current.setFilterValue('btc' as NetworkSymbol);
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0].networkId).toBe('bitcoin');
    });

    it('should filter assets by network name', () => {
        const { result } = renderUseTradeableAssetsFilteredData();

        act(() => {
            result.current.setFilterValue('bnb' as NetworkSymbol);
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0].networkId).toBe('binance-smart-chain');
    });

    it('should filter assets by name', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterValue('rock');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0].name).toBe('Rocket Pool ETH');
    });

    it('should filter assets by contract address', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterValue('0xa0b');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0].contractAddress).toBeDefined();
    });

    it('should filter assets by filter symbol', () => {
        const { result } = renderUseTradeableAssetsFilteredData();

        act(() => {
            result.current.setFilterSymbol('btc' as NetworkSymbol);
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0].networkId).toBe('bitcoin');
    });

    it('should combine network symbol filter with search query', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterSymbol('eth' as NetworkSymbol);
            result.current.setFilterValue('usd');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0].name).toBe('USDC');
    });

    it('should handle case-insensitive search', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterValue('usDT');
        });
        expect(result.current.filteredData).toHaveLength(2);
        expect(
            result.current.filteredData.every((asset: TradeableAsset) =>
                asset.symbol.toLowerCase().includes('usdt'),
            ),
        ).toBe(true);
    });

    it('should return empty array when no matches found', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterValue('NonExistentAsset');
        });
        expect(result.current.filteredData).toHaveLength(0);
    });
});
