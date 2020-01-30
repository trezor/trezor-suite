import { IconType, CoinType } from '../support/types';

// Bootstrap 4 breakpoints
/* SM - Phones */
/* MD - Tablets */
/* LG - Laptops/Desktops */
/* XL - Extra Large Laptops/Desktops */
export const SCREEN_SIZE = {
    SM: '576px',
    MD: '768px',
    LG: '992px',
    XL: '1200px',
} as const;

export const FONT_SIZE_NATIVE = {} as const;

export const FONT_SIZE = {
    BODY: '14px',
    BUTTON: '14px',
    H1: '36px',
    H2: '24px',
    NORMAL: '16px',
    SMALL: '14px',
    TINY: '12px',
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
    'COINS',
    'COPY',
    'CROSS',
    'DASHBOARD',
    'EXCHANGE',
    'INFO',
    'LOG',
    'MENU',
    'MORE',
    'PASSWORDS',
    'PLUS',
    'QR',
    'QUESTION',
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
];
