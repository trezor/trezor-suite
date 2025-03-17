import { Coins, CryptoId, FiatCurrenciesProps, Platforms } from 'invity-api';

import coins from '../../__fixtures__/coins.json';
import platforms from '../../__fixtures__/platforms.json';
import { TradingBuyState } from '../../reducers/buyReducer';
import { initialState } from '../../reducers/tradingReducer';
import { TradingPaymentMethodListProps } from '../../types';
import {
    TradingRootState,
    selectTrading,
    selectTradingBuy,
    selectTradingBuyProviders,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    selectTradingBuySupportedCryptoIds,
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
    let state: TradingRootState;

    const getBuyState = () =>
        ({
            ...initialState.buy,
            quotesRequest: {
                wantCrypto: true,
                fiatCurrency: 'fiatCurrency',
                paymentMethod: 'eps',
                receiveCurrency: 'bitcoin' as CryptoId,
            },
            selectedQuote: {
                paymentMethod: 'eps',
            },
            buyInfo: {
                buyInfo: {
                    country: 'CZ',
                    providers: [] as any[],
                    defaultAmountsOfFiatCurrencies: { usd: 150, eur: 100 } as FiatCurrenciesProps,
                    suggestedFiatCurrency: 'CZK',
                },
                supportedCryptoCurrencies: [
                    'eos',
                    'bitcoin',
                    'bitcoin', // seems that there can be duplicated values
                    'ethereum',
                    'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    'base--0x0000000000000000000000000000000000000000',
                    'ethereum--0xWithoutObjectInCoinsInfo', // there are values not presented in info.coins map
                ] as CryptoId[],
                providerInfos: {},
                supportedFiatCurrencies: ['usd', 'eur', 'czk'],
            },
        }) as TradingBuyState;

    const getState = () =>
        ({
            wallet: {
                tradingNew: {
                    ...initialState,
                    buy: getBuyState(),
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
            suite: {
                settings: {
                    addressDisplayType: 'original',
                    debug: { invityServerEnvironment: undefined },
                },
            },
        }) as TradingRootState;

    beforeEach(() => {
        state = getState();
    });

    it('selectTradingInfoLegacy should select legacy info', () => {
        const legacyState = { wallet: { trading: { info: {} } } };

        expect(selectTradingInfoLegacy(legacyState)).toBe(legacyState.wallet.trading.info);
    });

    describe('selectTradingBuy', () => {
        it('should return correct data', () => {
            const expectedState = getBuyState() as Record<string, any>;
            expectedState.buyInfo.buyInfo.defaultAmountsOfFiatCurrencies = new Map([
                ['usd', '150'],
                ['eur', '100'],
            ]);
            expectedState.buyInfo.supportedCryptoCurrencies = new Set([
                'eos',
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ]);
            expectedState.buyInfo.supportedFiatCurrencies = new Set(['usd', 'eur', 'czk']);

            expect(selectTradingBuy(state)).toEqual(expectedState);
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

    describe('selectTradingBuySupportedCryptoIds', () => {
        it('should select only coins presented in buyInfo and info', () => {
            expect(selectTradingBuySupportedCryptoIds(state)).toEqual([
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
            ]);
        });

        it('should be stable', () => {
            const first = selectTradingBuySupportedCryptoIds(state);
            const second = selectTradingBuySupportedCryptoIds(state);

            expect(first).toBe(second);
        });

        it('should be empty array when platforms are not set', () => {
            state.wallet.tradingNew.info.platforms = undefined;

            expect(selectTradingBuySupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.tradingNew.info.coins = undefined;

            expect(selectTradingBuySupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when supportedCryptoCurrencies are not set', () => {
            state.wallet.tradingNew.buy.buyInfo = undefined;

            expect(selectTradingBuySupportedCryptoIds(state)).toEqual([]);
        });
    });
});
