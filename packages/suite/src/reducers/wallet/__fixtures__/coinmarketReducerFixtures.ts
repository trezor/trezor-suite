import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';

export const buyQuotes: BuyTrade[] = [
    {
        fiatStringAmount: '47.12',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC',
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
        receiveCurrency: 'BTC',
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

export const sellQuotes: SellFiatTrade[] = [
    {
        amountInCrypto: true,
        fiatStringAmount: '55.5',
        fiatCurrency: 'EUR',
        cryptoCurrency: 'BTC',
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

export const exchangeQuotes: ExchangeTrade[] = [
    {
        exchange: 'changehero',
        fee: 'UNKNOWN',
        max: 'NONE',
        min: 0.0007199999999999999,
        orderId: '00000000-0000-0000-0000-000000000000',
        rate: 169.71201709682722,
        receive: 'BCH',
        receiveStringAmount: '0.36132537',
        send: 'BTC',
        sendStringAmount: '0.00212905',
    },
    {
        exchange: 'changelly',
        fee: 'UNKNOWN',
        max: 'NONE',
        min: 0.0001,
        orderId: '00000000-0000-0000-0000-000000000001',
        rate: 2.71201709682722,
        receive: 'DOGE',
        receiveStringAmount: '1224.42110101',
        send: 'ETH',
        sendStringAmount: '0.12392375610249',
    },
];
