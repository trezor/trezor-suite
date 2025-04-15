import { CryptoId, SellFiatTradeQuoteRequest } from 'invity-api';

const bitcoin = 'bitcoin' as CryptoId;

export const QUOTE_REQUEST_FIAT: SellFiatTradeQuoteRequest = {
    amountInCrypto: false,
    country: 'CZ',
    fiatCurrency: 'EUR',
    cryptoCurrency: bitcoin,
    fiatStringAmount: '10',
    paymentMethod: 'creditCard',
};

export const QUOTE_REQUEST_CRYPTO: SellFiatTradeQuoteRequest = {
    amountInCrypto: true,
    country: 'CZ',
    fiatCurrency: 'EUR',
    cryptoCurrency: bitcoin,
    cryptoStringAmount: '0.001',
    paymentMethod: 'creditCard',
};
