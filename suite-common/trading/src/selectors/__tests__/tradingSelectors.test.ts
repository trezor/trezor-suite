import type {
    BuyTrade,
    Coins,
    CryptoId,
    FiatCurrenciesProps,
    FiatCurrencyCode,
    Platforms,
} from 'invity-api';

import {
    TradingPaymentMethodProps,
    selectTradingBuyLoadingTimestampAndStatus,
} from '@suite-common/trading';
import { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import { StaticSessionId } from '@trezor/connect';

import coins from '../../__fixtures__/coins.json';
import { invityAPIFixtures } from '../../__fixtures__/invityAPI';
import platforms from '../../__fixtures__/platforms.json';
import { accountBtc, accountEth } from '../../__fixtures__/utils';
import { BuyInfo, TradingBuyState } from '../../reducers/buyReducer';
import { ExchangeInfo, exchangeInitialState } from '../../reducers/exchangeReducer';
import { SellInfo, sellInitialState } from '../../reducers/sellReducer';
import { initialState } from '../../reducers/tradingReducer';
import { TradingPaymentMethodListProps } from '../../types';
import {
    TradingRootState,
    selectBestBuyQuoteByPaymentMethod,
    selectBuyQuotesByPaymentMethod,
    selectDeviceHasTradingTradesOfTradeType,
    selectDeviceTradingTradesByTradeType,
    selectDeviceTradingTradesByTradeTypeOrderedByDate,
    selectTrading,
    selectTradingAccountAccordingActiveSection,
    selectTradingActiveSection,
    selectTradingBuy,
    selectTradingBuyInfo,
    selectTradingBuyIsLoading,
    selectTradingBuyProviders,
    selectTradingBuyQuoteByOrderId,
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
    selectTradingExchangeSellCryptoIds,
    selectTradingModalAccountKey,
    selectTradingNativeCoinSymbolByCryptoId,
    selectTradingPaymentMethods,
    selectTradingPlatformByCryptoId,
    selectTradingPrefilledFromCryptoId,
    selectTradingProviderByNameAndTradeType,
    selectTradingSellFormStep,
    selectTradingSellInfo,
    selectTradingSellProviders,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    selectTradingSellSupportedCryptoIds,
    selectTradingSupportedSymbols,
    selectTradingSymbolAndContractAddressByCryptoId,
    selectTradingTradeByOrderId,
    selectTradingTrades,
    selectTradingTradesForSelectedDevice,
    selectValidTradingBuyQuotes,
} from '../tradingSelectors';

describe('tradingSelectors', () => {
    let state: TradingRootState & DeviceRootState & AccountsRootState;

    const getBuyState = () =>
        ({
            ...initialState.buy,
            tradingAccountKey: accountBtc.key,
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
                    providers: invityAPIFixtures.buyList,
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
                providerInfos: { test: invityAPIFixtures.buyList[0] },
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
            ] as BuyTrade[],
        }) as TradingBuyState;

    const getSellState = () => ({
        ...initialState.sell,
        sellInfo: {
            providerInfos: {},
            supportedFiatCurrencies: [] as string[],
            supportedCryptoCurrencies: [
                'eos',
                'bitcoin',
                'bitcoin', // seems that there can be duplicated values
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo', // there are values not presented in info.coins map
            ] as CryptoId[],
            country: 'CZ',
        },
    });

    const getExchangeState = () => ({
        ...initialState.exchange,
        exchangeInfo: {
            providerInfos: {},
            buyCryptoIds: ['bitcoin'] as CryptoId[],
            sellCryptoIds: [
                'eos',
                'bitcoin',
                'bitcoin', // seems that there can be duplicated values
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo', // there are values not presented in info.coins map
            ] as CryptoId[],
        },
    });

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
                    exchange: {
                        ...exchangeInitialState,
                        ...getExchangeState(),
                        tradingAccountKey: accountEth.key,
                    },
                    sell: {
                        ...sellInitialState,
                        ...getSellState(),
                        tradingAccountKey: accountBtc.key,
                    },
                    trades: [
                        {
                            tradeType: 'buy',
                            data: { orderId: 'orderId1' },
                            date: '2024-03-01T10:00:00Z',
                            account: {
                                descriptor: accountEth.descriptor,
                                symbol: accountEth.symbol,
                                accountType: accountEth.accountType,
                                accountIndex: accountEth.index,
                            },
                        },
                        {
                            tradeType: 'buy',
                            data: { orderId: 'orderId2' },
                            date: '2024-03-02T10:00:00Z',
                            account: {
                                descriptor: accountEth.descriptor,
                                symbol: accountEth.symbol,
                                accountType: accountEth.accountType,
                                accountIndex: accountEth.index,
                            },
                        },
                        {
                            tradeType: 'buy',
                            data: { orderId: 'orderId3' },
                            date: '2024-03-03T10:00:00Z',
                            account: {
                                descriptor: accountEth.descriptor,
                                symbol: accountEth.symbol,
                                accountType: accountEth.accountType,
                                accountIndex: accountEth.index,
                            },
                        },
                        {
                            tradeType: 'exchange',
                            data: { orderId: 'orderId4' },
                            date: '2024-03-04T10:00:00Z',
                            account: {
                                descriptor: accountEth.descriptor,
                                symbol: accountEth.symbol,
                                accountType: accountEth.accountType,
                                accountIndex: accountEth.index,
                            },
                        },
                        {
                            tradeType: 'exchange',
                            data: { orderId: 'orderId5' },
                            account: {
                                descriptor: accountEth.descriptor,
                                symbol: accountEth.symbol,
                                accountType: accountEth.accountType,
                                accountIndex: accountEth.index,
                            },
                        },
                    ],
                    composedTransactionInfo: {
                        composed: {
                            feePerByte: '1',
                        },
                        selectedFee: 'normal',
                    },
                    modalAccountKey: 'modalAccountKey',
                    prefilledFromCryptoId: 'bitcoin' as CryptoId,
                    activeSection: 'sell',
                },
                selectedAccount: {
                    account: accountBtc,
                    status: 'loaded',
                    network: undefined,
                    discovery: undefined,
                    params: undefined,
                },
                accounts: [accountEth, accountBtc],
            },
            suite: {
                settings: {
                    addressDisplayType: 'original',
                    debug: { invityServerEnvironment: undefined },
                },
            },
            device: {
                selectedDevice: {
                    state: {
                        staticSessionId: 'staticSessionId' as StaticSessionId,
                    },
                },
            },
        }) as unknown as TradingRootState & DeviceRootState & AccountsRootState;

    beforeEach(() => {
        state = getState();
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
            const expectedState = getExchangeState() as Record<string, any>;
            expectedState.exchangeInfo.buyCryptoIds = new Set(['bitcoin']);
            expectedState.exchangeInfo.sellCryptoIds = new Set([
                'eos',
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ]);
            expectedState.tradingAccountKey = 'eth-descriptor-eth';

            expect(selectTradingExchange(state)).toEqual(expectedState);
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
                                supportedFiatCurrencies: [] as FiatCurrencyCode[],
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
            expect(selectTradingExchangeInfo(state)).toEqual({
                providerInfos: {},
                buyCryptoIds: new Set(['bitcoin']),
                sellCryptoIds: new Set([
                    'eos',
                    'bitcoin',
                    'ethereum',
                    'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    'base--0x0000000000000000000000000000000000000000',
                    'ethereum--0xWithoutObjectInCoinsInfo',
                ]),
            });
        });

        const stateExchangeWithUndefinedInfo = {
            wallet: {
                tradingNew: {
                    exchange: {},
                },
            },
        } as TradingRootState;

        it('should return undefined', () => {
            expect(selectTradingExchangeInfo(stateExchangeWithUndefinedInfo)).toEqual(undefined);
        });

        it('should be stable', () => {
            expect(selectTradingExchangeInfo(stateExchangeWithUndefinedInfo)).toBe(
                selectTradingExchangeInfo(stateExchangeWithUndefinedInfo),
            );
        });
    });

    describe('selectTradingSellInfo', () => {
        it('should return correct data', () => {
            const stateExchange = {
                wallet: {
                    tradingNew: {
                        sell: {
                            sellInfo: {
                                providerInfos: {},
                                supportedFiatCurrencies: [] as FiatCurrencyCode[],
                                supportedCryptoCurrencies: [] as CryptoId[],
                            },
                        },
                    },
                },
            } as TradingRootState;

            expect(selectTradingSellInfo(stateExchange)).toEqual({
                providerInfos: {},
                supportedFiatCurrencies: new Set(),
                supportedCryptoCurrencies: new Set(),
            });
        });

        const stateSellWithUndefinedInfo = {
            wallet: {
                tradingNew: {
                    sell: {},
                },
            },
        } as TradingRootState;

        it('should return undefined', () => {
            expect(selectTradingSellInfo(stateSellWithUndefinedInfo)).toEqual(undefined);
        });

        it('should be stable', () => {
            expect(selectTradingSellInfo(stateSellWithUndefinedInfo)).toBe(
                selectTradingSellInfo(stateSellWithUndefinedInfo),
            );
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
            tradingNew.exchange.exchangeInfo.buyCryptoIds = new Set(['bitcoin']);
            tradingNew.exchange.exchangeInfo.sellCryptoIds = new Set([
                'eos',
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ]);
            tradingNew.exchange.tradingAccountKey = 'eth-descriptor-eth';

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

    describe('selectTradingSellProviders', () => {
        it('should return correct data', () => {
            expect(selectTradingSellProviders(state)).toEqual(
                state.wallet.tradingNew.sell.sellInfo?.providerInfos,
            );
        });

        it('should be stable', () => {
            expect(selectTradingSellProviders(state)).toBe(selectTradingSellProviders(state));
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

    it('selectTradingSellQuotesRequest should return correct data', () => {
        expect(selectTradingSellQuotesRequest(state)).toBe(
            state.wallet.tradingNew.sell.quotesRequest,
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

    it('selectTradingSellSelectedQuote should return correct data', () => {
        expect(selectTradingSellSelectedQuote(state)).toBe(
            state.wallet.tradingNew.sell.selectedQuote,
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

    it('selectDeviceTradingTradesByTradeType should return only data for relevant tradeType', () => {
        expect(
            selectDeviceTradingTradesByTradeType(state, 'buy').map(t => t.data.orderId),
        ).toStrictEqual(['orderId1', 'orderId2', 'orderId3']);

        expect(
            selectDeviceTradingTradesByTradeType(state, 'exchange').map(t => t.data.orderId),
        ).toStrictEqual(['orderId4', 'orderId5']);
    });

    describe('selectDeviceTradingTradesByTradeTypeOrderedByDate', () => {
        it('should return trades ordered by date in descending order', () => {
            const result = selectDeviceTradingTradesByTradeTypeOrderedByDate(state, 'buy');

            expect(result).toHaveLength(3);
            expect(result[0].data.orderId).toBe('orderId3');
            expect(result[1].data.orderId).toBe('orderId2');
            expect(result[2].data.orderId).toBe('orderId1');
        });

        it('should return empty array for trade type with no trades', () => {
            const result = selectDeviceTradingTradesByTradeTypeOrderedByDate(state, 'sell');

            expect(result).toHaveLength(0);
        });

        it('should be stable', () => {
            const first = selectDeviceTradingTradesByTradeTypeOrderedByDate(state, 'buy');
            const second = selectDeviceTradingTradesByTradeTypeOrderedByDate(state, 'buy');

            expect(first).toBe(second);
        });
    });

    it('selectDeviceHasTradingTradesOfTradeType should return correctly whether there is a trade', () => {
        expect(selectDeviceHasTradingTradesOfTradeType(state, 'buy')).toBe(true);
        expect(selectDeviceHasTradingTradesOfTradeType(state, 'sell')).toBe(false);
    });

    it('selectTradingTradeByOrderId should find trade for correct orderId', () => {
        expect(selectTradingTradeByOrderId(state, 'orderId1')).toBeDefined();
    });

    it('selectTradingTradeByOrderId should return undefined when orderId is not found', () => {
        expect(selectTradingTradeByOrderId(state, 'unknown_order')).toBeUndefined();
    });

    describe('selectTradingCoinInfoByCryptoId', () => {
        it('should return coin data', () => {
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

        it('should not return any data', () => {
            expect(selectTradingCoinInfoByCryptoId(state, undefined)).toBeUndefined();
        });
    });

    describe('selectTradingCoinSymbolByCryptoId', () => {
        it('should return coin symbol', () => {
            expect(selectTradingCoinSymbolByCryptoId(state, 'bitcoin' as CryptoId)).toBe('BTC');
        });

        it('should not return any data', () => {
            expect(selectTradingCoinSymbolByCryptoId(state, undefined)).toBeUndefined();
        });
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

    describe('selectTradingSellSupportedCryptoIds', () => {
        it('should select only coins presented in sellInfo and info', () => {
            expect(selectTradingSellSupportedCryptoIds(state)).toEqual([
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
            ]);
        });

        it('should be stable', () => {
            const first = selectTradingSellSupportedCryptoIds(state);
            const second = selectTradingSellSupportedCryptoIds(state);

            expect(first).toBe(second);
        });

        it('should be empty array when platforms are not set', () => {
            state.wallet.tradingNew.info.platforms = undefined;

            expect(selectTradingSellSupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.tradingNew.info.coins = undefined;

            expect(selectTradingSellSupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when supportedCryptoCurrencies are not set', () => {
            state.wallet.tradingNew.sell.sellInfo = undefined;

            expect(selectTradingSellSupportedCryptoIds(state)).toEqual([]);
        });
    });

    describe('selectTradingExchangeSellCryptoIds', () => {
        it('should select only coins presented in exchangeInfo and info', () => {
            expect(selectTradingExchangeSellCryptoIds(state)).toEqual([
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
            ]);
        });

        it('should be stable', () => {
            const first = selectTradingExchangeSellCryptoIds(state);
            const second = selectTradingExchangeSellCryptoIds(state);

            expect(first).toBe(second);
        });

        it('should be empty array when platforms are not set', () => {
            state.wallet.tradingNew.info.platforms = undefined;

            expect(selectTradingExchangeSellCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.tradingNew.info.coins = undefined;

            expect(selectTradingExchangeSellCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when sellCryptoIds are not set', () => {
            state.wallet.tradingNew.exchange.exchangeInfo = undefined;

            expect(selectTradingExchangeSellCryptoIds(state)).toEqual([]);
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

    describe('selectTradingBuyQuoteByOrderId', () => {
        it('should return undefined when orderId is not provided', () => {
            const result = selectTradingBuyQuoteByOrderId(state, undefined);
            expect(result).toBeUndefined();
        });

        it('should return undefined when quote with orderId is not found', () => {
            const result = selectTradingBuyQuoteByOrderId(state, 'non_existent_id');
            expect(result).toBeUndefined();
        });

        it('should return correct quote', () => {
            const result = selectTradingBuyQuoteByOrderId(state, 'orderId1');
            expect(result?.orderId).toBe('orderId1');
        });
    });

    it('selectTradingExchangeFormStep should return formStep', () => {
        expect(selectTradingExchangeFormStep(state)).toBe('RECEIVING_ADDRESS');
    });

    it('selectTradingSellFormStep should return formStep', () => {
        expect(selectTradingSellFormStep(state)).toBe('BANK_ACCOUNT');
    });

    it('selectTradingModalAccountKey should return stable modalAccountKey', () => {
        expect(selectTradingModalAccountKey(state)).toEqual('modalAccountKey');
    });

    it('selectTradingPrefilledFromCryptoId should return stable prefilledFromCryptoId ', () => {
        expect(selectTradingPrefilledFromCryptoId(state)).toEqual('bitcoin');
    });

    describe('selectTradingActiveSection', () => {
        it('should return stable activeSection ', () => {
            expect(selectTradingActiveSection(state)).toEqual('sell');
        });
    });

    it('selectTradingComposedTransactionInfo should return composed and selectedFee information', () => {
        expect(selectTradingComposedTransactionInfo(state)).toEqual({
            composed: {
                feePerByte: '1',
            },
            selectedFee: 'normal',
        });
    });

    describe('selectTradingAccountAccordingActiveSection', () => {
        it('should return correct account for buy according to tradingAccountKey', () => {
            expect(
                selectTradingAccountAccordingActiveSection(
                    state,
                    'buy',
                    state.wallet.selectedAccount,
                ),
            ).toEqual(
                state.wallet.accounts.find(
                    account => account.key === state.wallet.tradingNew.buy.tradingAccountKey,
                ),
            );
        });

        it('should return correct account for exchange according to tradingAccountKey', () => {
            expect(
                selectTradingAccountAccordingActiveSection(
                    state,
                    'exchange',
                    state.wallet.selectedAccount,
                ),
            ).toEqual(
                state.wallet.accounts.find(
                    account => account.key === state.wallet.tradingNew.exchange.tradingAccountKey,
                ),
            );
        });

        it('should return correct account for sell according to tradingAccountKey', () => {
            expect(
                selectTradingAccountAccordingActiveSection(
                    state,
                    'sell',
                    state.wallet.selectedAccount,
                ),
            ).toEqual(
                state.wallet.accounts.find(
                    account => account.key === state.wallet.tradingNew.sell.tradingAccountKey,
                ),
            );
        });
    });

    describe('selectValidTradingBuyQuotes', () => {
        beforeEach(() => {
            state.wallet.tradingNew.buy.quotes = [
                {
                    fiatStringAmount: '10',
                    fiatCurrency: 'EUR',
                    receiveCurrency: 'bitcoin' as CryptoId,
                    receiveStringAmount: '0.0005',
                    rate: 20000,
                    paymentMethod: 'eps',
                    quoteId: 'quoteId1',
                },
                {
                    fiatStringAmount: '10',
                    fiatCurrency: 'EUR',
                    receiveCurrency: 'bitcoin' as CryptoId,
                    receiveStringAmount: '0.0005',
                    rate: 0,
                    paymentMethod: 'eps',
                    quoteId: 'quoteId2',
                },
                {
                    fiatStringAmount: '10',
                    fiatCurrency: 'EUR',
                    receiveCurrency: 'bitcoin' as CryptoId,
                    receiveStringAmount: '0.0005',
                    paymentMethod: 'eps',
                    quoteId: 'quoteId2',
                },
            ];
        });

        it('should return only quotes with non-zero rate', () => {
            const validQuotes = selectValidTradingBuyQuotes(state);

            expect(validQuotes).toEqual([state.wallet.tradingNew.buy.quotes[0]]);
        });

        it('should be stable', () => {
            expect(selectValidTradingBuyQuotes(state)).toBe(selectValidTradingBuyQuotes(state));
        });
    });

    describe('selectTradingBuyLoadingTimestampAndStatus', () => {
        it.each<[boolean, number]>([
            [true, 0],
            [false, 123456789],
        ])(
            'should return values from tradingNew state, case %#',
            (isLoading, lastLoadedTimestamp) => {
                state.wallet.tradingNew.isLoading = isLoading;
                state.wallet.tradingNew.lastLoadedTimestamp = lastLoadedTimestamp;

                expect(selectTradingBuyLoadingTimestampAndStatus(state)).toEqual(
                    expect.objectContaining({
                        isLoading,
                        lastLoadedTimestamp,
                    }),
                );
            },
        );

        describe('isFullyLoaded', () => {
            it('should be false when trading info is empty', () => {
                state.wallet.tradingNew.info = {
                    paymentMethods: [],
                };

                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be false when trading buyInfo is empty', () => {
                state.wallet.tradingNew.buy.buyInfo = undefined;

                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be false when providers info is empty', () => {
                state.wallet.tradingNew.buy.buyInfo!.providerInfos = {};
                state.wallet.tradingNew.buy.buyInfo!.buyInfo.providers = [];

                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be true otherwise', () => {
                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(true);
            });
        });
    });

    describe('selectTradingProviderByNameAndTradeType', () => {
        it('should return the correct provider for buy trade type', () => {
            const providerName = 'provider1';
            state.wallet.tradingNew.buy.buyInfo = {
                ...state.wallet.tradingNew.buy.buyInfo,
                providerInfos: {
                    [providerName]: { name: providerName },
                },
            } as unknown as BuyInfo;

            const result = selectTradingProviderByNameAndTradeType(state, providerName, 'buy');
            expect(result).toEqual({ name: providerName });
        });

        it('should return the correct provider for exchange trade type', () => {
            const providerName = 'provider2';
            state.wallet.tradingNew.exchange.exchangeInfo = {
                ...state.wallet.tradingNew.exchange.exchangeInfo,
                providerInfos: {
                    [providerName]: { name: providerName },
                },
            } as unknown as ExchangeInfo;

            const result = selectTradingProviderByNameAndTradeType(state, providerName, 'exchange');
            expect(result).toEqual({ name: providerName });
        });

        it('should return the correct provider for sell trade type', () => {
            const providerName = 'provider3';
            state.wallet.tradingNew.sell.sellInfo = {
                ...state.wallet.tradingNew.sell.sellInfo,
                providerInfos: {
                    [providerName]: { name: providerName },
                },
            } as unknown as SellInfo;

            const result = selectTradingProviderByNameAndTradeType(state, providerName, 'sell');
            expect(result).toEqual({ name: providerName });
        });

        it('should return undefined if provider name is not provided', () => {
            const result = selectTradingProviderByNameAndTradeType(state, undefined, 'buy');
            expect(result).toBeUndefined();
        });

        it('should return undefined if provider is not found', () => {
            const result = selectTradingProviderByNameAndTradeType(state, 'nonexistent', 'buy');
            expect(result).toBeUndefined();
        });

        it('should throw an error for an invalid trade type', () => {
            expect(() =>
                selectTradingProviderByNameAndTradeType(state, 'provider1', 'invalid' as any),
            ).toThrow('Unexpected trade type');
        });
    });

    describe('selectTradingTradesForSelectedDevice', () => {
        it('should return trades for the selected device', () => {
            const mockState = {
                wallet: {
                    selectedAccount: {
                        account: { deviceState: 'device1' },
                    },
                    accounts: [
                        { descriptor: 'account1', deviceState: 'device1' },
                        { descriptor: 'account2', deviceState: 'device2' },
                    ],
                    tradingNew: {
                        trades: [
                            { account: { descriptor: 'account1' }, tradeType: 'buy' },
                            { account: { descriptor: 'account2' }, tradeType: 'sell' },
                        ],
                    },
                },
            } as unknown as TradingRootState;

            const result = selectTradingTradesForSelectedDevice(mockState);

            expect(result).toEqual([{ account: { descriptor: 'account1' }, tradeType: 'buy' }]);
        });

        it('should return an empty array if no trades match the selected device', () => {
            const mockState = {
                wallet: {
                    selectedAccount: {
                        account: { deviceState: 'device3' },
                    },
                    accounts: [
                        { descriptor: 'account1', deviceState: 'device1' },
                        { descriptor: 'account2', deviceState: 'device2' },
                    ],
                    tradingNew: {
                        trades: [
                            { account: { descriptor: 'account1' }, tradeType: 'buy' },
                            { account: { descriptor: 'account2' }, tradeType: 'sell' },
                        ],
                    },
                },
            } as unknown as TradingRootState;

            const result = selectTradingTradesForSelectedDevice(mockState);

            expect(result).toEqual([]);
        });

        it('should return an empty array if there are no trades', () => {
            const mockState = {
                wallet: {
                    selectedAccount: {
                        account: { deviceState: 'device1' },
                    },
                    accounts: [
                        { descriptor: 'account1', deviceState: 'device1' },
                        { descriptor: 'account2', deviceState: 'device2' },
                    ],
                    tradingNew: {
                        trades: [],
                    },
                },
            } as unknown as TradingRootState;

            const result = selectTradingTradesForSelectedDevice(mockState);

            expect(result).toEqual([]);
        });
    });

    describe('selectTradingSupportedSymbols', () => {
        const supportedSymbols = new Set([
            'bitcoin',
            'ethereum',
            'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            'base--0x0000000000000000000000000000000000000000',
        ]);

        it('should return supported symbols for buy', () => {
            expect(selectTradingSupportedSymbols(state, 'buy')).toEqual(supportedSymbols);
        });

        it('should return supported symbols for sell', () => {
            expect(selectTradingSupportedSymbols(state, 'sell')).toEqual(supportedSymbols);
        });

        it('should return supported symbols for exchange', () => {
            expect(selectTradingSupportedSymbols(state, 'exchange')).toEqual(supportedSymbols);
        });
    });
});
