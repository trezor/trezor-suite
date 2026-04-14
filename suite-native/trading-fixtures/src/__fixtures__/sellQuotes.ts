import type { CryptoId, SellFiatTrade } from 'invity-api';

import { bankAccounts } from './bankAccounts';

export const banxaCreditCardSellQuote = {
    amountInCrypto: false,
    country: 'CZ',
    cryptoCurrency: 'ethereum' as CryptoId,
    cryptoStringAmount: '0.0233',
    exchange: 'banxa-sell',
    fiatCurrency: 'USD',
    fiatStringAmount: '90.17',
    maxCrypto: 30000,
    maxFiat: 30000,
    minCrypto: 0.0011,
    minFiat: 20,
    orderId: 'order_id_0',
    paymentId: 'adc5bf90-ce56-4305-8583-06418c5248c5',
    paymentMethod: 'creditCard',
    paymentMethodName: 'Credit Card',
    rate: 3869.9570815450643,
    tags: ['wantFiat'],
} satisfies SellFiatTrade;

export const banxaBankTransferSellQuote = {
    amountInCrypto: false,
    country: 'CZ',
    cryptoCurrency: 'ethereum' as CryptoId,
    cryptoStringAmount: '0.02539600123456789',
    exchange: 'banxa-sell',
    fiatCurrency: 'USD',
    fiatStringAmount: '100.00',
    maxCrypto: 5.83997533,
    maxFiat: 25000,
    minCrypto: 0.01167995,
    minFiat: 50,
    orderId: 'order_id_1',
    partnerData2: '6107',
    paymentId: '7b9d5f99-5612-4fc3-98ab-ace3dad87e28',
    paymentMethod: 'bankTransfer',
    paymentMethodName: 'Bank Transfer',
    rate: 3937.6279729091198,
    tags: ['wantFiat'],
    bankAccounts,
} satisfies SellFiatTrade;

export const moonpayCreditCardSellQuote = {
    amountInCrypto: false,
    country: 'CZ',
    cryptoCurrency: 'ethereum' as CryptoId,
    cryptoStringAmount: '0.02539600',
    exchange: 'moonpay-sell',
    fiatCurrency: 'USD',
    fiatStringAmount: '100.0621',
    maxCrypto: 30000,
    maxFiat: 30000,
    minCrypto: 0.0011,
    minFiat: 20,
    orderId: 'order_id_2',
    paymentId: '2dc5bf90-ce56-4305-8583-06418c5248c5',
    paymentMethod: 'creditCard',
    paymentMethodName: 'Credit Card',
    rate: 3940,
    tags: ['wantFiat'],
} satisfies SellFiatTrade;

export const sellQuotes = [
    banxaCreditCardSellQuote,
    banxaBankTransferSellQuote,
    moonpayCreditCardSellQuote,
] satisfies [SellFiatTrade, SellFiatTrade, SellFiatTrade];
