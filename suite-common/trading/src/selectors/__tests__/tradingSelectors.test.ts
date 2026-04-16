import {
    type BuyTrade,
    type Coins,
    type CryptoId,
    type FiatCurrenciesProps,
    type FiatCurrencyCode,
    type Platforms,
    type SellFiatTrade,
} from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import coins from '../../__fixtures__/coins.json';
import { invityAPIFixtures } from '../../__fixtures__/invityAPI';
import platforms from '../../__fixtures__/platforms.json';
import { accountBtc, accountEth } from '../../__fixtures__/utils';
import { getProviderMetadataFixture } from '../../reducers/__fixtures__/providerMetadata';
import { type BuyInfo, type TradingBuyState } from '../../reducers/buyReducer';
import { type ExchangeInfo, exchangeInitialState } from '../../reducers/exchangeReducer';
import { type SellInfo, sellInitialState } from '../../reducers/sellReducer';
import { type TradingRootState, initialState } from '../../reducers/tradingCommonReducer';
import type { TradingPaymentMethodListProps, TradingType } from '../../types';
import {
    type TradingRootStateWithDeviceAndAccounts,
    bestBuyQuotePerPaymentMethodProjection,
    bestSellQuotePerPaymentMethodProjection,
    selectDeviceHasTradingTrades,
    selectDeviceTradingTradesOrderedByDate,
    selectGroupedTradingExchangeQuotes,
    selectTrading,
    selectTradingAccountAccordingActiveSection,
    selectTradingAccountKeyByTradeType,
    selectTradingActiveSection,
    selectTradingBuy,
    selectTradingBuyAmountLimits,
    selectTradingBuyBestQuote,
    selectTradingBuyInfo,
    selectTradingBuyIsFromRedirect,
    selectTradingBuyIsLoading,
    selectTradingBuyLastErrorMessage,
    selectTradingBuyLoadingTimestampAndStatus,
    selectTradingBuyPreselectedQuote,
    selectTradingBuyProviders,
    selectTradingBuyQuoteByOrderId,
    selectTradingBuyQuotes,
    selectTradingBuyQuotesByPaymentMethod,
    selectTradingBuyQuotesRequest,
    selectTradingBuySelectedQuote,
    selectTradingBuySupportedCryptoIds,
    selectTradingCoinInfoByCryptoId,
    selectTradingCoinSymbolByCryptoId,
    selectTradingComposedTransactionInfo,
    selectTradingExchange,
    selectTradingExchangeActiveQuote,
    selectTradingExchangeAmountLimits,
    selectTradingExchangeBuyCryptoIds,
    selectTradingExchangeCexQuotes,
    selectTradingExchangeDexQuoteApprovalPrefetchLoading,
    selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId,
    selectTradingExchangeDexQuotes,
    selectTradingExchangeFormStep,
    selectTradingExchangeInfo,
    selectTradingExchangeIsFromRedirect,
    selectTradingExchangeIsLoading,
    selectTradingExchangeLastErrorMessage,
    selectTradingExchangeLoadingTimestampAndStatus,
    selectTradingExchangeProviders,
    selectTradingExchangeQuotes,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeSellCryptoIds,
    selectTradingIsSlip24Allowed,
    selectTradingLastErrorMessageByTradeType,
    selectTradingModalAccountKey,
    selectTradingNativeCoinSymbolByCryptoId,
    selectTradingPaymentMethods,
    selectTradingPlatformByCryptoId,
    selectTradingPrefilledFromAccount,
    selectTradingProviderByNameAndTradeType,
    selectTradingProviderMetadata,
    selectTradingSellAccountKey,
    selectTradingSellAmountLimits,
    selectTradingSellBestQuote,
    selectTradingSellFormStep,
    selectTradingSellInfo,
    selectTradingSellIsFromRedirect,
    selectTradingSellLastErrorMessage,
    selectTradingSellLoadingTimestampAndStatus,
    selectTradingSellPreselectedQuote,
    selectTradingSellProviders,
    selectTradingSellQuotes,
    selectTradingSellQuotesByPaymentMethod,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    selectTradingSellSellCryptoIds,
    selectTradingSellSupportedCryptoIds,
    selectTradingSupportedSymbols,
    selectTradingSymbolAndContractAddressByCryptoId,
    selectTradingTradeByOrderId,
    selectTradingTrades,
    selectTradingTradesForSelectedDevice,
    selectValidTradingBuyQuotes,
    selectValidTradingSellQuotes,
} from '../tradingSelectors';

