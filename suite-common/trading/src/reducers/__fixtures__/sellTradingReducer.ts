import { CryptoId, SellFiatTrade, SellFiatTradeQuoteRequest } from 'invity-api';

import { TradingAmountLimitProps } from '../../types';
import { SellInfo, sellInitialState, tradingSellActions } from '../sellReducer';

const sellInfo: SellInfo = {
    providerInfos: {},
    supportedFiatCurrencies: ['USD'],
    supportedCryptoCurrencies: ['bitcoin'] as CryptoId[],
    country: 'US',
};

const quotesRequest: SellFiatTradeQuoteRequest = {
    amountInCrypto: true,
    fiatCurrency: 'USD',
    cryptoCurrency: 'BTC' as CryptoId,
    cryptoStringAmount: '0.1',
};

const sellQuotes: SellFiatTrade[] = [
    {
        amountInCrypto: true,
        fiatStringAmount: '55.5',
        fiatCurrency: 'EUR',
        cryptoCurrency: 'BTC' as CryptoId,
        cryptoStringAmount: '0.00107223',
        rate: 51761.282560644635,
        quoteId:
            'eyJpdiI6Im1KV0JRMDFrNWRvRjNIZXMiLCJ0YWciOiJKelBRTXRQYkZ1TjdOcXhtaTJWSmxBIiwiYWxnIjoiQTI1NkdDTUtXIiwiZW5jIjoiQTI1NkdDTSIsInppcCI6IkRFRiJ9.XZ-BA3aIQK9g1y1Az42wuiQqMF2LEmSU8Y8bKufFbQI.EYoVrGbPeaqd6iqV.TK2u-mXkM4N-YIVmu5OItzrb-Qi6J_qDCjqhqqxCFGQGF3Z2EQQJ8pez2WG3M_ilk2bO9ajYjiSis9py_glPNHe2fuPWWUyWNgTiQYurpjmILeXllXYBSjTx3RffBwwF5iZ-cn3KDUG8Dmji3R8DaQ4zRbnP6A9aiz1QX4_oaPHSGNy2T0Ccg5_y9pYaEPFR5dyIQdMb4xV5w5iWc_6fM_egVbeIy2yOxhBbo5PvS4kGU8mF6kYTLJVzunArVqRV3jh7Andn2JCvfvX0gErALjBThKXxYDNE02QQfJ-L6YuWGRNIXNbd9C95rvVV507gWPpu8IYnQSrdgh-FfLjxp641sXfwbm6bN0B-ru7eaRH5JgQYO_fXtJeb3UEzTO5Wld04ZH0vebVa3Rm6AsWiqo7qtiVrz4iScsptuFzOX1BMVJ4OxFKpn6tgpg9plh6T2GKwxuBCwXDQQg9S4UYRB4nbOVvYXB42HJ-H.DRz1nICmObrsluvSBDuxgQ',
        exchange: 'btcdirect-sell-sandbox',
        validUntil: '2024-08-16T06:26:59Z',
        minFiat: 30.41,
        maxFiat: 50690.35,
        minCrypto: 0.00057338,
        maxCrypto: 0.95586265,
        paymentMethod: 'bankTransfer',
        paymentMethodName: 'Bank Transfer',
        country: 'CZ',
        bankAccounts: [
            { bankAccount: 'SE35 5000 0000 0549 1000 0003', holder: 'test', verified: true },
            { bankAccount: 'DK50 0040 0440 1162 43', holder: 'Test', verified: false },
            { bankAccount: 'CH93 0076 2011 6238 5295 7', holder: 'test', verified: false },
            { bankAccount: 'FR7630006000011234567890189', holder: 'test2', verified: false },
            { bankAccount: 'DE89 3704 0044 0532 0130 00', holder: 'test3', verified: false },
            {
                bankAccount: 'AT-0049-0621',
                holder: 'BTC Productie 21-03-2018',
                verified: false,
            },
        ],
    },
];

const amountLimits: TradingAmountLimitProps = {
    currency: 'ethereum',
    minCrypto: '0.001',
    maxCrypto: '0.003',

    minFiat: '50',
    maxFiat: '250',
};

export const sellTradingFixtures = [
    {
        description: 'should save sell info',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.saveSellInfo.type,
                payload: sellInfo,
            },
        ],
        result: {
            ...sellInitialState,
            sellInfo,
        },
    },
    {
        description: 'should save transaction detail id',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.saveTransactionId.type,
                payload: '1234-1234-1234',
            },
        ],
        result: {
            ...sellInitialState,
            transactionId: '1234-1234-1234',
        },
    },
    {
        description: 'should save quote request',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.saveQuoteRequest.type,
                payload: quotesRequest,
            },
        ],
        result: {
            ...sellInitialState,
            quotesRequest,
        },
    },

    {
        description: 'should save quotes',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.saveQuotes.type,
                payload: sellQuotes,
            },
        ],
        result: {
            ...sellInitialState,
            quotes: sellQuotes,
        },
    },
    {
        description: 'should save selected quote',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.saveSelectedQuote.type,
                payload: sellQuotes[0],
            },
        ],
        result: {
            ...sellInitialState,
            selectedQuote: sellQuotes[0],
        },
    },
    {
        description: 'should set status whether is from redirect',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.setIsFromRedirect.type,
                payload: true,
            },
        ],
        result: {
            ...sellInitialState,
            isFromRedirect: true,
        },
    },
    {
        description: 'should set trading account key',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.setTradingAccountKey.type,
                payload: '123456',
            },
        ],
        result: {
            ...sellInitialState,
            tradingAccountKey: '123456',
        },
    },
    {
        description: 'should set loading status',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.setIsLoading.type,
                payload: true,
            },
        ],
        result: {
            ...sellInitialState,
            isLoading: true,
        },
    },
    {
        description: 'should set amount limits',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.setAmountLimits.type,
                payload: amountLimits,
            },
        ],
        result: {
            ...sellInitialState,
            amountLimits,
        },
    },
    {
        description: 'should form step',
        initialState: sellInitialState,
        actions: [
            {
                type: tradingSellActions.setFormStep.type,
                payload: 'SEND_TRANSACTION',
            },
        ],
        result: {
            ...sellInitialState,
            formStep: 'SEND_TRANSACTION',
        },
    },
];
