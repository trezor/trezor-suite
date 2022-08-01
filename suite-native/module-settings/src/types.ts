import { ThemeColorVariant } from '@trezor/theme';

export type AppColorScheme = ThemeColorVariant | 'system';

export type CurrencyType =
    | 'usd'
    | 'eur'
    | 'gbp'
    | 'aed'
    | 'ars'
    | 'aud'
    | 'bdt'
    | 'bhd'
    | 'bmd'
    | 'brl'
    | 'cad'
    | 'chf'
    | 'clp'
    | 'cny'
    | 'czk'
    | 'dkk'
    | 'hkd'
    | 'huf'
    | 'idr'
    | 'ils'
    | 'inr'
    | 'jpy'
    | 'krw'
    | 'kwd'
    | 'lkr'
    | 'mmk'
    | 'mxn'
    | 'myr'
    | 'nok'
    | 'nzd'
    | 'php'
    | 'pkr'
    | 'pln'
    | 'rub'
    | 'sar'
    | 'sek'
    | 'sgd'
    | 'thb'
    | 'try'
    | 'twd'
    | 'vef'
    | 'vnd'
    | 'zar'
    | 'xdr'
    | 'xag'
    | 'xau';

export type Currency = {
    label: CurrencyType;
    value: string;
};
export type CurrencyMap = Record<CurrencyType, Currency>;
