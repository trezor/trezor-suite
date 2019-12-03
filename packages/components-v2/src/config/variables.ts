import { IconType } from '../support/types';

export const SCREEN_SIZE = {} as const;

export const FONT_SIZE_NATIVE = {} as const;

export const FONT_SIZE = {
    BODY: '14px',
    BUTTON: '14px',
    LARGE: '16px',
    MEDIUM: '14px',
    SMALL: '12px',
} as const;

export const FONT_WEIGHT = {
    LIGHT: 300,
    REGULAR: 400,
    DEMI_BOLD: 600,
    BOLD: 700,
} as const;

export const FONT_FAMILY = {
    TTHOVES: 'TTHoves',
} as const;

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
