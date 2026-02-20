import { typedObjectKeys } from '@trezor/utils';

export const fiatBaseCurrencies = {
    usd: { code: 'usd', label: 'United States Dollar' },
    eur: { code: 'eur', label: 'Euro' },
    gbp: { code: 'gbp', label: 'Pound Sterling' },
    aed: { code: 'aed', label: 'Dirham' },
    ars: { code: 'ars', label: 'Argentine Peso' },
    aud: { code: 'aud', label: 'Australian Dollar' },
    bdt: { code: 'bdt', label: 'Bangladeshi taka' },
    bhd: { code: 'bhd', label: 'Bahraini dinar' },
    bmd: { code: 'bmd', label: 'Bermudian dollar' },
    brl: { code: 'brl', label: 'Brazilian real' },
    cad: { code: 'cad', label: 'Canadian dollar' },
    chf: { code: 'chf', label: 'Swiss franc' },
    clp: { code: 'clp', label: 'Chilean peso' },
    cny: { code: 'cny', label: 'Renminbi' },
    czk: { code: 'czk', label: 'Czech koruna' },
    dkk: { code: 'dkk', label: 'Danish krone' },
    hkd: { code: 'hkd', label: 'Hong Kong dollar' },
    huf: { code: 'huf', label: 'Hungarian forint' },
    idr: { code: 'idr', label: 'Indonesian rupiah' },
    ils: { code: 'ils', label: 'Israeli new shekel' },
    inr: { code: 'inr', label: 'Indian rupee' },
    jpy: { code: 'jpy', label: 'Japanese yen' },
    krw: { code: 'krw', label: 'South Korean won' },
    kwd: { code: 'kwd', label: 'Kuwaiti dinar' },
    lkr: { code: 'lkr', label: 'Sri Lankan rupee' },
    mmk: { code: 'mmk', label: 'Myanmar kyat' },
    mxn: { code: 'mxn', label: 'Mexican peso' },
    myr: { code: 'myr', label: 'Malaysian ringgit' },
    nok: { code: 'nok', label: 'Norwegian krone' },
    nzd: { code: 'nzd', label: 'New Zealand dollar' },
    php: { code: 'php', label: 'Philippine peso' },
    pkr: { code: 'pkr', label: 'Pakistani rupee' },
    pln: { code: 'pln', label: 'Polish złoty' },
    rub: { code: 'rub', label: 'Russian ruble' },
    sar: { code: 'sar', label: 'Saudi riyal' },
    sek: { code: 'sek', label: 'Swedish krona' },
    sgd: { code: 'sgd', label: 'Singapore dollar' },
    thb: { code: 'thb', label: 'Thai baht' },
    try: { code: 'try', label: 'Turkish lira' },
    twd: { code: 'twd', label: 'New Taiwan dollar' },
    vef: { code: 'vef', label: 'Venezuelan bolívar' },
    vnd: { code: 'vnd', label: 'Vietnamese dong' },
    zar: { code: 'zar', label: 'South African rand' },
} as const;

export const valuablesBaseCurrencies = {
    btc: { code: 'btc', label: 'Bitcoin' },
    xag: { code: 'xag', label: 'Silver' },
    xau: { code: 'xau', label: 'Gold' },
} as const;

export const valuablesBaseCurrencyCodes = typedObjectKeys(valuablesBaseCurrencies);

export const baseCurrencies = {
    ...fiatBaseCurrencies,
    ...valuablesBaseCurrencies,
} as const;

export type BaseCurrencyCode = keyof typeof baseCurrencies;
export type BaseCurrency = (typeof baseCurrencies)[BaseCurrencyCode];

export const isBaseCurrencyCode = (code: string): code is BaseCurrencyCode =>
    typeof code === 'string' && code in baseCurrencies;

export const isFiatBaseCurrencyCode = (code: string): code is keyof typeof fiatBaseCurrencies =>
    typeof code === 'string' && code in fiatBaseCurrencies;

export const isValuablesBaseCurrencyCode = (
    code: string,
): code is keyof typeof valuablesBaseCurrencies =>
    typeof code === 'string' && code in valuablesBaseCurrencies;
