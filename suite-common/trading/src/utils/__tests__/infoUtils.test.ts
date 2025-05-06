import { CryptoId } from 'invity-api';

import coins from '../../__fixtures__/coins.json';
import platforms from '../../__fixtures__/platforms.json';
import { toTokenCryptoId } from '../../utils';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
    toCryptoOption,
} from '../infoUtils';

describe('infoUtils', () => {
    it('getTradingCoinInfoByCryptoId should select coin', () => {
        expect(getTradingCoinInfoByCryptoId(coins, 'bitcoin' as CryptoId)).toEqual(coins.bitcoin);
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

    describe('toCryptoOption', () => {
        const btcCryptoId = 'bitcoin' as CryptoId;

        it('should return correct data for bitcoin', () => {
            const bitcoinCoins = coins.bitcoin;

            expect(toCryptoOption(btcCryptoId, bitcoinCoins)).toEqual({
                type: 'currency',
                value: btcCryptoId,
                label: bitcoinCoins.symbol.toUpperCase(),
                cryptoName: bitcoinCoins.name,
                coingeckoId: 'bitcoin',
                contractAddress: null,
                symbol: bitcoinCoins.symbol,
            });
        });

        it('should return correct data for ethereum on the base network', () => {
            const baseCryptoId = toTokenCryptoId(
                'base',
                '0x0000000000000000000000000000000000000000',
            );
            const baseCoins = coins['base--0x0000000000000000000000000000000000000000'];

            expect(toCryptoOption(baseCryptoId, baseCoins)).toEqual({
                type: 'currency',
                value: baseCryptoId,
                label: baseCoins.symbol.toUpperCase(),
                cryptoName: baseCoins.name,
                coingeckoId: 'base',
                contractAddress: '0x0000000000000000000000000000000000000000',
                symbol: 'base',
            });
        });

        it('should return correct data for ethereum token data', () => {
            const ethereumCryptoId = toTokenCryptoId(
                'eth',
                '0x07150e919b4de5fd6a63de1f9384828396f25fdc',
            );
            const ethereumCoins = coins['ethereum--0x07150e919b4de5fd6a63de1f9384828396f25fdc'];

            expect(toCryptoOption(ethereumCryptoId, ethereumCoins)).toEqual({
                type: 'currency',
                value: ethereumCryptoId,
                label: ethereumCoins.symbol.toUpperCase(),
                cryptoName: ethereumCoins.name,
                coingeckoId: 'ethereum',
                contractAddress: '0x07150e919b4de5fd6a63de1f9384828396f25fdc',
                symbol: ethereumCoins.symbol,
            });
        });
    });
});
