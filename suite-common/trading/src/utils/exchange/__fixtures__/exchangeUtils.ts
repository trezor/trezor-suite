import { CryptoId, ExchangeTrade } from 'invity-api';

import { ExchangeInfo } from '../../../reducers/exchangeReducer';

const litecoin = 'litecoin' as CryptoId;
const bitcoin = 'bitcoin' as CryptoId;

const tickers1 = [litecoin, bitcoin];

export const EXCHANGE_INFO: ExchangeInfo = {
    providerInfos: {
        changelly: {
            name: 'changelly',
            companyName: 'Changelly',
            logo: 'changelly-icon.jpg',
            isActive: true,
            isFixedRate: false,
            isDex: false,
            buyTickers: tickers1,
            sellTickers: tickers1,
            addressFormats: {
                BCH: 'cashaddr',
                LTC: 'type3',
            },
            statusUrl: '',
            kycUrl: 'https://changelly.com/aml-kyc',
            supportUrl: 'https://support.changelly.com',
            kycPolicy: 'KYC requested in exceptional cases. KYC required for refunds. 👈',
            kycPolicyType: 'KYC-norefund',
            isRefundRequired: true,
        },
        changellyfr: {
            name: 'changellyfr',
            companyName: 'Changelly',
            logo: 'changellyfr-icon.jpg',
            isActive: true,
            isFixedRate: true,
            isDex: false,
            buyTickers: tickers1,
            sellTickers: tickers1,
            addressFormats: {
                BCH: 'cashaddr',
                LTC: 'type3',
            },
            statusUrl: '',
            kycUrl: 'https://changelly.com/aml-kyc',
            supportUrl: 'https://support.changelly.com',
            kycPolicy: 'KYC requested in exceptional cases. KYC required for refunds. 👈',
            kycPolicyType: 'KYC-norefund',
            isRefundRequired: true,
        },
    },
    buyCryptoIds: [],
    sellCryptoIds: [],
};

export const MIN_MAX_QUOTES_OK: ExchangeTrade[] = [
    {
        send: litecoin,
        sendStringAmount: '12',
        receive: bitcoin,
        receiveStringAmount: '0.0609979',
        rate: 0.005083158333333333,
        min: 0.5688,
        max: 'NONE',
        fee: 'UNKNOWN',
        exchange: 'changelly',
    },
    {
        send: litecoin,
        sendStringAmount: '12',
        receive: bitcoin,
        receiveStringAmount: '0.0609979',
        rate: 0.005083158333333333,
        min: 0.5688,
        max: 'NONE',
        fee: 'UNKNOWN',
        exchange: 'changellyfr',
    },
    {
        send: litecoin,
        sendStringAmount: '12',
        receive: bitcoin,
        receiveStringAmount: '0.0605096167302',
        rate: 0.00504246806085,
        min: 1.68,
        max: 130,
        fee: 'UNKNOWN',
        exchange: 'foxexchange',
        quoteToken: '',
    },
    {
        send: litecoin,
        sendStringAmount: '12',
        receive: bitcoin,
        receiveStringAmount: '0.06047229',
        rate: 0.0050393575,
        min: 1.68,
        max: 130,
        fee: 'INCLUDED',
        exchange: 'foxexchangefr',
        quoteToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    },
];

const MIN_MAX_QUOTES_LOW: ExchangeTrade[] = [
    {
        send: litecoin,
        sendStringAmount: '.1',
        receive: bitcoin,
        receiveStringAmount: '0.000503106150246929012',
        rate: 0.00503106150246929,
        min: 0.3520800003243513,
        max: 195.60000018019517,
        fee: 'INCLUDED',
        rateIdentificator: 'ed43e76b-eb1d-4363-bc32-e2e768933de9',
        exchange: 'changeherofr',
    },
    {
        send: litecoin,
        sendStringAmount: '.1',
        receive: bitcoin,
        receiveStringAmount: '0.00015492504',
        rate: 0.0015492504,
        min: 0.35121471511608626,
        max: 'NONE',
        fee: 'UNKNOWN',
        exchange: 'changehero',
    },
    { error: 'Invalid amount: minimal amount is 0.474', exchange: 'changelly' },
    {
        send: litecoin,
        sendStringAmount: '.1',
        receive: bitcoin,
        min: 0.7043630399999999,
        max: 293.3972814,
        fee: 'INCLUDED',
        error: 'Amount out of range.',
        exchange: 'changenowfr',
    },
];

