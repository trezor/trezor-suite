import { Coins, CryptoId, FiatCurrenciesProps, Platforms } from 'invity-api';

import { TradingPaymentMethodProps } from '@suite-common/trading';

import coins from '../../__fixtures__/coins.json';
import platforms from '../../__fixtures__/platforms.json';
import { TradingBuyState } from '../../reducers/buyReducer';
import { initialState } from '../../reducers/tradingReducer';
import { TradingPaymentMethodListProps } from '../../types';
import {
    TradingRootState,
    selectBestBuyQuoteByPaymentMethod,
    selectBuyQuotesByPaymentMethod,
    selectTrading,
    selectTradingBuy,
    selectTradingBuyInfo,
    selectTradingBuyIsLoading,
    selectTradingBuyProviders,
    selectTradingBuyQuoteByQuoteId,
    selectTradingBuyQuotes,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    selectTradingBuySupportedCryptoIds,
    selectTradingCoinInfoByCryptoId,
    selectTradingCoinSymbolByCryptoId,
    selectTradingComposedTransactionInfo,
    selectTradingExchange,
    selectTradingExchangeFormStep,
    selectTradingExchangeInfo,
    selectTradingExchangeProviders,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
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
            quotes: [
                {
                    fiatStringAmount: '10',
                    fiatCurrency: 'EUR',
                    receiveCurrency: 'bitcoin',
                    receiveStringAmount: '0.0005',
                    rate: 20000,
                    paymentMethod: 'eps',
                    quoteId: 'quoteId1',
                    orderId: 'orderId1',
                    exchange: 'topper',
                },
                {
                    fiatStringAmount: '10',
                    fiatCurrency: 'EUR',
                    receiveCurrency: 'bitcoin',
                    receiveStringAmount: '0.001',
                    rate: 10000,
                    paymentMethod: 'eps',
                    quoteId: 'quoteId2',
                    orderId: 'orderId2',
                    exchange: 'banxa',
                },
                {
                    fiatStringAmount: '10',
                    fiatCurrency: 'EUR',
                    receiveCurrency: 'bitcoin',
                    receiveStringAmount: '0.002',
                    rate: 5000,
                    paymentMethod: 'cred',
                    quoteId: 'quoteId1',
                    orderId: 'orderId3',
                    exchange: 'invity',
                },
            ],
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
                    composedTransactionInfo: {
                        composed: {
                            feePerByte: '1',
                        },
                        selectedFee: 'normal',
                    },
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

    describe('selectTradingExchange', () => {
        it('should return correct data', () => {
            expect(selectTradingExchange(state)).toEqual(state.wallet.tradingNew.exchange);
        });

        it('should be stable', () => {
            expect(selectTradingExchange(state)).toBe(selectTradingExchange(state));
        });
    });

    describe('selectTradingBuyInfo', () => {
        it('should return correct data', () => {
            const stateBuy = {
                wallet: {
                    tradingNew: {
                        buy: {
                            buyInfo: {
                                buyInfo: {},
                                providerInfos: {},
                                supportedFiatCurrencies: [] as string[],
                                supportedCryptoCurrencies: [] as CryptoId[],
                            },
                        },
                    },
                },
            } as TradingRootState;

            expect(selectTradingBuyInfo(stateBuy)).toEqual({
                buyInfo: {
                    defaultAmountsOfFiatCurrencies: new Map(),
                },
                providerInfos: {},
                supportedFiatCurrencies: new Set(),
                supportedCryptoCurrencies: new Set(),
            });
        });

        const stateBuyWithUndefinedInfo = {
            wallet: {
                tradingNew: {
                    buy: {},
                },
            },
        } as TradingRootState;

        it('should return undefined', () => {
            expect(selectTradingBuyInfo(stateBuyWithUndefinedInfo)).toEqual(undefined);
        });

        it('should be stable', () => {
            expect(selectTradingBuyInfo(state)).toBe(selectTradingBuyInfo(state));
        });
    });

    describe('selectTradingExchangeInfo', () => {
        it('should return correct data', () => {
            const stateExchange = {
                wallet: {
                    tradingNew: {
                        exchange: {
                            exchangeInfo: {
                                providerInfos: {},
                                buyCryptoIds: [] as CryptoId[],
                                sellCryptoIds: [] as CryptoId[],
                            },
                        },
                    },
                },
            } as TradingRootState;

            expect(selectTradingExchangeInfo(stateExchange)).toEqual({
                providerInfos: {},
                buyCryptoIds: new Set(),
                sellCryptoIds: new Set(),
            });
        });

        it('should return undefined', () => {
            expect(selectTradingExchangeInfo(state)).toEqual(undefined);
        });

        it('should be stable', () => {
            expect(selectTradingExchangeInfo(state)).toBe(selectTradingExchangeInfo(state));
        });
    });

    describe('selectTrading', () => {
        it('should return correct data', () => {
            const {
                wallet: { tradingNew },
            } = getState() as Record<string, any>;

            tradingNew.buy.buyInfo.supportedCryptoCurrencies = new Set([
                'eos',
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ]);
            tradingNew.buy.buyInfo.supportedFiatCurrencies = new Set(['usd', 'eur', 'czk']);
            tradingNew.buy.buyInfo.buyInfo.defaultAmountsOfFiatCurrencies = new Map([
                ['usd', '150'],
                ['eur', '100'],
            ]);

            expect(selectTrading(state)).toEqual(tradingNew);
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

    describe('selectTradingExchangeProviders', () => {
        it('should return correct data', () => {
            expect(selectTradingExchangeProviders(state)).toEqual(
                state.wallet.tradingNew.exchange.exchangeInfo?.providerInfos,
            );
        });

        it('should be stable', () => {
            expect(selectTradingExchangeProviders(state)).toBe(
                selectTradingExchangeProviders(state),
            );
        });
    });

    it('selectTradingBuyQuotesRequest should return correct data', () => {
        expect(selectTradingBuyQuotesRequest(state)).toBe(
            state.wallet.tradingNew.buy.quotesRequest,
        );
    });

    it('selectTradingExchangeQuotesRequest should return correct data', () => {
        expect(selectTradingExchangeQuotesRequest(state)).toBe(
            state.wallet.tradingNew.exchange.quotesRequest,
        );
    });

    it('selectTradingBuySelectedQuote should return correct data', () => {
        expect(selectTradingBuySelectedQuote(state)).toBe(
            state.wallet.tradingNew.buy.selectedQuote,
        );
    });

    it('selectTradingExchangeSelectedQuote should return correct data', () => {
        expect(selectTradingExchangeSelectedQuote(state)).toBe(
            state.wallet.tradingNew.exchange.selectedQuote,
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

    describe('selectTradingBuyIsLoading', () => {
        it('should be false when trading is not loading', () => {
            expect(selectTradingBuyIsLoading(state)).toBe(false);
        });

        it('should be true when trading is loading', () => {
            state.wallet.tradingNew.buy.isLoading = true;

            expect(selectTradingBuyIsLoading(state)).toBe(true);
        });
    });

    describe('selectTradingBuyQuotes', () => {
        it('should return quotes', () => {
            expect(selectTradingBuyQuotes(state)).toBe(state.wallet.tradingNew.buy.quotes);
        });
    });

    describe('selectBestBuyQuoteByPaymentMethod', () => {
        it('should return best quote', () => {
            expect(selectBestBuyQuoteByPaymentMethod(state, 'eps')).toEqual(
                expect.objectContaining({
                    paymentMethod: 'eps',
                    quoteId: 'quoteId2',
                }),
            );
        });

        it('should be undefined when payment method is not specified', () => {
            expect(selectBestBuyQuoteByPaymentMethod(state, undefined)).toBeUndefined();
        });

        it('should be undefined when no quotes are loaded', () => {
            state.wallet.tradingNew.buy.quotes = [];

            expect(selectBestBuyQuoteByPaymentMethod(state, 'eps')).toBeUndefined();
        });
    });

    describe('selectBuyQuotesByPaymentMethod', () => {
        it('should return undefined when payment method is not provided', () => {
            const result = selectBuyQuotesByPaymentMethod(state, undefined);
            expect(result).toBeUndefined();
        });

        it('should filter quotes by payment method and sort by rate', () => {
            const paymentMethod: TradingPaymentMethodProps = 'eps';
            const result = selectBuyQuotesByPaymentMethod(state, paymentMethod);

            expect(result).toHaveLength(2);
            expect(result?.[0].orderId).toBe('orderId2');
            expect(result?.[1].orderId).toBe('orderId1');
        });

        it('should return empty array when no quotes match payment method', () => {
            const paymentMethod: TradingPaymentMethodProps = 'bankTransfer';
            const result = selectBuyQuotesByPaymentMethod(state, paymentMethod);

            expect(result).toHaveLength(0);
        });
    });

    describe('selectTradingBuyQuoteByQuoteId', () => {
        it('should return undefined when quoteId1 is not provided', () => {
            const result = selectTradingBuyQuoteByQuoteId(state, undefined);
            expect(result).toBeUndefined();
        });

        it('should return undefined when quote with quoteId is not found', () => {
            const result = selectTradingBuyQuoteByQuoteId(state, 'non_existent_id');
            expect(result).toBeUndefined();
        });

        it('should return correct quote', () => {
            const result = selectTradingBuyQuoteByQuoteId(state, 'quoteId1');
            expect(result?.orderId).toBe('orderId1');
        });
    });

    it('selectTradingExchangeFormStep should return formStep', () => {
        expect(selectTradingExchangeFormStep(state)).toBe('RECEIVING_ADDRESS');
    });

    it('selectTradingComposedTransactionInfo should return composed and selectedFee information', () => {
        expect(selectTradingComposedTransactionInfo(state)).toEqual({
            composed: {
                feePerByte: '1',
            },
            selectedFee: 'normal',
        });
    });
});