describe('tradingSelectors', () => {
    let state: TradingRootStateWithDeviceAndAccounts;

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
            providerInfos: { test: invityAPIFixtures.sellList[0] },
            supportedFiatCurrencies: ['usd', 'eur', 'czk'],
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
        quotes: [
            {
                amountInCrypto: false,
                country: 'CZ',
                cryptoCurrency: 'ethereum',
                cryptoStringAmount: '0.02539600',
                exchange: 'banxa-sell',
                fiatCurrency: 'USD',
                fiatStringAmount: '100.00',
                maxCrypto: 5.83997533,
                maxFiat: 25000,
                minCrypto: 0.01167995,
                minFiat: 50,
                orderId: '05a031d0-2c7a-4e7f-9001-67cec1253fae',
                partnerData2: '6107',
                paymentId: '7b9d5f99-5612-4fc3-98ab-ace3dad87e28',
                paymentMethod: 'bankTransfer',
                paymentMethodName: 'Bank Transfer',
                rate: 3937.6279729091198,
                tags: ['wantFiat'],
            },
            {
                amountInCrypto: false,
                country: 'CZ',
                cryptoCurrency: 'ethereum',
                cryptoStringAmount: '0.0233',
                exchange: 'moonpay-sell',
                fiatCurrency: 'USD',
                fiatStringAmount: '90.17',
                maxCrypto: 30000,
                maxFiat: 30000,
                minCrypto: 0.0011,
                minFiat: 20,
                orderId: 'b7bafcc9-700b-4a42-a0b1-48aabda25545',
                paymentId: '2dc5bf90-ce56-4305-8583-06418c5248c5',
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
                rate: 3869.9570815450643,
                tags: ['wantFiat'],
            },
        ] as SellFiatTrade[],
    });

    const getExchangeState = () => ({
        ...initialState.exchange,
        exchangeInfo: {
            providerInfos: { test: invityAPIFixtures.buyList[0] },
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
                trading: {
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
                            selectedAccountKey: accountEth.key,
                        },
                        {
                            tradeType: 'buy',
                            data: { orderId: 'orderId2' },
                            date: '2024-03-02T10:00:00Z',
                            selectedAccountKey: accountEth.key,
                        },
                        {
                            tradeType: 'buy',
                            data: { orderId: 'orderId3' },
                            date: '2024-03-03T10:00:00Z',
                            selectedAccountKey: accountEth.key,
                        },
                        {
                            tradeType: 'exchange',
                            data: { orderId: 'orderId4' },
                            date: '2024-03-04T10:00:00Z',
                            sendAccountKey: accountEth.key,
                            receiveAccountKey: accountBtc.key,
                        },
                        {
                            tradeType: 'exchange',
                            data: { orderId: 'orderId5' },
                            sendAccountKey: accountEth.key,
                            receiveAccountKey: accountBtc.key,
                        },
                    ],
                    composedTransactionInfo: {
                        composed: {
                            feePerByte: '1',
                        },
                        selectedFee: 'normal',
                    },
                    modalAccountKey: 'modalAccountKey',
                    prefilledFromAccount: {
                        cryptoId: 'bitcoin' as CryptoId,
                        descriptor: 'btc-desc',
                    },
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
        }) as unknown as TradingRootStateWithDeviceAndAccounts;

    beforeEach(() => {
        state = getState();
    });

    describe(selectTradingBuy.name, () => {
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

    describe(selectTradingExchange.name, () => {
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

    describe(selectTradingBuyInfo.name, () => {
        it('should return correct data', () => {
            const stateBuy = {
                wallet: {
                    trading: {
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
                trading: {
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

    describe(selectTradingExchangeInfo.name, () => {
        it('should return correct data', () => {
            expect(selectTradingExchangeInfo(state)).toEqual({
                providerInfos: { test: expect.objectContaining({ name: 'test' }) },
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
                trading: {
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

    describe(selectTradingSellInfo.name, () => {
        it('should return correct data', () => {
            const stateExchange = {
                wallet: {
                    trading: {
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
                trading: {
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

    describe(selectTrading.name, () => {
        it('should return correct data', () => {
            const {
                wallet: { trading },
            } = getState() as Record<string, any>;

            trading.buy.buyInfo.supportedCryptoCurrencies = new Set([
                'eos',
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ]);
            trading.buy.buyInfo.supportedFiatCurrencies = new Set(['usd', 'eur', 'czk']);
            trading.buy.buyInfo.buyInfo.defaultAmountsOfFiatCurrencies = new Map([
                ['usd', '150'],
                ['eur', '100'],
            ]);
            trading.exchange.exchangeInfo.buyCryptoIds = new Set(['bitcoin']);
            trading.exchange.exchangeInfo.sellCryptoIds = new Set([
                'eos',
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
                'ethereum--0xWithoutObjectInCoinsInfo',
            ]);
            trading.exchange.tradingAccountKey = 'eth-descriptor-eth';

            expect(selectTrading(state)).toEqual(trading);
        });

        it('should be stable', () => {
            expect(selectTrading(state)).toBe(selectTrading(state));
        });
    });

    describe(selectTradingBuyProviders.name, () => {
        it('should return correct data', () => {
            expect(selectTradingBuyProviders(state)).toEqual(
                state.wallet.trading.buy.buyInfo?.providerInfos,
            );
        });

        it('should be stable', () => {
            expect(selectTradingBuyProviders(state)).toBe(selectTradingBuyProviders(state));
        });
    });

    describe(selectTradingExchangeProviders.name, () => {
        it('should return correct data', () => {
            expect(selectTradingExchangeProviders(state)).toEqual(
                state.wallet.trading.exchange.exchangeInfo?.providerInfos,
            );
        });

        it('should be stable', () => {
            expect(selectTradingExchangeProviders(state)).toBe(
                selectTradingExchangeProviders(state),
            );
        });
    });

    describe(selectTradingSellProviders.name, () => {
        it('should return correct data', () => {
            expect(selectTradingSellProviders(state)).toEqual(
                state.wallet.trading.sell.sellInfo?.providerInfos,
            );
        });

        it('should be stable', () => {
            expect(selectTradingSellProviders(state)).toBe(selectTradingSellProviders(state));
        });
    });

    it('selectTradingBuyQuotesRequest should return correct data', () => {
        expect(selectTradingBuyQuotesRequest(state)).toBe(state.wallet.trading.buy.quotesRequest);
    });

    it('selectTradingBuyIsFromRedirect should return correct data', () => {
        state.wallet.trading.buy.isFromRedirect = true;

        expect(selectTradingBuyIsFromRedirect(state)).toBe(true);
    });

    it('selectTradingExchangeQuotesRequest should return correct data', () => {
        expect(selectTradingExchangeQuotesRequest(state)).toBe(
            state.wallet.trading.exchange.quotesRequest,
        );
    });

    it('selectTradingExchangeIsFromRedirect should return correct data', () => {
        state.wallet.trading.exchange.isFromRedirect = true;

        expect(selectTradingExchangeIsFromRedirect(state)).toBe(true);
    });

    it('selectTradingExchangeQuotes should return correct data', () => {
        expect(selectTradingExchangeQuotes(state)).toBe(state.wallet.trading.exchange.quotes);
    });

    it('selectTradingExchangeDexQuoteApprovalPrefetchLoading should return correct data', () => {
        expect(selectTradingExchangeDexQuoteApprovalPrefetchLoading(state)).toBe(
            !!state.wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        );
    });

    it('selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId should return correct data', () => {
        state.wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId = 'quoteId1';

        expect(
            selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId(state, 'quoteId1'),
        ).toBe(true);
        expect(
            selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId(state, 'quoteId2'),
        ).toBe(false);
        expect(
            selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId(state, undefined),
        ).toBe(false);
    });

    it('selectTradingSellQuotesRequest should return correct data', () => {
        expect(selectTradingSellQuotesRequest(state)).toBe(state.wallet.trading.sell.quotesRequest);
    });

    it('selectTradingSellIsFromRedirect should return correct data', () => {
        state.wallet.trading.sell.isFromRedirect = true;

        expect(selectTradingSellIsFromRedirect(state)).toBe(true);
    });

    it('selectTradingBuySelectedQuote should return correct data', () => {
        expect(selectTradingBuySelectedQuote(state)).toBe(state.wallet.trading.buy.selectedQuote);
    });

    it('selectTradingBuyPreselectedQuote should return correct data', () => {
        state.wallet.trading.buy.preselectedQuote = state.wallet.trading.buy.quotes[0];

        expect(selectTradingBuyPreselectedQuote(state)).toBe(
            state.wallet.trading.buy.preselectedQuote,
        );
    });

    it('selectTradingExchangeSelectedQuote should return correct data', () => {
        expect(selectTradingExchangeSelectedQuote(state)).toBe(
            state.wallet.trading.exchange.selectedQuote,
        );
    });

    describe('selectTradingExchangeActiveQuote', () => {
        it('should return selectedQuote when it is defined', () => {
            state.wallet.trading.exchange.selectedQuote = invityAPIFixtures.exchangeTrade;
            state.wallet.trading.exchange.preselectedQuote = {
                ...invityAPIFixtures.exchangeTrade,
                exchange: 'preselected-exchange',
            };

            expect(selectTradingExchangeActiveQuote(state)).toBe(
                state.wallet.trading.exchange.selectedQuote,
            );
        });

        it('should fall back to preselectedQuote when selectedQuote is undefined', () => {
            state.wallet.trading.exchange.selectedQuote = undefined;
            state.wallet.trading.exchange.preselectedQuote = invityAPIFixtures.exchangeTrade;

            expect(selectTradingExchangeActiveQuote(state)).toBe(
                state.wallet.trading.exchange.preselectedQuote,
            );
        });

        it('should return undefined when both quotes are undefined', () => {
            expect(selectTradingExchangeActiveQuote(state)).toBeUndefined();
        });
    });

    it('selectTradingSellSelectedQuote should return correct data', () => {
        expect(selectTradingSellSelectedQuote(state)).toBe(state.wallet.trading.sell.selectedQuote);
    });

    it('selectTradingSellPreselectedQuote should return correct data', () => {
        state.wallet.trading.sell.preselectedQuote = state.wallet.trading.sell.quotes[0];

        expect(selectTradingSellPreselectedQuote(state)).toBe(
            state.wallet.trading.sell.preselectedQuote,
        );
    });

    it('selectTradingPaymentMethods should return correct data', () => {
        expect(selectTradingPaymentMethods(state)).toBe(state.wallet.trading.info.paymentMethods);
    });

    it('selectTradingTrades should return correct data', () => {
        expect(selectTradingTrades(state)).toBe(state.wallet.trading.trades);
    });

    describe(selectDeviceTradingTradesOrderedByDate.name, () => {
        it('should return trades ordered by date in descending order', () => {
            const result = selectDeviceTradingTradesOrderedByDate(state);

            expect(result).toHaveLength(5);
            expect(result[0]?.data.orderId).toBe('orderId4');
            expect(result[1]?.data.orderId).toBe('orderId3');
            expect(result[2]?.data.orderId).toBe('orderId2');
            expect(result[3]?.data.orderId).toBe('orderId1');
            expect(result[4]?.data.orderId).toBe('orderId5');
        });

        it('should be stable', () => {
            const first = selectDeviceTradingTradesOrderedByDate(state);
            const second = selectDeviceTradingTradesOrderedByDate(state);

            expect(first).toBe(second);
        });
    });

    it('selectDeviceHasTradingTradesOfTradeType should return correctly whether there is a trade', () => {
        expect(selectDeviceHasTradingTrades(state)).toBe(true);
    });

    it('selectTradingTradeByOrderId should find trade for correct orderId', () => {
        expect(selectTradingTradeByOrderId(state, 'orderId1')).toBeDefined();
    });

    it('selectTradingTradeByOrderId should return undefined when orderId is not found', () => {
        expect(selectTradingTradeByOrderId(state, 'unknown_order')).toBeUndefined();
    });

    describe(selectTradingCoinInfoByCryptoId.name, () => {
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

    describe(selectTradingCoinSymbolByCryptoId.name, () => {
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

    describe(selectTradingSymbolAndContractAddressByCryptoId.name, () => {
        it.each([
            ['bitcoin', { coinSymbol: 'BTC', contractAddress: undefined }],
            [
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                {
                    coinSymbol: 'USDC',
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

    describe(selectTradingBuySupportedCryptoIds.name, () => {
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
            state.wallet.trading.info.platforms = undefined;

            expect(selectTradingBuySupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectTradingBuySupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when supportedCryptoCurrencies are not set', () => {
            state.wallet.trading.buy.buyInfo = undefined;

            expect(selectTradingBuySupportedCryptoIds(state)).toEqual([]);
        });
    });

    describe(selectTradingSellSupportedCryptoIds.name, () => {
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
            state.wallet.trading.info.platforms = undefined;

            expect(selectTradingSellSupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectTradingSellSupportedCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when supportedCryptoCurrencies are not set', () => {
            state.wallet.trading.sell.sellInfo = undefined;

            expect(selectTradingSellSupportedCryptoIds(state)).toEqual([]);
        });
    });

    describe(selectTradingSellSellCryptoIds.name, () => {
        it('should select only coins presented in sellInfo and info', () => {
            expect(selectTradingSellSellCryptoIds(state)).toEqual([
                'bitcoin',
                'ethereum',
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                'base--0x0000000000000000000000000000000000000000',
            ]);
        });

        it('should be stable', () => {
            const first = selectTradingSellSellCryptoIds(state);
            const second = selectTradingSellSellCryptoIds(state);

            expect(first).toBe(second);
        });

        it('should be empty array when platforms are not set', () => {
            state.wallet.trading.info.platforms = undefined;

            expect(selectTradingSellSellCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectTradingSellSellCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when supportedCryptoCurrencies are not set', () => {
            state.wallet.trading.sell.sellInfo = undefined;

            expect(selectTradingSellSellCryptoIds(state)).toEqual([]);
        });
    });

    describe(selectTradingExchangeSellCryptoIds.name, () => {
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
            state.wallet.trading.info.platforms = undefined;

            expect(selectTradingExchangeSellCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectTradingExchangeSellCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when sellCryptoIds are not set', () => {
            state.wallet.trading.exchange.exchangeInfo = undefined;

            expect(selectTradingExchangeSellCryptoIds(state)).toEqual([]);
        });
    });

    describe(selectTradingExchangeBuyCryptoIds.name, () => {
        it('should select only coins presented in exchangeInfo and info', () => {
            expect(selectTradingExchangeBuyCryptoIds(state)).toEqual(['bitcoin']);
        });

        it('should be stable', () => {
            const first = selectTradingExchangeBuyCryptoIds(state);
            const second = selectTradingExchangeBuyCryptoIds(state);

            expect(first).toBe(second);
        });

        it('should be empty array when platforms are not set', () => {
            state.wallet.trading.info.platforms = undefined;

            expect(selectTradingExchangeBuyCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when coins are not set', () => {
            state.wallet.trading.info.coins = undefined;

            expect(selectTradingExchangeBuyCryptoIds(state)).toEqual([]);
        });

        it('should be empty array when buyCryptoIds are not set', () => {
            state.wallet.trading.exchange.exchangeInfo = undefined;

            expect(selectTradingExchangeBuyCryptoIds(state)).toEqual([]);
        });
    });

    describe(selectTradingBuyIsLoading.name, () => {
        it('should be false when trading is not loading', () => {
            expect(selectTradingBuyIsLoading(state)).toBe(false);
        });

        it('should be true when trading is loading', () => {
            state.wallet.trading.buy.isLoading = true;

            expect(selectTradingBuyIsLoading(state)).toBe(true);
        });
    });

    it('selectTradingBuyAmountLimits should return correct data', () => {
        state.wallet.trading.buy.amountLimits = {
            currency: 'BTC',
            minFiat: '20',
            maxFiat: '2000',
        };

        expect(selectTradingBuyAmountLimits(state)).toEqual(state.wallet.trading.buy.amountLimits);
    });

    describe(selectTradingBuyQuotes.name, () => {
        it('should return quotes', () => {
            expect(selectTradingBuyQuotes(state)).toBe(state.wallet.trading.buy.quotes);
        });
    });

    describe(selectTradingBuyQuotesByPaymentMethod.name, () => {
        it('should filter quotes by payment method and ignore quote errors', () => {
            state.wallet.trading.buy.quotes = [
                {
                    ...state.wallet.trading.buy.quotes[0],
                    orderId: 'orderId-buy-fixed-1',
                    paymentMethod: 'eps',
                },
                {
                    ...state.wallet.trading.buy.quotes[1],
                    orderId: 'orderId-buy-fixed-2',
                    paymentMethod: 'eps',
                    error: 'Quote unavailable',
                },
                {
                    ...state.wallet.trading.buy.quotes[2],
                    orderId: 'orderId-buy-fixed-3',
                    paymentMethod: 'creditCard',
                },
            ];

            expect(selectTradingBuyQuotesByPaymentMethod(state, 'eps')).toEqual({
                fixed: [state.wallet.trading.buy.quotes[0]],
            });
        });

        it('should be stable', () => {
            expect(selectTradingBuyQuotesByPaymentMethod(state, 'eps')).toBe(
                selectTradingBuyQuotesByPaymentMethod(state, 'eps'),
            );
        });
    });

    describe(selectTradingBuyBestQuote.name, () => {
        it('should return the best rated buy quote', () => {
            expect(selectTradingBuyBestQuote(state)?.orderId).toBe('orderId3');
        });

        it('should return undefined when there are no valid quotes', () => {
            state.wallet.trading.buy.quotes = [];

            expect(selectTradingBuyBestQuote(state)).toBeUndefined();
        });
    });

    describe('bestBuyQuotePerPaymentMethodProjection', () => {
        it('should return the first valid quote for each payment method sorted by rate', () => {
            const quotes = state.wallet.trading.buy.quotes.map(quote => ({
                ...quote,
                paymentMethodName: quote.paymentMethod,
            }));

            expect(bestBuyQuotePerPaymentMethodProjection(quotes)).toEqual([
                expect.objectContaining({ orderId: 'orderId3' }),
                expect.objectContaining({ orderId: 'orderId1' }),
            ]);
        });
    });

    describe(selectTradingBuyQuoteByOrderId.name, () => {
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

    describe(selectTradingExchangeIsLoading.name, () => {
        it('should be false when trading is not loading', () => {
            expect(selectTradingExchangeIsLoading(state)).toBe(false);
        });

        it('should be true when trading is loading', () => {
            state.wallet.trading.exchange.isLoading = true;

            expect(selectTradingExchangeIsLoading(state)).toBe(true);
        });
    });

    it('selectTradingExchangeAmountLimits should return correct data', () => {
        state.wallet.trading.exchange.amountLimits = {
            currency: 'BTC',
            minCrypto: '0.001',
            maxCrypto: '10',
        };

        expect(selectTradingExchangeAmountLimits(state)).toEqual(
            state.wallet.trading.exchange.amountLimits,
        );
    });

    describe(selectGroupedTradingExchangeQuotes.name, () => {
        beforeEach(() => {
            state.wallet.trading.exchange.exchangeInfo = {
                providerInfos: {
                    'fixed-provider': { isFixedRate: true },
                    'float-provider': { isFixedRate: false },
                },
                buyCryptoIds: ['bitcoin'] as CryptoId[],
                sellCryptoIds: ['ethereum'] as CryptoId[],
            } as unknown as ExchangeInfo;
            state.wallet.trading.exchange.quotes = [
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'fixed-quote',
                    exchange: 'fixed-provider',
                    isDex: false,
                },
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'float-quote',
                    exchange: 'float-provider',
                    isDex: false,
                },
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'dex-quote',
                    exchange: 'dex-provider',
                    isDex: true,
                },
            ];
        });

        it('should group exchange quotes into fixed, float, and dex buckets', () => {
            expect(selectGroupedTradingExchangeQuotes(state)).toEqual({
                fixed: [expect.objectContaining({ quoteId: 'fixed-quote' })],
                float: [expect.objectContaining({ quoteId: 'float-quote' })],
                dex: [expect.objectContaining({ quoteId: 'dex-quote' })],
            });
        });

        it('should be stable', () => {
            expect(selectGroupedTradingExchangeQuotes(state)).toBe(
                selectGroupedTradingExchangeQuotes(state),
            );
        });
    });

    describe(selectTradingExchangeDexQuotes.name, () => {
        it('should return dex exchange quotes only', () => {
            state.wallet.trading.exchange.exchangeInfo = {
                providerInfos: {},
                buyCryptoIds: ['bitcoin'] as CryptoId[],
                sellCryptoIds: ['ethereum'] as CryptoId[],
            } as unknown as ExchangeInfo;
            state.wallet.trading.exchange.quotes = [
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'cex-quote',
                    isDex: false,
                },
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'dex-quote',
                    isDex: true,
                },
            ];

            expect(selectTradingExchangeDexQuotes(state)).toEqual([
                expect.objectContaining({ quoteId: 'dex-quote' }),
            ]);
        });
    });

    describe(selectTradingExchangeCexQuotes.name, () => {
        it('should return non-dex exchange quotes only', () => {
            state.wallet.trading.exchange.exchangeInfo = {
                providerInfos: {
                    'fixed-provider': { isFixedRate: true },
                    'float-provider': { isFixedRate: false },
                },
                buyCryptoIds: ['bitcoin'] as CryptoId[],
                sellCryptoIds: ['ethereum'] as CryptoId[],
            } as unknown as ExchangeInfo;
            state.wallet.trading.exchange.quotes = [
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'fixed-quote',
                    exchange: 'fixed-provider',
                    isDex: false,
                },
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'float-quote',
                    exchange: 'float-provider',
                    isDex: false,
                },
                {
                    ...invityAPIFixtures.exchangeTrade,
                    quoteId: 'dex-quote',
                    isDex: true,
                },
            ];

            expect(selectTradingExchangeCexQuotes(state)).toEqual([
                expect.objectContaining({ quoteId: 'fixed-quote' }),
                expect.objectContaining({ quoteId: 'float-quote' }),
            ]);
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
    it('selectTradingSellAccountKey should return undefined when tradingAccountKey is not set', () => {
        state.wallet.trading.sell.tradingAccountKey = undefined;

        expect(selectTradingSellAccountKey(state)).toBeUndefined();
    });

    it('selectTradingSellAccountKey should return the correct account key when set', () => {
        const testAccountKey: AccountKey = 'test-account-key-123' as AccountKey; // Todo: create properly via `createAccountKey()`

        (state as TradingRootState).wallet.trading.sell.tradingAccountKey = testAccountKey;

        expect(selectTradingSellAccountKey(state)).toBe(testAccountKey);
    });

    it('selectTradingSellAccountKey should be stable', () => {
        expect(selectTradingSellAccountKey(state)).toBe(selectTradingSellAccountKey(state));
    });

    it('selectTradingPrefilledFromAccount should return stable prefilledFromAccount ', () => {
        expect(selectTradingPrefilledFromAccount(state)).toEqual({
            cryptoId: 'bitcoin',
            descriptor: 'btc-desc',
        });
    });

    describe(selectTradingActiveSection.name, () => {
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

    describe(selectTradingAccountAccordingActiveSection.name, () => {
        it('should return correct account for buy according to tradingAccountKey', () => {
            expect(
                selectTradingAccountAccordingActiveSection(
                    state,
                    'buy',
                    state.wallet.selectedAccount,
                ),
            ).toEqual(
                state.wallet.accounts.find(
                    account => account.key === state.wallet.trading.buy.tradingAccountKey,
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
                    account => account.key === state.wallet.trading.exchange.tradingAccountKey,
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
                    account => account.key === state.wallet.trading.sell.tradingAccountKey,
                ),
            );
        });
    });

    describe(selectValidTradingBuyQuotes.name, () => {
        beforeEach(() => {
            state.wallet.trading.buy.quotes = [
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

            expect(validQuotes).toEqual([state.wallet.trading.buy.quotes[0]]);
        });

        it('should be stable', () => {
            expect(selectValidTradingBuyQuotes(state)).toBe(selectValidTradingBuyQuotes(state));
        });
    });

    describe(selectValidTradingSellQuotes.name, () => {
        beforeEach(() => {
            const quoteDraft = state.wallet.trading.sell.quotes[0];

            state.wallet.trading.sell.quotes = [
                {
                    ...quoteDraft,
                    rate: 20000,
                    orderId: 'orderId1',
                },
                {
                    ...quoteDraft,
                    rate: 0,
                    orderId: 'orderId2',
                },
                {
                    ...quoteDraft,
                    rate: undefined,
                    orderId: 'orderId3',
                },
            ];
        });

        it('should return only quotes with non-zero rate', () => {
            const validQuotes = selectValidTradingSellQuotes(state);

            expect(validQuotes).toEqual([state.wallet.trading.sell.quotes[0]]);
        });

        it('should be stable', () => {
            expect(selectValidTradingSellQuotes(state)).toBe(selectValidTradingSellQuotes(state));
        });
    });

    it('selectTradingSellAmountLimits should return correct data', () => {
        state.wallet.trading.sell.amountLimits = {
            currency: 'ETH',
            minFiat: '20',
            maxFiat: '2000',
        };

        expect(selectTradingSellAmountLimits(state)).toEqual(
            state.wallet.trading.sell.amountLimits,
        );
    });

    describe(selectTradingSellQuotesByPaymentMethod.name, () => {
        it('should filter quotes by payment method and ignore quote errors', () => {
            state.wallet.trading.sell.quotes = [
                {
                    ...state.wallet.trading.sell.quotes[0],
                    orderId: 'orderId-sell-fixed-1',
                    paymentMethod: 'creditCard',
                },
                {
                    ...state.wallet.trading.sell.quotes[1],
                    orderId: 'orderId-sell-fixed-2',
                    paymentMethod: 'creditCard',
                    error: 'Quote unavailable',
                },
                {
                    ...state.wallet.trading.sell.quotes[0],
                    orderId: 'orderId-sell-fixed-3',
                    paymentMethod: 'bankTransfer',
                },
            ];

            expect(selectTradingSellQuotesByPaymentMethod(state, 'creditCard')).toEqual({
                fixed: [state.wallet.trading.sell.quotes[0]],
            });
        });

        it('should be stable', () => {
            expect(selectTradingSellQuotesByPaymentMethod(state, 'creditCard')).toBe(
                selectTradingSellQuotesByPaymentMethod(state, 'creditCard'),
            );
        });
    });

    describe(selectTradingSellBestQuote.name, () => {
        it('should return the best rated sell quote', () => {
            expect(selectTradingSellBestQuote(state)?.orderId).toBe(
                '05a031d0-2c7a-4e7f-9001-67cec1253fae',
            );
        });

        it('should return undefined when there are no valid quotes', () => {
            state.wallet.trading.sell.quotes = [];

            expect(selectTradingSellBestQuote(state)).toBeUndefined();
        });
    });

    describe('bestSellQuotePerPaymentMethodProjection', () => {
        it('should return the first valid quote for each payment method sorted by rate', () => {
            expect(
                bestSellQuotePerPaymentMethodProjection(state.wallet.trading.sell.quotes),
            ).toEqual([
                expect.objectContaining({ paymentMethod: 'bankTransfer' }),
                expect.objectContaining({ paymentMethod: 'creditCard' }),
            ]);
        });
    });

    describe(selectTradingBuyLoadingTimestampAndStatus.name, () => {
        it.each<[boolean, number]>([
            [true, 0],
            [false, 123456789],
        ])('should return values from trading state, case %#', (isLoading, lastLoadedTimestamp) => {
            state.wallet.trading.isLoading = isLoading;
            state.wallet.trading.lastLoadedTimestamp = lastLoadedTimestamp;

            expect(selectTradingBuyLoadingTimestampAndStatus(state)).toEqual(
                expect.objectContaining({
                    isLoading,
                    lastLoadedTimestamp,
                }),
            );
        });

        describe('isFullyLoaded', () => {
            it('should be false when trading info is empty', () => {
                state.wallet.trading.info = {
                    paymentMethods: [],
                };

                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be false when trading buyInfo is empty', () => {
                state.wallet.trading.buy.buyInfo = undefined;

                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be false when providers info is empty', () => {
                state.wallet.trading.buy.buyInfo!.providerInfos = {};
                state.wallet.trading.buy.buyInfo!.buyInfo.providers = [];

                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be true otherwise', () => {
                expect(selectTradingBuyLoadingTimestampAndStatus(state).isFullyLoaded).toBe(true);
            });
        });
    });

    describe(selectTradingExchangeLoadingTimestampAndStatus.name, () => {
        it.each<[boolean, number]>([
            [true, 0],
            [false, 123456789],
        ])('should return values from trading state, case %#', (isLoading, lastLoadedTimestamp) => {
            state.wallet.trading.isLoading = isLoading;
            state.wallet.trading.lastLoadedTimestamp = lastLoadedTimestamp;

            expect(selectTradingExchangeLoadingTimestampAndStatus(state)).toEqual(
                expect.objectContaining({
                    isLoading,
                    lastLoadedTimestamp,
                }),
            );
        });

        describe('isFullyLoaded', () => {
            it('should be false when trading info is empty', () => {
                state.wallet.trading.exchange = {
                    ...initialState.exchange,
                    exchangeInfo: {
                        providerInfos: {},
                        buyCryptoIds: [],
                        sellCryptoIds: [],
                    },
                };

                expect(selectTradingExchangeLoadingTimestampAndStatus(state).isFullyLoaded).toBe(
                    false,
                );
            });

            it('should be false when trading exchangeInfo is empty', () => {
                state.wallet.trading.exchange.exchangeInfo = undefined;

                expect(selectTradingExchangeLoadingTimestampAndStatus(state).isFullyLoaded).toBe(
                    false,
                );
            });

            it('should be false when providers info is empty', () => {
                state.wallet.trading.exchange.exchangeInfo!.providerInfos = {};

                expect(selectTradingExchangeLoadingTimestampAndStatus(state).isFullyLoaded).toBe(
                    false,
                );
            });

            it('should be true otherwise', () => {
                expect(selectTradingExchangeLoadingTimestampAndStatus(state).isFullyLoaded).toBe(
                    true,
                );
            });
        });
    });

    describe(selectTradingSellLoadingTimestampAndStatus.name, () => {
        it.each<[boolean, number]>([
            [true, 0],
            [false, 123456789],
        ])('should return values from trading state, case %#', (isLoading, lastLoadedTimestamp) => {
            state.wallet.trading.isLoading = isLoading;
            state.wallet.trading.lastLoadedTimestamp = lastLoadedTimestamp;

            expect(selectTradingSellLoadingTimestampAndStatus(state)).toEqual(
                expect.objectContaining({
                    isLoading,
                    lastLoadedTimestamp,
                }),
            );
        });

        describe('isFullyLoaded', () => {
            it('should be false when trading info is empty', () => {
                state.wallet.trading.info = {
                    paymentMethods: [],
                };

                expect(selectTradingSellLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be false when trading sellInfo is empty', () => {
                state.wallet.trading.sell.sellInfo = undefined;

                expect(selectTradingSellLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be false when providers info is empty', () => {
                state.wallet.trading.sell.sellInfo!.providerInfos = {};

                expect(selectTradingSellLoadingTimestampAndStatus(state).isFullyLoaded).toBe(false);
            });

            it('should be true otherwise', () => {
                expect(selectTradingSellLoadingTimestampAndStatus(state).isFullyLoaded).toBe(true);
            });
        });
    });

    describe(selectTradingSellQuotes.name, () => {
        it('should return quotes from trading sell state', () => {
            expect(selectTradingSellQuotes(state)).toBe(state.wallet.trading.sell.quotes);
        });
    });

    describe(selectTradingProviderByNameAndTradeType.name, () => {
        it('should return the correct provider for buy trade type', () => {
            const providerName = 'provider1';
            state.wallet.trading.buy.buyInfo = {
                ...state.wallet.trading.buy.buyInfo,
                providerInfos: {
                    [providerName]: { name: providerName },
                },
            } as unknown as BuyInfo;

            const result = selectTradingProviderByNameAndTradeType(state, providerName, 'buy');
            expect(result).toEqual({ name: providerName });
        });

        it('should return the correct provider for exchange trade type', () => {
            const providerName = 'provider2';
            state.wallet.trading.exchange.exchangeInfo = {
                ...state.wallet.trading.exchange.exchangeInfo,
                providerInfos: {
                    [providerName]: { name: providerName },
                },
            } as unknown as ExchangeInfo;

            const result = selectTradingProviderByNameAndTradeType(state, providerName, 'exchange');
            expect(result).toEqual({ name: providerName });
        });

        it('should return the correct provider for sell trade type', () => {
            const providerName = 'provider3';
            state.wallet.trading.sell.sellInfo = {
                ...state.wallet.trading.sell.sellInfo,
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
            ).toThrow('Unreachable case: ["invalid"]');
        });
    });

    describe(selectTradingTradesForSelectedDevice.name, () => {
        it('should return trades for the selected device', () => {
            const mockState = {
                wallet: {
                    selectedAccount: {
                        account: { deviceState: 'device1' },
                    },
                    accounts: [
                        { key: 'key1', deviceState: 'device1' },
                        { key: 'key2', deviceState: 'device2' },
                    ],
                    trading: {
                        trades: [
                            { selectedAccountKey: 'key1', tradeType: 'buy' },
                            { sendAccountKey: 'key2', tradeType: 'sell' },
                        ],
                    },
                },
            } as unknown as TradingRootStateWithDeviceAndAccounts;

            const result = selectTradingTradesForSelectedDevice(mockState);

            expect(result).toEqual([{ selectedAccountKey: 'key1', tradeType: 'buy' }]);
        });

        it('should return an empty array if no trades match the selected device', () => {
            const mockState = {
                wallet: {
                    selectedAccount: {
                        account: { deviceState: 'device3' },
                    },
                    accounts: [
                        { key: 'key1', deviceState: 'device1' },
                        { key: 'key2', deviceState: 'device2' },
                    ],
                    trading: {
                        trades: [{ tradeType: 'buy' }, { tradeType: 'sell' }],
                    },
                },
            } as unknown as TradingRootStateWithDeviceAndAccounts;

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
                        { key: 'key1', deviceState: 'device1' },
                        { key: 'key2', deviceState: 'device2' },
                    ],
                    trading: {
                        trades: [],
                    },
                },
            } as unknown as TradingRootStateWithDeviceAndAccounts;

            const result = selectTradingTradesForSelectedDevice(mockState);

            expect(result).toEqual([]);
        });
    });

    describe(selectTradingSupportedSymbols.name, () => {
        const supportedSymbols = [
            'bitcoin',
            'ethereum',
            'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            'base--0x0000000000000000000000000000000000000000',
        ];

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

    describe(selectTradingAccountKeyByTradeType.name, () => {
        it('should return exchange account key for exchange trade type', () => {
            const result = selectTradingAccountKeyByTradeType(state, 'exchange');
            expect(result).toBe('eth-descriptor-eth');
        });

        it('should return sell account key for sell trade type', () => {
            const result = selectTradingAccountKeyByTradeType(state, 'sell');
            expect(result).toBe('btc-descriptor-btc');
        });

        it('should return buy account key for buy trade type', () => {
            const result = selectTradingAccountKeyByTradeType(state, 'buy');
            expect(result).toBe('btc-descriptor-btc');
        });

        it('should return undefined when exchange account key is not set', () => {
            state.wallet.trading.exchange.tradingAccountKey = undefined;

            const result = selectTradingAccountKeyByTradeType(state, 'exchange');
            expect(result).toBeUndefined();
        });

        it('should return undefined when sell account key is not set', () => {
            state.wallet.trading.sell.tradingAccountKey = undefined;

            const result = selectTradingAccountKeyByTradeType(state, 'sell');
            expect(result).toBeUndefined();
        });

        it('should return undefined when buy account key is not set', () => {
            state.wallet.trading.buy.tradingAccountKey = undefined;

            const result = selectTradingAccountKeyByTradeType(state, 'buy');
            expect(result).toBeUndefined();
        });

        it('should be stable for same trade type', () => {
            const first = selectTradingAccountKeyByTradeType(state, 'exchange');
            const second = selectTradingAccountKeyByTradeType(state, 'exchange');

            expect(first).toBe(second);
        });
    });

    describe('selectTradingBuyLastErrorMessage', () => {
        it('should return lastErrorMessage from buy state', () => {
            state.wallet.trading.buy.lastErrorMessage = 'Buy error message';
            expect(selectTradingBuyLastErrorMessage(state)).toBe('Buy error message');
        });
    });

    describe('selectTradingSellLastErrorMessage', () => {
        it('should return lastErrorMessage from sell state', () => {
            state.wallet.trading.sell.lastErrorMessage = 'Sell error message';
            expect(selectTradingSellLastErrorMessage(state)).toBe('Sell error message');
        });
    });

    describe('selectTradingExchangeLastErrorMessage', () => {
        it('should return lastErrorMessage from exchange state', () => {
            state.wallet.trading.exchange.lastErrorMessage = 'Exchange error message';
            expect(selectTradingExchangeLastErrorMessage(state)).toBe('Exchange error message');
        });
    });

    describe('selectTradingLastErrorMessageByTradeType', () => {
        beforeEach(() => {
            state.wallet.trading.buy.lastErrorMessage = 'Buy error message';
            state.wallet.trading.sell.lastErrorMessage = 'Sell error message';
            state.wallet.trading.exchange.lastErrorMessage = 'Exchange error message';
        });

        it.each<[TradingType, string]>([
            ['buy', 'Buy error message'],
            ['sell', 'Sell error message'],
            ['exchange', 'Exchange error message'],
        ])('should return lastErrorMessage for %s', (tradeType, expectedMessage) => {
            const result = selectTradingLastErrorMessageByTradeType(state, tradeType);

            expect(result).toBe(expectedMessage);
        });
    });

    describe('selectTradingProviderMetadata', () => {
        it('should return currentProviderMetadata from state', () => {
            const providerMetadata = getProviderMetadataFixture('changenow');
            state.wallet.trading.currentProviderMetadata = providerMetadata;

            const result = selectTradingProviderMetadata(state);

            expect(result).toEqual(providerMetadata);
        });

        it('should return undefined when currentProviderMetadata is not set', () => {
            state.wallet.trading.currentProviderMetadata = undefined;

            const result = selectTradingProviderMetadata(state);

            expect(result).toBeUndefined();
        });
    });

    describe(selectTradingIsSlip24Allowed.name, () => {
        beforeEach(() => {
            if (state.device.selectedDevice) {
                state.device.selectedDevice.unavailableCapabilities = undefined;
            }
        });

        it('should return false when account is undefined', () => {
            expect(selectTradingIsSlip24Allowed(state, undefined, true)).toBe(false);
        });

        it('should return false when isSlip24Active is false', () => {
            expect(selectTradingIsSlip24Allowed(state, accountBtc as any, false)).toBe(false);
        });

        it('should return false when firmware has slip24 in unavailableCapabilities', () => {
            if (state.device.selectedDevice) {
                state.device.selectedDevice.unavailableCapabilities = { slip24: 'no-support' };
            }
            expect(selectTradingIsSlip24Allowed(state, accountBtc as any, true)).toBe(false);
        });

        it('should return true when account is set, isSlip24Active is true, and firmware supports slip24', () => {
            expect(selectTradingIsSlip24Allowed(state, accountBtc as any, true)).toBe(true);
        });

        it('should return true for supported network when firmware supports slip24 (e.g. ethereum account)', () => {
            expect(selectTradingIsSlip24Allowed(state, accountEth as any, true)).toBe(true);
        });

        it('should return true for solana network when firmware supports slip24', () => {
            const solanaAccount = {
                ...accountBtc,
                networkType: 'solana',
            };
            expect(selectTradingIsSlip24Allowed(state, solanaAccount as any, true)).toBe(true);
        });

        it('should return true for stellar network when firmware supports slip24', () => {
            const stellarAccount = {
                ...accountBtc,
                networkType: 'stellar',
            };
            expect(selectTradingIsSlip24Allowed(state, stellarAccount as any, true)).toBe(true);
        });

        it('should return false for unsupported network even when firmware supports slip24', () => {
            const unsupportedNetworkAccount = {
                ...accountBtc,
                networkType: 'cardano',
            };
            expect(
                selectTradingIsSlip24Allowed(state, unsupportedNetworkAccount as any, true),
            ).toBe(false);
        });
    });
});
