import { BuyProviderInfo } from 'invity-api';

export const invity = {
    name: 'invity',
    companyName: 'Invity Finance',
    logo: 'invity.svg',
    isActive: true,
    tradedCoins: ['bitcoin'],
    tradedFiatCurrencies: ['EUR', 'CZK'],
    supportedCountries: ['CZ', 'DK'],
    paymentMethods: ['creditCard', 'googlePay', 'applePay'],
    brandName: 'Invity Finance',
    statusUrl: 'https://checkout.invity.io/#status/{{paymentId}}',
    supportUrl: 'https://invity.io/#support',
} as BuyProviderInfo;

export const mercuryo = {
    name: 'mercuryo',
    companyName: 'Mercuryo',
    logo: 'mercuryo.svg',
    isActive: true,
    tradedCoins: ['bitcoin'],
    tradedFiatCurrencies: ['EUR', 'CZK'],
    supportedCountries: ['CZ', 'DK'],
    paymentMethods: ['creditCard', 'googlePay', 'applePay'],
    brandName: 'Mercuryo',
    statusUrl: 'https://checkout.mercuryo.io/#status/{{paymentId}}',
    supportUrl: 'https://mercuryo.io/#support',
} as BuyProviderInfo;

export const cexdirect = {
    name: 'cexdirect',
    companyName: 'Cexdirect',
    logo: 'cexdirect.svg',
    isActive: true,
    tradedCoins: ['bitcoin'],
    tradedFiatCurrencies: ['EUR', 'CZK'],
    supportedCountries: ['CZ', 'DK'],
    paymentMethods: ['creditCard', 'googlePay', 'applePay'],
    brandName: 'Cexdirect',
    statusUrl: 'https://checkout.cexdirect.io/#status/{{paymentId}}',
    supportUrl: 'https://cexdirect.io/#support',
} as BuyProviderInfo;
