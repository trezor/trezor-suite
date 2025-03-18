import { CryptoId, ExchangeProviderInfo, ExchangeTrade } from 'invity-api';

import { TradingExchangeAmountLimitProps } from '../../types';
import { ExchangeInfo, exchangeInitialState, tradingExchangeActions } from '../exchangeReducer';

export const exchange: ExchangeProviderInfo = {
    name: 'test',
    companyName: 'Test',
    logo: 'test.jpg',
    isActive: true,
    isFixedRate: false,
    isDex: false,
    buyTickers: [],
    sellTickers: [],
    addressFormats: {},
    statusUrl: 'https://test.io/exchange/txs/{{orderId}}',
    kycUrl: 'https://test.io/faq#kyc',
    supportUrl: 'https://support.test.io',
    kycPolicy: 'KYC is required',
    kycPolicyType: 'KYC-required',
};

const exchangeInfo: ExchangeInfo = {
    exchangeList: [exchange],
    providerInfos: {
        test: exchange,
    },
    buyCryptoIds: ['bitcoin'] as CryptoId[],
    sellCryptoIds: ['ethereum'] as CryptoId[],
};

const quotesRequest = {
    send: 'bitcoin' as CryptoId,
    receive: 'ethereum' as CryptoId,
    sendStringAmount: '0.1',
    dex: 'enable',
};

const exchangeQuotes: ExchangeTrade[] = [
    {
        send: 'litecoin' as CryptoId,
        sendStringAmount: '12',
        receive: 'bitcoin' as CryptoId,
        receiveStringAmount: '0.0609979',
        rate: 0.005083158333333333,
        min: 0.5688,
        max: 'NONE',
        fee: 'UNKNOWN',
        exchange: 'changelly',
    },
    {
        send: 'litecoin' as CryptoId,
        sendStringAmount: '12',
        receive: 'bitcoin' as CryptoId,
        receiveStringAmount: '0.0605096167302',
        rate: 0.00504246806085,
        min: 1.68,
        max: 130,
        fee: 'UNKNOWN',
        exchange: 'foxexchange',
        quoteToken: '',
    },
];

const amountLimits: TradingExchangeAmountLimitProps = {
    currency: 'litecoin',
    minCrypto: '0.001',
    maxCrypto: '0.001',
};

export const exchangeTradingFixtures = [
    {
        description: 'should save exchange info',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.saveExchangeInfo.type,
                payload: exchangeInfo,
            },
        ],
        result: {
            ...exchangeInitialState,
            exchangeInfo,
        },
    },
    {
        description: 'should save transaction id',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.saveTransactionId.type,
                payload: '1234-1234-1234',
            },
        ],
        result: {
            ...exchangeInitialState,
            transactionId: '1234-1234-1234',
        },
    },
    {
        description: 'should save quote request',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.saveQuoteRequest.type,
                payload: quotesRequest,
            },
        ],
        result: {
            ...exchangeInitialState,
            quotesRequest,
        },
    },
    {
        description: 'should save quotes',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.saveQuotes.type,
                payload: exchangeQuotes,
            },
        ],
        result: {
            ...exchangeInitialState,
            quotes: exchangeQuotes,
        },
    },
    {
        description: 'should clear quotes',
        initialState: {
            ...exchangeInitialState,
            quotes: exchangeQuotes,
        },
        actions: [
            {
                type: tradingExchangeActions.clearQuotes.type,
            },
        ],
        result: {
            ...exchangeInitialState,
            quotes: [],
        },
    },
    {
        description: 'should save verify address',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.verifyAddress.type,
                payload: '1abcdef',
            },
        ],
        result: {
            ...exchangeInitialState,
            addressVerified: '1abcdef',
        },
    },
    {
        description: 'should dispose verified address',
        initialState: {
            ...exchangeInitialState,
            addressVerified: '1abcdef',
        },
        actions: [
            {
                type: tradingExchangeActions.dispose.type,
            },
        ],
        result: {
            ...exchangeInitialState,
        },
    },
    {
        description: 'should set trading account key',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.setTradingAccountKey.type,
                payload: '1abcdef',
            },
        ],
        result: {
            ...exchangeInitialState,
            tradingAccountKey: '1abcdef',
        },
    },
    {
        description: 'should save selected quote',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.saveSelectedQuote.type,
                payload: exchangeQuotes[0],
            },
        ],
        result: {
            ...exchangeInitialState,
            selectedQuote: exchangeQuotes[0],
        },
    },
    {
        description: 'should set status whether is from redirect',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.setIsFromRedirect.type,
                payload: true,
            },
        ],
        result: {
            ...exchangeInitialState,
            isFromRedirect: true,
        },
    },
    {
        description: 'should set loading status',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.setIsLoading.type,
                payload: true,
            },
        ],
        result: {
            ...exchangeInitialState,
            isLoading: true,
        },
    },
    {
        description: 'should set amount limits',
        initialState: exchangeInitialState,
        actions: [
            {
                type: tradingExchangeActions.setAmountLimits.type,
                payload: amountLimits,
            },
        ],
        result: {
            ...exchangeInitialState,
            amountLimits,
        },
    },
];
