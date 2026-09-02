import type { CoinInfo, CryptoId } from 'invity-api';

import { btcAsset, coins, usdcAsset } from '@suite-native/trading-fixtures';

import { coinInfoToTradeableAsset, getSymbolFromTradeableAsset } from './tradeableAssetUtils';

describe('tradeableAssetUtils', () => {
    describe('coinInfoToTradeableAsset', () => {
        it('should transform info correctly for bitcoin', () => {
            const cryptoId = 'bitcoin' as const;
            expect(
                coinInfoToTradeableAsset(cryptoId as CryptoId, coins[cryptoId] as CoinInfo),
            ).toEqual({
                cryptoId: 'bitcoin',
                symbol: 'BTC',
                name: 'Bitcoin',
                coingeckoId: 'bitcoin',
                networkId: 'bitcoin',
            });
        });

        it('should transform native ETH network correctly', () => {
            const cryptoId = 'base--0x0000000000000000000000000000000000000000' as const;
            expect(coinInfoToTradeableAsset(cryptoId as CryptoId, coins[cryptoId])).toEqual({
                cryptoId: 'base--0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                name: 'Ethereum',
                coingeckoId: 'ethereum',
                networkId: 'base',
            });
        });

        it('should transform token', () => {
            const cryptoId = 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc' as const;
            expect(coinInfoToTradeableAsset(cryptoId as CryptoId, coins[cryptoId])).toEqual({
                cryptoId: 'ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc',
                symbol: 'BASE',
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
});
