import type { CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
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
import { BigNumber } from '@trezor/utils';

import { useTradeableAssetsFilteredData } from './useTradeableAssetsFilteredData';

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
    const renderUseTradeableAssetsFilteredData = async () =>
        await renderHook(() => useTradeableAssetsFilteredData({ assets: mockAssets }));

    it('should return all assets when no filter is applied', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();
        expect(result.current.filteredData).toEqual(mockAssets);
    });

    it('should filter assets by network symbol', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();

        await act(() => {
            result.current.setFilterValue('btc' as NetworkSymbol);
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.networkId).toBe('bitcoin');
    });

    it('should filter assets by network name', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();

        await act(() => {
            result.current.setFilterValue('bnb' as NetworkSymbol);
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.networkId).toBe('binance-smart-chain');
    });

    it('should filter assets by name', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();
        await act(() => {
            result.current.setFilterValue('rock');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.name).toBe('Rocket Pool ETH');
    });

    it('should filter assets by contract address', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();
        await act(() => {
            result.current.setFilterValue('0xa0b');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.contractAddress).toBeTruthy();
    });

    it('should filter assets by filter symbol', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();

        await act(() => {
            result.current.setFilterSymbol('btc' as NetworkSymbol);
        });

        expect(result.current.filterSymbol).toBe('btc');
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.networkId).toBe('bitcoin');
    });

    it('should combine network symbol filter with search query', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();
        await act(() => {
            result.current.setFilterSymbol('eth' as NetworkSymbol);
            result.current.setFilterValue('usd');
        });
        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.name).toBe('USDC');
    });

    it('should handle case-insensitive search', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();
        await act(() => {
            result.current.setFilterValue('usDT');
        });
        expect(result.current.filteredData).toHaveLength(2);
        expect(
            result.current.filteredData.every((asset: TradeableAsset) =>
                asset.symbol.toLowerCase().includes('usdt'),
            ),
        ).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
        const { result } = await renderUseTradeableAssetsFilteredData();
        await act(() => {
            result.current.setFilterValue('NonExistentAsset');
        });
        expect(result.current.filteredData).toHaveLength(0);
    });

    describe('sort order', () => {
        it('puts the five featured assets first in their fixed order', async () => {
            const solAsset: TradeableAsset = {
                ...unknownAsset,
                cryptoId: 'solana' as CryptoId,
                networkId: 'solana',
                symbol: 'SOL',
                name: 'Solana',
            };
            const assets = [usdcAsset, solAsset, ethAsset, usdtAsset, btcAsset];
            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            expect(result.current.filteredData).toEqual([
                btcAsset,
                ethAsset,
                usdtAsset,
                usdcAsset,
                solAsset,
            ]);
        });

        it('puts owned assets over the USD threshold next, ordered by fiat value', async () => {
            const assetBalances = new Map([
                [
                    jitoOnSolanaAsset.cryptoId,
                    {
                        cryptoAmount: '4',
                        fiatAmount: asBaseCurrencyAmount(new BigNumber('0.2')),
                    },
                ],
                [
                    rethOnBaseAsset.cryptoId,
                    {
                        cryptoAmount: '2',
                        fiatAmount: asBaseCurrencyAmount(new BigNumber('0.11')),
                    },
                ],
                [
                    jupOnSolanaAsset.cryptoId,
                    {
                        cryptoAmount: '3',
                        fiatAmount: asBaseCurrencyAmount(new BigNumber('0.1')),
                    },
                ],
            ]);
            const assets = [rethOnBaseAsset, jitoOnSolanaAsset, jupOnSolanaAsset];
            const { result } = await renderHook(() =>
                useTradeableAssetsFilteredData({
                    assets,
                    assetBalances,
                    preferredCurrencyUsdThreshold: asBaseCurrencyAmount(new BigNumber('0.1')),
                }),
            );

            expect(result.current.filteredData).toEqual([
                jitoOnSolanaAsset,
                rethOnBaseAsset,
                jupOnSolanaAsset,
            ]);
        });

        it('should rank exact name match before name-startsWith', async () => {
            // tronTetherAsset.name = 'Tether' (exact match), usdtAsset.name = 'Tether USDT' (startsWith)
            const assets = [usdtAsset, tronTetherAsset];
            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            await act(() => {
                result.current.setFilterValue('tether');
            });

            expect(result.current.filteredData[0]).toBe(tronTetherAsset);
            expect(result.current.filteredData[1]).toBe(usdtAsset);
        });

        it('should rank exact symbol match before symbol-startsWith', async () => {
            // Inline asset with symbol starting with 'usd' but not exact; usdcAsset.symbol = 'USDC' also startsWith.
            // We create an asset with symbol exactly 'USD' to compare against 'USDC'.
            const usdExactAsset: TradeableAsset = {
                ...unknownAsset,
                symbol: 'USD',
                name: 'US Dollar',
            };
            const assets = [usdcAsset, usdExactAsset];
            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            await act(() => {
                result.current.setFilterValue('usd');
            });

            // usdExactAsset: symbol === 'usd' → weight 1
            // usdcAsset: symbol startsWith 'usd' → weight 3
            expect(result.current.filteredData[0]).toBe(usdExactAsset);
            expect(result.current.filteredData[1]).toBe(usdcAsset);
        });

        it('should rank name-startsWith before name-contains', async () => {
            // ethAsset.name = 'Ethereum' → startsWith 'et' → weight 2
            // rethOnBaseAsset.name = 'Rocket Pool ETH' → contains 'et' but not startsWith → weight 4
            // Also: ethAsset.symbol = 'ETH' → 'eth' !== 'et', so no symbol exact match; name check wins at weight 2
            const assets = [rethOnBaseAsset, ethAsset];
            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            await act(() => {
                result.current.setFilterValue('et');
            });

            expect(result.current.filteredData[0]).toBe(ethAsset);
            expect(result.current.filteredData[1]).toBe(rethOnBaseAsset);
        });

        it('should rank asset name/symbol matches before network name matches', async () => {
            // ethAsset.name = 'Ethereum' → exact name match → weight 0
            // usdcAsset.networkId = 'ethereum' → network name 'Ethereum' exact match → weight 6
            const assets = [usdcAsset, ethAsset];
            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            await act(() => {
                result.current.setFilterValue('ethereum');
            });

            expect(result.current.filteredData[0]).toBe(ethAsset);
            expect(result.current.filteredData[1]).toBe(usdcAsset);
        });

        it('should rank contract address matches after name/symbol matches', async () => {
            // Inline asset with '0xa0b' in its name → name startsWith → weight 2
            // usdcAsset.contractAddress starts with '0xa0b' → weight 12
            const contractNameAsset: TradeableAsset = { ...unknownAsset, name: '0xa0b Token' };
            const assets = [usdcAsset, contractNameAsset];
            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            await act(() => {
                result.current.setFilterValue('0xa0b');
            });

            expect(result.current.filteredData[0]).toBe(contractNameAsset);
            expect(result.current.filteredData[1]).toBe(usdcAsset);
        });

        it('should not change order when filter is empty', async () => {
            const assets = [btcAsset, ethAsset, usdcAsset];
            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            // No filter set — original order should be preserved
            expect(result.current.filteredData).toEqual(assets);
        });

        it('should order match on token address as last', async () => {
            const assets = [btcAsset, ethAsset, usdcAsset, tronTetherAsset] as TradeableAsset[];

            const { result } = await renderHook(() => useTradeableAssetsFilteredData({ assets }));

            await act(() => {
                result.current.setFilterValue('tc');
            });

            expect(result.current.filteredData).toEqual([btcAsset, tronTetherAsset]);
        });
    });

    describe('filterValue', () => {
        it('should have correct value for empty filter', async () => {
            const { result } = await renderUseTradeableAssetsFilteredData();

            expect(result.current.filterValue).toEqual('Network:all;Search:');
        });

        it('should be affected by search value', async () => {
            const { result } = await renderUseTradeableAssetsFilteredData();

            await act(() => {
                result.current.setFilterValue('search text');
            });

            expect(result.current.filterValue).toEqual('Network:all;Search:search text');
        });

        it('should be affected by network selection', async () => {
            const { result } = await renderUseTradeableAssetsFilteredData();

            await act(() => {
                result.current.setFilterSymbol('eth' as NetworkSymbol);
            });

            expect(result.current.filterValue).toEqual('Network:eth;Search:');
        });

        it('should be affected by both search value and network selection', async () => {
            const { result } = await renderUseTradeableAssetsFilteredData();

            await act(() => {
                result.current.setFilterValue('search text');
                result.current.setFilterSymbol('eth' as NetworkSymbol);
            });

            expect(result.current.filterValue).toEqual('Network:eth;Search:search text');
        });
    });
});
