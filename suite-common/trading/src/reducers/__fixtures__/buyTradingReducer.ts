import { BuyTrade, BuyTradeQuoteRequest, CryptoId, FiatCurrenciesProps } from 'invity-api';

import { TradingAmountLimitProps } from '../../types';
import { BuyInfo, buyInitialState, tradingBuyActions } from '../buyReducer';

const buyInfo: BuyInfo = {
    buyInfo: {
        country: 'cz',
        providers: [],
        defaultAmountsOfFiatCurrencies: {
            usd: 150,
        } as FiatCurrenciesProps,
    },
    providerInfos: {},
    supportedCryptoCurrencies: ['bitcoin', 'ethereum'] as CryptoId[],
    supportedFiatCurrencies: ['usd'],
};

const quotesRequest: BuyTradeQuoteRequest = {
    fiatCurrency: 'EUR',
    receiveCurrency: 'BTC' as CryptoId,
    wantCrypto: false,
    country: 'CZ',
    fiatStringAmount: '1',
};

const buyQuotes: BuyTrade[] = [
    {
        fiatStringAmount: '47.12',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.004705020432603938',
        rate: 10014.834297738,
        quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
        exchange: 'mercuryo',
        minFiat: 20.03,
        maxFiat: 2000.05,
        minCrypto: 0.002,
        maxCrypto: 0.19952,
        paymentMethod: 'creditCard',
    },
    {
        fiatStringAmount: '47.12',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.0041',
        rate: 11492.682926829268,
        quoteId: '53233267-8181-4151-9a67-9d8efc9a15db',
        exchange: 'cexdirect',
        minFiat: 25,
        maxFiat: 1000,
        minCrypto: 0.002,
        maxCrypto: 0.1055,
        paymentMethod: 'creditCard',
    },
];

const amountLimits: TradingAmountLimitProps = {
    currency: 'bitcoin',
    minCrypto: '0.002',
    maxCrypto: '0.002',

    minFiat: '50',
    maxFiat: '250',
};

export const buyTradingFixtures = [
    {
        description: 'should save buy info',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.saveBuyInfo.type,
                payload: buyInfo,
            },
        ],
        result: {
            ...buyInitialState,
            buyInfo,
        },
    },
    {
        description: 'should save quote request',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.saveQuoteRequest.type,
                payload: quotesRequest,
            },
        ],
        result: {
            ...buyInitialState,
            quotesRequest,
        },
    },
    {
        description: 'should save transaction detail id',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.saveTransactionId.type,
                payload: '1234-1234-1234',
            },
        ],
        result: {
            ...buyInitialState,
            transactionId: '1234-1234-1234',
        },
    },
    {
        description: 'should save quotes',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.saveQuotes.type,
                payload: buyQuotes,
            },
        ],
        result: {
            ...buyInitialState,
            quotes: buyQuotes,
        },
    },
    {
        description: 'should clear quotes',
        initialState: {
            ...buyInitialState,
            quotes: buyQuotes,
        },
        actions: [
            {
                type: tradingBuyActions.clearQuotes.type,
            },
        ],
        result: {
            ...buyInitialState,
        },
    },
    {
        description: 'should save verify address',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.verifyAddress.type,
                payload: '1abcdef',
            },
        ],
        result: {
            ...buyInitialState,
            addressVerified: '1abcdef',
        },
    },
    {
        description: 'should dispose verified address',
        initialState: {
            ...buyInitialState,
            addressVerified: '1abcdef',
        },
        actions: [
            {
                type: tradingBuyActions.dispose.type,
            },
        ],
        result: {
            ...buyInitialState,
        },
    },
    {
        description: 'should save selected quote',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.saveSelectedQuote.type,
                payload: buyQuotes[0],
            },
        ],
        result: {
            ...buyInitialState,
            selectedQuote: buyQuotes[0],
        },
    },
    {
        description: 'should set status whether is from redirect',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.setIsFromRedirect.type,
                payload: true,
            },
        ],
        result: {
            ...buyInitialState,
            isFromRedirect: true,
        },
    },
    {
        description: 'should set loading status',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.setIsLoading.type,
                payload: true,
            },
        ],
        result: {
            ...buyInitialState,
            isLoading: true,
        },
    },
    {
        description: 'should set amount limits',
        initialState: buyInitialState,
        actions: [
            {
                type: tradingBuyActions.setAmountLimits.type,
                payload: amountLimits,
            },
        ],
        result: {
            ...buyInitialState,
            amountLimits,
        },
    },
];
