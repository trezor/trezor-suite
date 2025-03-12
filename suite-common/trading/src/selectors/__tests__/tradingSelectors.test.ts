import { Coins, CryptoId, Platforms } from 'invity-api';

import coins from '../../__fixtures__/coins.json';
import platforms from '../../__fixtures__/platforms.json';
import { initialState } from '../../reducers/tradingReducer';
import { TradingPaymentMethodListProps } from '../../types';
import {
    TradingRootState,
    selectTrading,
    selectTradingBuy,
    selectTradingBuyProviders,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    selectTradingCoinInfoByCryptoId,
    selectTradingCoinSymbolByCryptoId,
    selectTradingInfoLegacy,
    selectTradingNativeCoinSymbolByCryptoId,
    selectTradingPaymentMethods,
    selectTradingPlatformByCryptoId,
    selectTradingSymbolAndContractAddressByCryptoId,
    selectTradingTrades,
} from '../tradingSelectors';

describe('tradingSelectors', () => {
    const state = {
        wallet: {
            tradingNew: {
                ...initialState,
                buy: {
                    ...initialState.buy,
                    quotesRequest: {
                        wantCrypto: true,
                        fiatCurrency: 'fiatCurrency',
                        paymentMethod: 'eps',
                        receiveCurrency: 'bitcoin',
                    },
                    selectedQuote: {
                        paymentMethod: 'eps',
                    },
                },
                info: {
                    paymentMethods: [
                        {
                            value: 'creditCard',
                            label: 'Credit Card label',
                        },
                    ] as TradingPaymentMethodListProps[],
                    coins: coins as Coins,
                    platforms: platforms as Platforms,
                },
                trades: [{ tradeType: 'buy' }],
            },
        },
    } as TradingRootState;

    it('selectTradingInfoLegacy should select legacy info', () => {
        const legacyState = { wallet: { trading: { info: {} } } };

        expect(selectTradingInfoLegacy(legacyState)).toBe(legacyState.wallet.trading.info);
    });

    describe('selectTradingBuy', () => {
        it('should return correct data', () => {
            expect(selectTradingBuy(state)).toEqual(state.wallet.tradingNew.buy);
        });

        it('should be stable', () => {
            expect(selectTradingBuy(state)).toBe(selectTradingBuy(state));
        });
    });

    describe('selectTrading', () => {
        it('should return correct data', () => {
            expect(selectTrading(state)).toEqual({
                ...state.wallet.tradingNew,
                buy: selectTradingBuy(state),
            });
        });

        it('should be stable', () => {
            expect(selectTrading(state)).toBe(selectTrading(state));
        });
    });

    describe('selectTradingBuyProviders', () => {
        it('should return correct data', () => {
            expect(selectTradingBuyProviders(state)).toEqual(
                state.wallet.tradingNew.buy.buyInfo?.providerInfos,
            );
        });

        it('should be stable', () => {
            expect(selectTradingBuyProviders(state)).toBe(selectTradingBuyProviders(state));
        });
    });

    it('selectTradingBuyQuotesRequest should return correct data', () => {
        expect(selectTradingBuyQuotesRequest(state)).toBe(
            state.wallet.tradingNew.buy.quotesRequest,
        );
    });

    it('selectTradingBuySelectedQuote should return correct data', () => {
        expect(selectTradingBuySelectedQuote(state)).toBe(
            state.wallet.tradingNew.buy.selectedQuote,
        );
    });

    it('selectTradingPaymentMethods should return correct data', () => {
        expect(selectTradingPaymentMethods(state)).toBe(
            state.wallet.tradingNew.info.paymentMethods,
        );
    });

    it('selectTradingTrades should return correct data', () => {
        expect(selectTradingTrades(state)).toBe(state.wallet.tradingNew.trades);
    });

    it('selectTradingCoinInfoByCryptoId should return coin data', () => {
        expect(selectTradingCoinInfoByCryptoId(state, 'bitcoin' as CryptoId)).toEqual({
            symbol: 'btc',
            name: 'Bitcoin',
            coingeckoId: 'bitcoin',
            services: {
                buy: true,
                sell: true,
                exchange: true,
            },
        });
    });

    it('selectTradingCoinSymbolByCryptoId should return coin symbol', () => {
        expect(selectTradingCoinSymbolByCryptoId(state, 'bitcoin' as CryptoId)).toBe('BTC');
    });

    it('selectTradingPlatformByCryptoId should return platform data', () => {
        expect(selectTradingPlatformByCryptoId(state, 'ethereum' as CryptoId)).toEqual({
            id: 'ethereum',
            name: 'Ethereum',
            nativeCoinSymbol: 'eth',
        });
    });

    it.each([
        ['bitcoin', 'btc'],
        ['ethereum', 'eth'],
        ['ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'eth'],
    ] as [CryptoId, string][])(
        'selectTradingNativeCoinSymbolByCryptoId should return native coin symbol for cryptoId [%s]',
        (cryptoId, expected) => {
            expect(selectTradingNativeCoinSymbolByCryptoId(state, cryptoId)).toBe(expected);
        },
    );

    describe('selectTradingSymbolAndContractAddressByCryptoId', () => {
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
            (cryptoId, expectedResult) => {
                expect(selectTradingSymbolAndContractAddressByCryptoId(state, cryptoId)).toEqual(
                    expectedResult,
                );
            },
        );

        it('should be stable', () => {
            expect(
                selectTradingSymbolAndContractAddressByCryptoId(state, 'bitcoin' as CryptoId),
            ).toBe(selectTradingSymbolAndContractAddressByCryptoId(state, 'bitcoin' as CryptoId));
        });
    });
});
