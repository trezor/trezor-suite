import { CoinInfo, CryptoId } from 'invity-api';

import coins from '../../../__fixtures__/coins.json';
import {
    btcAsset,
    ethAsset,
    ethOnBaseAsset,
    usdcAsset,
} from '../../../__fixtures__/tradeableAssets';
import {
    coinInfoToTradeableAsset,
    getSymbolFromTradeableAsset,
    tradeableAssetSortingComparator,
} from '../tradeableAssetUtils';

describe('tradeableAssetUtils', () => {
    describe('coinInfoToTradeableAsset', () => {
        it('should transform info correctly for bitcoin', () => {
            const cryptoId = 'bitcoin' as const;
            expect(
                coinInfoToTradeableAsset(cryptoId as CryptoId, coins[cryptoId] as CoinInfo),
            ).toEqual({
                cryptoId: 'bitcoin',
                symbol: 'btc',
                name: 'Bitcoin',
                coingeckoId: 'bitcoin',
                networkId: 'bitcoin',
            });
        });

        it('should transform native ETH network correctly', () => {
            const cryptoId = 'base--0x0000000000000000000000000000000000000000' as const;
            expect(coinInfoToTradeableAsset(cryptoId as CryptoId, coins[cryptoId])).toEqual({
                cryptoId: 'base--0x0000000000000000000000000000000000000000',
                symbol: 'eth',
                name: 'Ethereum',
                coingeckoId: 'ethereum',
                networkId: 'base',
            });
        });

        it('should transform token', () => {
            const cryptoId = 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc' as const;
            expect(coinInfoToTradeableAsset(cryptoId as CryptoId, coins[cryptoId])).toEqual({
                cryptoId: 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc',
                symbol: 'base',
                name: 'Base Protocol',
                coingeckoId: 'base-protocol',
                contractAddress: '0x07150e919b4de5fd6a63de1f9384828396f25fdc',
                networkId: 'ethereum',
            });
        });
    });

    describe('getSymbolFromTradeableAsset', () => {
        it.each([
            [undefined, undefined],
            [btcAsset, 'btc'],
            [usdcAsset, 'eth'],
        ])('should return symbol based on asset.cryptoId', (asset, expectedSymbol) => {
            expect(getSymbolFromTradeableAsset(asset)).toEqual(expectedSymbol);
        });
    });

    describe('tradeableAssetSortingComparator', () => {
        it('should sort assets', () => {
            const assets = [btcAsset, ethAsset, usdcAsset, ethOnBaseAsset];

            expect(assets.sort(tradeableAssetSortingComparator)).toEqual([
                expect.objectContaining({ cryptoId: 'bitcoin' }),
                expect.objectContaining({ cryptoId: 'ethereum' }),
                expect.objectContaining({
                    cryptoId: 'base--0x0000000000000000000000000000000000000000',
                }),
                expect.objectContaining({
                    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                }),
            ]);
        });
    });
});
