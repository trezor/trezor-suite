import { type NetworkSymbol } from '@suite-common/wallet-config';
import { act, renderHook } from '@suite-native/test-utils';
import {
    btcAsset,
    ethAsset,
    jitoOnSolanaAsset,
    jupOnSolanaAsset,
    rethOnBaseAsset,
    tronTetherAsset,
    unknownAsset,
    usdcAsset,
    usdtAsset,
    usdtOnArbAsset,
    usdtOnBscAsset,
} from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';

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
        expect(result.current.filteredData[0]?.networkId).toBe('bitcoin');
    });

    it('should filter assets by network name', () => {
        const { result } = renderUseTradeableAssetsFilteredData();

        act(() => {
            result.current.setFilterValue('bnb' as NetworkSymbol);
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.networkId).toBe('binance-smart-chain');
    });

    it('should filter assets by name', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterValue('rock');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.name).toBe('Rocket Pool ETH');
    });

    it('should filter assets by contract address', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterValue('0xa0b');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.contractAddress).toBeTruthy();
    });

    it('should filter assets by filter symbol', () => {
        const { result } = renderUseTradeableAssetsFilteredData();

        act(() => {
            result.current.setFilterSymbol('btc' as NetworkSymbol);
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.networkId).toBe('bitcoin');
    });

    it('should combine network symbol filter with search query', () => {
        const { result } = renderUseTradeableAssetsFilteredData();
        act(() => {
            result.current.setFilterSymbol('eth' as NetworkSymbol);
            result.current.setFilterValue('usd');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.name).toBe('USDC');
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

    describe('sort order', () => {
        it('should rank exact name match before name-startsWith', () => {
            // tronTetherAsset.name = 'Tether' (exact match), usdtAsset.name = 'Tether USDT' (startsWith)
            const assets = [usdtAsset, tronTetherAsset];
            const { result } = renderHook(() => useTradeableAssetsFilteredData({ assets }));

            act(() => {
                result.current.setFilterValue('tether');
            });

            expect(result.current.filteredData[0]).toBe(tronTetherAsset);
            expect(result.current.filteredData[1]).toBe(usdtAsset);
        });

        it('should rank exact symbol match before symbol-startsWith', () => {
            // Inline asset with symbol starting with 'usd' but not exact; usdcAsset.symbol = 'USDC' also startsWith.
            // We create an asset with symbol exactly 'USD' to compare against 'USDC'.
            const usdExactAsset: TradeableAsset = {
                ...unknownAsset,
                symbol: 'USD',
                name: 'US Dollar',
            };
            const assets = [usdcAsset, usdExactAsset];
            const { result } = renderHook(() => useTradeableAssetsFilteredData({ assets }));

            act(() => {
                result.current.setFilterValue('usd');
            });

            // usdExactAsset: symbol === 'usd' → weight 1
            // usdcAsset: symbol startsWith 'usd' → weight 3
            expect(result.current.filteredData[0]).toBe(usdExactAsset);
            expect(result.current.filteredData[1]).toBe(usdcAsset);
        });

        it('should rank name-startsWith before name-contains', () => {
            // ethAsset.name = 'Ethereum' → startsWith 'et' → weight 2
            // rethOnBaseAsset.name = 'Rocket Pool ETH' → contains 'et' but not startsWith → weight 4
            // Also: ethAsset.symbol = 'ETH' → 'eth' !== 'et', so no symbol exact match; name check wins at weight 2
            const assets = [rethOnBaseAsset, ethAsset];
            const { result } = renderHook(() => useTradeableAssetsFilteredData({ assets }));

            act(() => {
                result.current.setFilterValue('et');
            });

            expect(result.current.filteredData[0]).toBe(ethAsset);
            expect(result.current.filteredData[1]).toBe(rethOnBaseAsset);
        });

        it('should rank asset name/symbol matches before network name matches', () => {
            // ethAsset.name = 'Ethereum' → exact name match → weight 0
            // usdcAsset.networkId = 'ethereum' → network name 'Ethereum' exact match → weight 6
            const assets = [usdcAsset, ethAsset];
            const { result } = renderHook(() => useTradeableAssetsFilteredData({ assets }));

            act(() => {
                result.current.setFilterValue('ethereum');
            });

            expect(result.current.filteredData[0]).toBe(ethAsset);
            expect(result.current.filteredData[1]).toBe(usdcAsset);
        });

        it('should rank contract address matches after name/symbol matches', () => {
            // Inline asset with '0xa0b' in its name → name startsWith → weight 2
            // usdcAsset.contractAddress starts with '0xa0b' → weight 12
            const contractNameAsset: TradeableAsset = { ...unknownAsset, name: '0xa0b Token' };
            const assets = [usdcAsset, contractNameAsset];
            const { result } = renderHook(() => useTradeableAssetsFilteredData({ assets }));

            act(() => {
                result.current.setFilterValue('0xa0b');
            });

            expect(result.current.filteredData[0]).toBe(contractNameAsset);
            expect(result.current.filteredData[1]).toBe(usdcAsset);
        });

        it('should not change order when filter is empty', () => {
            const assets = [btcAsset, ethAsset, usdcAsset];
            const { result } = renderHook(() => useTradeableAssetsFilteredData({ assets }));

            // No filter set — original order should be preserved
            expect(result.current.filteredData).toEqual(assets);
        });

        it('should order match on token address as last', () => {
            const assets = [btcAsset, ethAsset, usdcAsset, tronTetherAsset] as TradeableAsset[];

            const { result } = renderHook(() => useTradeableAssetsFilteredData({ assets }));

            act(() => {
                result.current.setFilterValue('tc');
            });

            expect(result.current.filteredData).toEqual([btcAsset, tronTetherAsset]);
        });
    });

    describe('filterValue', () => {
        it('should have correct value for empty filter', () => {
            const { result } = renderUseTradeableAssetsFilteredData();

            expect(result.current.filterValue).toEqual('Network:all;Search:');
        });

        it('should be affected by search value', () => {
            const { result } = renderUseTradeableAssetsFilteredData();

            act(() => {
                result.current.setFilterValue('search text');
            });

            expect(result.current.filterValue).toEqual('Network:all;Search:search text');
        });

        it('should be affected by network selection', () => {
            const { result } = renderUseTradeableAssetsFilteredData();

            act(() => {
                result.current.setFilterSymbol('eth' as NetworkSymbol);
            });

            expect(result.current.filterValue).toEqual('Network:eth;Search:');
        });

        it('should be affected by both search value and network selection', () => {
            const { result } = renderUseTradeableAssetsFilteredData();

            act(() => {
                result.current.setFilterValue('search text');
                result.current.setFilterSymbol('eth' as NetworkSymbol);
            });

            expect(result.current.filterValue).toEqual('Network:eth;Search:search text');
        });
    });
});
