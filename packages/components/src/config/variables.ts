// Bootstrap 3 breakpoints
/* XS - Extra Small Devices, Phones */
/* SM - Small Devices, Tablets */
/* MD - Medium Devices, Desktops */
/* LG - Large Devices, Wide Screens */
export const SCREEN_SIZE = {
    XS: '480px',
    SM: '768px',
    MD: '992px',
    LG: '1170px',
} as const;

export const FONT_SIZE_NATIVE = {
    SMALL: 12,
    BASE: 14,
    BIG: 16,
    BIGGER: 18,
    BIGGEST: 32,
    HUGE: 36,
    TOP_MENU: 17,
    WALLET_TITLE: 18,
    H1: 28,
    H2: 24,
    H3: 20,
    H4: 18,
    H5: 16,
    H6: 14,
    COUNTER: 11,
} as const;

export const FONT_SIZE = {
    SMALL: '0.8571rem',
    BASE: '1rem',
    BIG: '1.1428rem',
    BIGGER: '1.5rem',
    BIGGEST: '2.2857rem',
    HUGE: '2.5714rem',
    TOP_MENU: '1.2142rem',
    WALLET_TITLE: '1.2857rem',
    H1: '2rem',
    H2: '1.714285rem',
    H3: '1.42857rem',
    H4: '1.2857rem',
    H5: '1.1428rem',
    H6: '1rem',
    COUNTER: '0.7857rem',
} as const;

export const FONT_WEIGHT = {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
} as const;

export const FONT_FAMILY = {
    DEFAULT:
        '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    MONOSPACE: '"Roboto Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
} as const;

export const ICON_SIZE = {
    BASE: '20px',
} as const;

export const BORDER_WIDTH = {
    SELECTED: '3px',
} as const;

export const LEFT_NAVIGATION_ROW = {
    PADDING: '16px 24px',
} as const;

const TRANSITION_TIME = {
    BASE: '0.3s',
} as const;

export const TRANSITION = {
    HOVER: `background-color ${TRANSITION_TIME.BASE} ease-in-out, color ${TRANSITION_TIME.BASE} ease-in-out, border-color ${TRANSITION_TIME.BASE} ease-in-out, fill ${TRANSITION_TIME.BASE} ease-in-out`,
} as const;

export const LINE_HEIGHT = {
    SMALL: '1.42857143',
    BASE: '1.8',
    TREZOR_ACTION: '37px',
} as const;

// TODO: use export const COINS = [] as const; declaration for use as type literal
export const COINS = [
    'ada',
    'bch',
    'btc',
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
    'zec',
    'xtz',
] as const;

export const ICONS = [
    'ARROW_DOWN',
    'ARROW_LEFT',
    'ARROW_UP',
    'BACK',
    'CHAT',
    'CLOSE',
    'COG',
    'DOWNLOAD',
    'EJECT',
    'ERROR',
    'EYE_CROSSED',
    'EYE',
    'HELP',
    'INFO',
    'MENU',
    'PLUS',
    'QRCODE',
    'REFRESH',
    'SKIP',
    'SUCCESS',
    'T1',
    'T2',
    'TOP',
    'WALLET_HIDDEN',
    'WALLET_STANDARD',
    'WARNING',
    'CLOUD_CROSSED',
    'DOWNLOAD_CROSSED',
    'PHOTO_CROSSED',
] as const;
