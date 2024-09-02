import { BuyTrade, BuyTradeQuoteRequest, CryptoId } from 'invity-api';

export const QUOTE_REQUEST_FIAT: BuyTradeQuoteRequest = {
    wantCrypto: false,
    country: 'CZ',
    fiatCurrency: 'EUR',
    receiveCurrency: 'BTC' as CryptoId,
    fiatStringAmount: '10',
};

export const QUOTE_REQUEST_CRYPTO: BuyTradeQuoteRequest = {
    wantCrypto: true,
    country: 'CZ',
    fiatCurrency: 'EUR',
    receiveCurrency: 'BTC' as CryptoId,
    cryptoStringAmount: '0.001',
};

export const MIN_MAX_QUOTES_OK: BuyTrade[] = [
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.0005',
        rate: 20000,
        quoteId: 'fc12d4c4-9078-4175-becd-90fc58a3145c',
        error: 'Amount too low, minimum is EUR 25 or BTC 0.002.',
        exchange: 'cexdirect',
        minFiat: 25,
        maxFiat: 1000,
        minCrypto: 0.002,
        maxCrypto: 0.10532,
        paymentMethod: 'creditCard',
        paymentId: 'e709df77-ee9e-4d12-98c2-84004a19c546',
    },
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.0010001683607972866',
        rate: 9998.316675433,
        quoteId: 'ff259797-6cbe-4fea-8330-5181353f64a0',
        exchange: 'mercuryo',
        minFiat: 20,
        maxFiat: 1999.96,
        minCrypto: 0.002,
        maxCrypto: 0.20003,
        paymentMethod: 'creditCard',
    },
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0',
        rate: 0,
        error: 'Transaction amount too low. Please enter a value of 43 EUR or more.',
        exchange: 'simplex',
        minFiat: 43,
        maxFiat: 17044,
        minCrypto: 0.00415525,
        maxCrypto: 1.66210137,
        paymentMethod: 'creditCard',
    },
];

export const MIN_MAX_QUOTES_LOW: BuyTrade[] = [
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.0005',
        rate: 20000,
        quoteId: 'fc12d4c4-9078-4175-becd-90fc58a3145c',
        error: 'Amount too low, minimum is EUR 25 or BTC 0.002.',
        exchange: 'cexdirect',
        minFiat: 25,
        maxFiat: 1000,
        minCrypto: 0.002,
        maxCrypto: 0.10532,
        paymentMethod: 'creditCard',
    },
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.0010001683607972866',
        rate: 9998.316675433,
        quoteId: 'ff259797-6cbe-4fea-8330-5181353f64a0',
        error: 'Amount too low, minimum is EUR 20.00 or BTC 0.00200000.',
        exchange: 'mercuryo',
        minFiat: 20,
        maxFiat: 1999.96,
        minCrypto: 0.002,
        maxCrypto: 0.20003,
        paymentMethod: 'creditCard',
    },
    {
        fiatStringAmount: '10',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0',
        rate: 0,
        error: 'Transaction amount too low. Please enter a value of 43 EUR or more.',
        exchange: 'simplex',
        minFiat: 43,
        maxFiat: 17044,
        minCrypto: 0.00415525,
        maxCrypto: 1.66210137,
        paymentMethod: 'creditCard',
    },
];

export const MIN_MAX_QUOTES_HIGH: BuyTrade[] = [
    {
        fiatStringAmount: '100000',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '9.8414',
        rate: 10161.15593309895,
        quoteId: '0e1966dc-83c7-4b98-9b93-d8a5e426b3d3',
        error: 'Amount too high, maximum is EUR 1000 or BTC 0.10595.',
        exchange: 'cexdirect',
        minFiat: 25,
        maxFiat: 1000,
        minCrypto: 0.002,
        maxCrypto: 0.10595,
        paymentMethod: 'creditCard',
    },
    {
        fiatStringAmount: '100000',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '10.010215580340265',
        rate: 9989.794844818,
        quoteId: 'f1a4cf48-ebdb-4dac-b049-2dbd086dd68d',
        error: 'Amount too high, maximum is EUR 2000.03 or BTC 0.20015000.',
        exchange: 'mercuryo',
        minFiat: 19.98,
        maxFiat: 2000.03,
        minCrypto: 0.002,
        maxCrypto: 0.20015,
        paymentMethod: 'creditCard',
    },
    {
        fiatStringAmount: '100000',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '9.8414',
        rate: 0,
        error: 'Transaction amount too high. Please enter a value of 17050 EUR or less.',
        exchange: 'simplex',
        minFiat: 43,
        maxFiat: 17045,
        minCrypto: 0.00418032,
        maxCrypto: 1.67212968,
        paymentMethod: 'creditCard',
    },
];

export const ALTERNATIVE_QUOTES: BuyTrade[] = [
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
        tags: ['alternativeCurrency'],
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
        tags: ['alternativeCurrency'],
    },
    {
        fiatStringAmount: '47.12',
        fiatCurrency: 'EUR',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.00391181',
        rate: 12045.57481063753,
        quoteId: 'd12bbe83-32a9-4dd9-abb4-0fdbddee70fb',
        exchange: 'simplex',
        validUntil: '2020-08-04T13:57:57.757Z',
        minFiat: 43,
        maxFiat: 17044,
        minCrypto: 0.00416233,
        maxCrypto: 1.66493314,
        paymentMethod: 'creditCard',
        tags: ['alternativeCurrency'],
    },
    {
        fiatStringAmount: '1234',
        fiatCurrency: 'CZK',
        receiveCurrency: 'BTC' as CryptoId,
        receiveStringAmount: '0.00386933',
        rate: 318918.26233482285,
        quoteId: 'c9ff416d-2c52-4cc1-ba9c-7c61cb136f1c',
        exchange: 'simplex',
        validUntil: '2020-08-04T13:57:57.743Z',
        minFiat: 1116,
        maxFiat: 446382,
        minCrypto: 0.00416233,
        maxCrypto: 1.66493314,
        paymentMethod: 'creditCard',
    },
];
