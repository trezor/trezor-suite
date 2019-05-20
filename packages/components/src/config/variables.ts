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

export const FONT_SIZE_NATIVE = {
    SMALL: '12',
    BASE: '14',
    BIG: '16',
    BIGGER: '18',
    BIGGEST: '32',
    HUGE: '36',
    TOP_MENU: '17',
    WALLET_TITLE: '18',
    H1: '28',
    H2: '24',
    H3: '20',
    H4: '18',
    H5: '16',
    H6: '14',
    COUNTER: '11',
};

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
};

export const FONT_WEIGHT = {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
};

export const FONT_FAMILY = {
    DEFAULT:
        '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
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
    HOVER: `background-color ${TRANSITION_TIME.BASE} ease-in-out, color ${
        TRANSITION_TIME.BASE
    } ease-in-out, border-color ${TRANSITION_TIME.BASE} ease-in-out, fill ${
        TRANSITION_TIME.BASE
    } ease-in-out`,
};

export const LINE_HEIGHT = {
    SMALL: '1.42857143',
    BASE: '1.8',
    TREZOR_ACTION: '37px',
};
