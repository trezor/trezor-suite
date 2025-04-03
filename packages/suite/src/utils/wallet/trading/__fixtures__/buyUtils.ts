import { BuyTrade, BuyTradeQuoteRequest, CryptoId } from 'invity-api';

const bitcoin = 'bitcoin' as CryptoId;

const QUOTE_REQUEST_FIAT: BuyTradeQuoteRequest = {
    wantCrypto: false,
    country: 'CZ',
    fiatCurrency: 'EUR',
    receiveCurrency: bitcoin,
    fiatStringAmount: '10',
    paymentMethod: 'creditCard',
};

const QUOTE_REQUEST_CRYPTO: BuyTradeQuoteRequest = {
    wantCrypto: true,
    country: 'CZ',
    fiatCurrency: 'EUR',
    receiveCurrency: bitcoin,
    cryptoStringAmount: '0.001',
    paymentMethod: 'creditCard',
};

const QUOTE: BuyTrade = {
    fiatStringAmount: '10',
    fiatCurrency: 'EUR',
    receiveCurrency: bitcoin,
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
};

export const buyUtilsFixtures = {
    QUOTE_REQUEST_FIAT,
    QUOTE_REQUEST_CRYPTO,
    QUOTE,
};
