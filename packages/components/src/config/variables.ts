import { IconType, CoinType } from '../support/types';

export const SCREEN_SIZE = {
    UNAVAILABLE: '260px',
    SM: '576px', // phones
    MD: '768px', // tablets
    LG: '992px', // laptops/desktops
    XL: '1200px', // extra Large laptops/desktops
} as const;

export const FONT_SIZE = {
    BIG: '18px',
    NORMAL: '16px',
    SMALL: '14px',
    TINY: '12px',
    BUTTON: '14px',
    H1: '36px',
    H2: '24px',
} as const;

export const NEUE_FONT_SIZE = {
    TINY: '12px',
    SMALL: '14px',
    NORMAL: '16px',
    H1: '24px',
    H2: '20px',
} as const;

export const FONT_WEIGHT = {
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    DEMI_BOLD: 600,
    BOLD: 700,
} as const;

export const FONT_FAMILY = {
    TTHOVES: 'TT Hoves',
    MONOSPACE: 'Menlo, Monaco, Consolas, “Courier New”, monospace',
} as const;

export const COINS: CoinType[] = [
    'ada',
    'bch',
    'btc',
    'test',
    'btg',
    'dash',
    'dgb',
    'doge',
    'etc',
    'eth',
    'ltc',
    'nem',
    'nmc',
    'rinkeby',
    'trop',
    'txrp',
    'vtc',
    'xem',
    'xlm',
    'xrp',
    'xtz',
    'zec',
];

export const ICONS: IconType[] = [
    'ARROW_DOWN',
    'ARROW_UP',
    'ARROW_LEFT',
    'ARROW_RIGHT',
    'CHECK',
    'CHECK_ACTIVE',
    'COINS',
    'COPY',
    'CROSS',
    'DASHBOARD',
    'EXCHANGE',
    'INFO',
    'INFO_ACTIVE',
    'LOG',
    'MENU',
    'MORE',
    'PASSWORDS',
    'PLUS',
    'QR',
    'QUESTION',
    'QUESTION_ACTIVE',
    'RECEIVE',
    'REFRESH',
    'SEARCH',
    'SEND',
    'SETTINGS',
    'SIGN',
    'SORT',
    'SUPPORT',
    'TIPS',
    'TRANSACTIONS',
    'TREZOR',
    'WALLET',
    'WALLET_HIDDEN',
    'EXTERNAL_LINK',
    'T1',
    'T2',
    'BACK',
    'SHOW',
    'HIDE',
    'DOWNLOAD',
    'EDIT',
    'WARNING',
    'WARNING_ACTIVE',
    'LABEL',
    'LABEL_ACTIVE',
    'TODO',
    'DISCREET',
    'PIN',
    'BACKUP',
    'COLLAPSE',
    'NOTIFICATION',
    'SHOP',
];
