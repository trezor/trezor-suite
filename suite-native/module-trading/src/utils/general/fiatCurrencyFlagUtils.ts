import type { FiatCurrencyCode } from 'invity-api';

import { type FlagType } from '@suite-native/atoms';

const fiatCurrencyToFlagMap = {
    AED: 'AE',
    AMD: 'AM',
    ARS: 'AR',
    AUD: 'AU',
    AZN: 'AZ',
    BDT: 'BD',
    BGN: 'BG',
    BHD: 'BH',
    BRL: 'BR',
    CAD: 'CA',
    CHF: 'CH',
    CLP: 'CL',
    CNY: 'CN',
    COP: 'CO',
    CRC: 'CR',
    CZK: 'CZ',
    DKK: 'DK',
    DOP: 'DO',
    DZD: 'DZ',
    EGP: 'EG',
    EUR: 'EU',
    GBP: 'GB',
    GEL: 'GE',
    GHS: 'GH',
    HKD: 'HK',
    HUF: 'HU',
    IDR: 'ID',
    ILS: 'IL',
    INR: 'IN',
    ISK: 'IS',
    JOD: 'JO',
    JPY: 'JP',
    KES: 'KE',
    KRW: 'KR',
    KWD: 'KW',
    KZT: 'KZ',
    LKR: 'LK',
    MAD: 'MA',
    MXN: 'MX',
    MYR: 'MY',
    NGN: 'NG',
    NOK: 'NO',
    NZD: 'NZ',
    OMR: 'OM',
    PEN: 'PE',
    PHP: 'PH',
    PLN: 'PL',
    QAR: 'QA',
    RON: 'RO',
    RUB: 'RU',
    SAR: 'SA',
    SEK: 'SE',
    SGD: 'SG',
    THB: 'TH',
    TND: 'TN',
    TRY: 'TR',
    TWD: 'TW',
    TZS: 'TZ',
    UAH: 'UA',
    UGX: 'UG',
    USD: 'US',
    UYU: 'UY',
    VND: 'VN',
    ZAR: 'ZA',
} as const satisfies Record<string, FlagType>;

type FiatCurrencyWithFlag = keyof typeof fiatCurrencyToFlagMap;

const hasFiatCurrencyFlag = (fiatCurrency: string): fiatCurrency is FiatCurrencyWithFlag =>
    fiatCurrency in fiatCurrencyToFlagMap;

export const getFiatCurrencyFlag = (fiatCurrency?: FiatCurrencyCode): FlagType | undefined => {
    if (!fiatCurrency) {
        return undefined;
    }

    const normalizedFiatCurrency = fiatCurrency.toUpperCase();

    if (!hasFiatCurrencyFlag(normalizedFiatCurrency)) {
        return undefined;
    }

    return fiatCurrencyToFlagMap[normalizedFiatCurrency];
};
