import { CryptoId, ExchangeProviderInfo } from 'invity-api';

export const exchangeInvity: ExchangeProviderInfo = {
    name: 'invity',
    companyName: 'Invity Finance',
    logo: 'invity.svg',
    isActive: true,
    buyTickers: ['bitcoin'] as CryptoId[],
    sellTickers: ['bitcoin', 'ethereum', 'eos'] as CryptoId[],
    statusUrl: 'https://checkout.invity.io/#status/{{paymentId}}',
    supportUrl: 'https://invity.io/#support',
    isDex: false,
    isFixedRate: true,
    kycPolicyType: 'noKYC',
    addressFormats: {},
};

export const exchangeMercuryo: ExchangeProviderInfo = {
    name: 'mercuryo',
    companyName: 'Mercuryo',
    logo: 'mercuryo.svg',
    isActive: true,
    buyTickers: ['bitcoin'] as CryptoId[],
    sellTickers: ['bitcoin', 'ethereum', 'eos'] as CryptoId[],
    statusUrl: 'https://checkout.mercuryo.io/#status/{{paymentId}}',
    supportUrl: 'https://mercuryo.io/#support',
    isDex: false,
    isFixedRate: true,
    kycPolicyType: 'noKYC',
    addressFormats: {},
};

export const exchangeCexdirect: ExchangeProviderInfo = {
    name: 'cexdirect',
    companyName: 'Cexdirect',
    logo: 'cexdirect.svg',
    isActive: true,
    buyTickers: ['bitcoin'] as CryptoId[],
    sellTickers: ['bitcoin', 'ethereum', 'eos'] as CryptoId[],
    statusUrl: 'https://checkout.cexdirect.io/#status/{{paymentId}}',
    supportUrl: 'https://cexdirect.io/#support',
    isDex: false,
    isFixedRate: true,
    kycPolicyType: 'noKYC',
    addressFormats: {},
};
