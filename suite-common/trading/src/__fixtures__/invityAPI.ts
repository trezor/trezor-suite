import {
    type BuyProviderInfo,
    type BuyTrade,
    type BuyTradeFormResponse,
    type BuyTradeQuoteRequest,
    type BuyTradeRequest,
    type BuyTradeResponse,
    type ConfirmExchangeTradeRequest,
    type CreateTradeSignatureRequest,
    type CryptoId,
    type ExchangeProviderInfo,
    type ExchangeTrade,
    type ExchangeTradeQuoteRequest,
    type ExchangeTradeSigned,
    type SellFiatTrade,
    type SellFiatTradeQuoteRequest,
    type SellFiatTradeRequest,
    type SellFiatTradeSigned,
    type SellProviderInfo,
    type WatchBuyTradeResponse,
    type WatchExchangeTradeResponse,
    type WatchSellTradeResponse,
} from 'invity-api';

import { type TradingOTC } from '../types';

const exchangeList: ExchangeProviderInfo[] = [
    {
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
    },
];

const exchangeQuotesBody: ExchangeTradeQuoteRequest = {
    send: 'bitcoin' as CryptoId,
    receive: 'ethereum' as CryptoId,
    sendStringAmount: '0.1',
};

const exchangeTrade: ExchangeTrade = {
    send: 'bitcoin' as CryptoId,
    sendStringAmount: '0.1',
    receive: 'ethereum' as CryptoId,
    receiveStringAmount: '100',
    rate: 1000,
    min: 0.01,
    max: 1,
    exchange: 'test-exchange',
};

const exchangeTradeBody: ConfirmExchangeTradeRequest = {
    trade: exchangeTrade,
    receiveAddress: '0x1234567890',
    refundAddress: '0x0987654321',
};

const exchangeQuotes: ExchangeTrade[] = [exchangeTrade];

const exchangeWatchTrade: WatchExchangeTradeResponse = {
    status: 'SIGN_DATA',
};

const buyList: BuyProviderInfo[] = [
    {
        name: 'test',
        companyName: 'Test',
        logo: 'test.jpg',
        isActive: true,
        supportedCountries: [],
        tradedCoins: [],
        tradedFiatCurrencies: [],
        paymentMethods: [],
        statusUrl: 'https://test.io/buy/txs/{{orderId}}',
        supportUrl: 'https://support.test.io',
        supportedSubdivisions: {},
    },
];

const buyQuotesBody: BuyTradeQuoteRequest = {
    receiveCurrency: 'bitcoin' as CryptoId,
    fiatCurrency: 'CZK',
    fiatStringAmount: '1000',
    wantCrypto: false,
};

const buyTrade: BuyTrade = {
    exchange: 'test-buy',
    receiveCurrency: 'bitcoin' as CryptoId,
    receiveStringAmount: '0.1',
    paymentMethod: 'creditCard',
    paymentMethodName: 'Credit Card',
};

const buyQuotes: BuyTrade[] = [buyTrade];

const buyTradeBody: BuyTradeResponse = {
    trade: buyTrade,
};

const buyTradeFormBody: BuyTradeRequest = {
    trade: buyTrade,
    returnUrl: 'https://return.test-buy.io',
};

const buyTradeForm: BuyTradeFormResponse = {
    form: {
        formMethod: 'GET',
        formAction: 'https://test-buy.io',
        formTarget: '_blank',
        fields: {},
    },
};

const buyWatchTrade: WatchBuyTradeResponse = {
    status: 'APPROVAL_PENDING',
};

const sellList: SellProviderInfo[] = [
    {
        name: 'test',
        companyName: 'Test',
        logo: 'test.jpg',
        type: 'Fiat',
        isActive: true,
        supportedCountries: [],
        tradedCoins: [],
        tradedFiatCurrencies: [],
        paymentMethods: [],
        statusUrl: 'https://test.io/sell/txs/{{orderId}}',
        supportUrl: 'https://support.test.io',
        supportedSubdivisions: {},
    },
];

const sellQuotesBody: SellFiatTradeQuoteRequest = {
    cryptoCurrency: 'bitcoin' as CryptoId,
    fiatCurrency: 'CZK',
    fiatStringAmount: '1000',
    amountInCrypto: false,
};

const sellTrade: SellFiatTrade = {
    exchange: 'test-sell',
    cryptoCurrency: 'bitcoin' as CryptoId,
    cryptoStringAmount: '0.1',
    paymentMethod: 'creditCard',
    paymentMethodName: 'Credit Card',
};

const sellQuotes: SellFiatTrade[] = [sellTrade];

const sellTradeBody: SellFiatTradeRequest = {
    trade: sellTrade,
};

const sellWatchTrade: WatchSellTradeResponse = {
    status: 'SITE_ACTION_REQUEST',
};

const otc: TradingOTC = {
    links: [],
    minFiatLimits: {} as TradingOTC['minFiatLimits'],
    country: 'CZ',
};

const createTradeSignatureRequest: CreateTradeSignatureRequest = {
    type: 'exchange',
    id: 'test-order-id',
    nonce: 'test-nonce',
    outputs: [
        {
            address: 'test-address',
            amount: '100000000',
        },
    ],
    sendSlip44: 0,
    receiveSlip44: 2,
};

const exchangeTradeSigned: ExchangeTradeSigned = {
    ...exchangeTrade,
    orderId: 'test-order-id',
    tradeSignature: 'test-trade-signature',
};

const sellFiatTradeSigned: SellFiatTradeSigned = {
    ...sellTrade,
    paymentId: 'test-order-id',
    tradeSignature: 'test-trade-signature',
};

export const invityAPIFixtures = {
    exchangeList,
    exchangeQuotesBody,
    exchangeQuotes,
    exchangeTradeBody,
    exchangeTrade,
    exchangeWatchTrade,
    buyList,
    buyQuotesBody,
    buyQuotes,
    buyTradeBody,
    buyTrade,
    buyTradeFormBody,
    buyTradeForm,
    buyWatchTrade,
    sellList,
    sellQuotesBody,
    sellQuotes,
    sellTradeBody,
    sellTrade,
    sellWatchTrade,
    otc,
    createTradeSignatureRequest,
    exchangeTradeSigned,
    sellFiatTradeSigned,
};
