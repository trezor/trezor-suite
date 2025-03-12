import { CoinInfo, CryptoId } from 'invity-api';

import coins from '../../__fixtures__/coins.json';
import platforms from '../../__fixtures__/platforms.json';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
} from '../infoUtils';

const btcCoinInfo: CoinInfo = {
    name: 'Bitcoin',
    symbol: 'btc',
    coingeckoId: 'bitcoin',
    services: {
        buy: true,
        sell: true,
        exchange: true,
    },
};

describe('infoUtils', () => {
    it('getTradingCoinInfoByCryptoId should select coin', () => {
        expect(getTradingCoinInfoByCryptoId(coins, 'bitcoin' as CryptoId)).toEqual(btcCoinInfo);
    });

    describe('getTradingCoinSymbolByCryptoId', () => {
        it('should return symbol as uppercase', () => {
            expect(getTradingCoinSymbolByCryptoId(coins, 'bitcoin' as CryptoId)).toBe('BTC');
        });

        it('should return undefined for non-existing coin', () => {
            expect(getTradingCoinSymbolByCryptoId({}, 'bitcoin' as CryptoId)).toBeUndefined();
        });
    });

    it('getTradingPlatformsInfoByCryptoId should select platform', () => {
        expect(getTradingPlatformsInfoByCryptoId(platforms, 'ethereum' as CryptoId)).toEqual({
            id: 'ethereum',
            name: 'Ethereum',
            nativeCoinSymbol: 'eth',
        });
    });

    it.each([
        ['bitcoin', 'btc'],
        ['ethereum', 'eth'],
        ['ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'eth'],
        ['unknown', undefined],
    ] as [CryptoId, string][])(
        'getTradingNativeCoinSymbolByCryptoId should return native coin symbol for cryptoId [%s]',
        (cryptoId, expected) => {
            expect(getTradingNativeCoinSymbolByCryptoId(platforms, coins, cryptoId)).toBe(expected);
        },
    );

    describe('getTradingSymbolAndContractAddressByCryptoId', () => {
        it.each([
            ['bitcoin', { coinSymbol: 'btc', contractAddress: undefined }],
            [
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                {
                    coinSymbol: 'usdc',
                    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                },
            ],
        ] as [CryptoId, { coinSymbol: string; contractAddress: string }][])(
            'should return correct data for cryptoId [%s]',
            (cryptoId, expected) => {
                expect(getTradingSymbolAndContractAddressByCryptoId(coins, cryptoId)).toEqual(
                    expected,
                );
            },
        );

        it('should work without coins', () => {
            expect(
                getTradingSymbolAndContractAddressByCryptoId(undefined, 'bitcoin' as CryptoId),
            ).toEqual({
                coinSymbol: undefined,
                contractAddress: undefined,
            });
        });

        it('should work without cryptoId', () => {
            expect(getTradingSymbolAndContractAddressByCryptoId(coins, undefined)).toEqual({
                coinSymbol: undefined,
                contractAddress: undefined,
            });
        });
    });
});