const MIN_MAX_QUOTES_HIGH: ExchangeTrade[] = [
    {
        send: litecoin,
        sendStringAmount: '3.1',
        receive: bitcoin,
        receiveStringAmount: '.11',
        rate: 0.00503106150246929,
        min: 0.3520800003243513,
        max: 1.9,
        fee: 'INCLUDED',
        rateIdentificator: 'ed43e76b-eb1d-4363-bc32-e2e768933de9',
        exchange: 'changeherofr',
    },
    {
        send: litecoin,
        sendStringAmount: '3.1',
        receive: bitcoin,
        receiveStringAmount: '.1',
        rate: 0.0015492504,
        min: 0.35121471511608626,
        max: 2,
        fee: 'UNKNOWN',
        exchange: 'changehero',
    },
];

const MIN_MAX_QUOTES_CANNOT_TRADE: ExchangeTrade[] = [
    { error: 'Cannot trade pair LTC-DATA.', exchange: 'changehero' },
];

// dex and not filled exchange
const OTHER_QUOTES: ExchangeTrade[] = [
    {
        send: litecoin,
        sendStringAmount: '12',
        receive: bitcoin,
        receiveStringAmount: '0.06047229',
        rate: 0.0050393575,
        min: 1.68,
        max: 130,
        fee: 'INCLUDED',
        exchange: '1inch',
        quoteToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        isDex: true,
    },
    {
        send: litecoin,
        sendStringAmount: '12',
        receive: bitcoin,
        receiveStringAmount: '0.06047229',
        rate: 0.0050393575,
        min: 1.68,
        max: 130,
        fee: 'INCLUDED',
        quoteToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    },
];

const EXCHANGE_SUCCESS_ORDERED_QUOTES = [
    {
        exchange: 'changelly',
        fee: 'UNKNOWN',
        max: 'NONE',
        min: 0.5688,
        rate: 0.005083158333333333,
        receive: bitcoin,
        receiveStringAmount: '0.0609979',
        send: litecoin,
        sendStringAmount: '12',
    },
    {
        send: litecoin,
        sendStringAmount: '12',
        receive: bitcoin,
        receiveStringAmount: '0.0609979',
        rate: 0.005083158333333333,
        min: 0.5688,
        max: 'NONE',
        fee: 'UNKNOWN',
        exchange: 'changellyfr',
    },
    {
        exchange: 'foxexchange',
        fee: 'UNKNOWN',
        max: 130,
        min: 1.68,
        quoteToken: '',
        rate: 0.00504246806085,
        receive: bitcoin,
        receiveStringAmount: '0.0605096167302',
        send: litecoin,
        sendStringAmount: '12',
    },
    {
        exchange: 'foxexchangefr',
        fee: 'INCLUDED',
        max: 130,
        min: 1.68,
        quoteToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        rate: 0.0050393575,
        receive: bitcoin,
        receiveStringAmount: '0.06047229',
        send: litecoin,
        sendStringAmount: '12',
    },
];

export const exchangeUtilsFixtures = {
    EXCHANGE_INFO,
    MIN_MAX_QUOTES_OK,
    MIN_MAX_QUOTES_LOW,
    MIN_MAX_QUOTES_HIGH,
    MIN_MAX_QUOTES_CANNOT_TRADE,
    EXCHANGE_SUCCESS_ORDERED_QUOTES,
    OTHER_QUOTES,
};
