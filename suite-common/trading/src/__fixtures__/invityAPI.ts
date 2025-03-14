import {
    BuyProviderInfo,
    BuyTrade,
    BuyTradeFormResponse,
    BuyTradeQuoteRequest,
    BuyTradeRequest,
    BuyTradeResponse,
    ConfirmExchangeTradeRequest,
    CryptoId,
    ExchangeProviderInfo,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
    SellFiatTrade,
    SellFiatTradeQuoteRequest,
    SellFiatTradeRequest,
    SellProviderInfo,
    WatchBuyTradeResponse,
    WatchExchangeTradeResponse,
    WatchSellTradeResponse,
} from 'invity-api';

import { TradingOTC } from '../types';

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
    idWidget: 'idWidget',
    idOtcUser: 'idOtcUser',
    apiUrl: 'apiUrl',
    minimumFiat: '10000',
    allowedCurrencies: ['usd'],
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
};
