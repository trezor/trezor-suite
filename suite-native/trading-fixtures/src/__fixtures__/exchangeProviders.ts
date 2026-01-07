import type { CryptoId, ExchangeProviderInfo } from 'invity-api';

export const exchangeInvity: ExchangeProviderInfo = {
    name: 'invity',
    companyName: 'Invity Finance',
    logo: 'invity.svg',
    isActive: true,
    buyTickers: ['bitcoin'] as CryptoId[],
    sellTickers: ['bitcoin', 'ethereum', 'eos'] as CryptoId[],
    statusUrl: 'https://checkout.invity.io/#status/{{orderId}}',
    supportUrl: 'https://invity.io/invest-crypto',
    termsUrl: 'https://invity.io/terms',
    isDex: true,
    isFixedRate: true,
    kycPolicyType: 'DEX',
    addressFormats: {},
};

export const exchangeMercuryo: ExchangeProviderInfo = {
    name: 'mercuryo',
    companyName: 'Mercuryo',
    logo: 'mercuryo.svg',
    isActive: true,
    buyTickers: ['bitcoin'] as CryptoId[],
    sellTickers: ['bitcoin', 'ethereum', 'eos'] as CryptoId[],
    statusUrl: 'https://checkout.mercuryo.io/#status/{{orderId}}',
    supportUrl: 'https://mercuryo.io/#support',
    termsUrl: 'https://mercuryo.io/#terms',
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
    statusUrl: 'https://checkout.cexdirect.io/#status/{{orderId}}',
    supportUrl: 'https://cexdirect.io/#support',
    termsUrl: 'https://cexdirect.io/#terms',
    isDex: false,
    isFixedRate: false,
    kycPolicyType: 'KYC-required',
    addressFormats: {},
};
