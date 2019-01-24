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
};

//  OLD UNITS
// SMALLEST: '10px',
// SMALLER: '12px',
// SMALL: '14px',
// BASE: '16px',
// TOP_MENU: '17px',
// WALLET_TITLE: '18px',
// BIG: '21px',
// BIGGER: '32px',
// BIGGEST: '36px',
// H1: '18px',
// H2: '16px',
// H3: '14px',
// H4: '12px',
// COUNTER: '11px',
export const FONT_SIZE = {
    SMALL: '0.8571rem',
    BASE: '1rem',
    BIG: '1.1428rem',
    BIGGER: '1.5rem',
    BIGGEST: '2.2857rem',
    HUGE: '2.5714rem',
    TOP_MENU: '1.2142rem',
    WALLET_TITLE: '1.2857rem',
    H1: '1.2857rem',
    H2: '1.1428rem',
    H3: '1rem',
    H4: '0.8571rem',
    COUNTER: '0.7857rem',
};

export const FONT_WEIGHT = {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
};

export const FONT_FAMILY = {
    DEFAULT: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    MONOSPACE: '"Roboto Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
};

export const ICON_SIZE = {
    BASE: '20px',
};

export const BORDER_WIDTH = {
    SELECTED: '3px',
};

export const LEFT_NAVIGATION_ROW = {
    PADDING: '16px 24px',
};

const TRANSITION_TIME = {
    BASE: '0.3s',
};

export const TRANSITION = {
    HOVER: `background-color ${TRANSITION_TIME.BASE} ease-in-out, color ${TRANSITION_TIME.BASE} ease-in-out, border-color ${TRANSITION_TIME.BASE} ease-in-out`,
};

export const LINE_HEIGHT = {
    SMALL: '1.42857143',
    BASE: '1.8',
    TREZOR_ACTION: '37px',
};
