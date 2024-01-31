export const INIT = '@suite/init';
export const READY = '@suite/ready';
export const ERROR = '@suite/error';
export const DESKTOP_HANDSHAKE = '@suite/desktop-handshake';
export const REQUEST_AUTH_CONFIRM = '@suite/request-auth-confirm';
export const SET_LANGUAGE = '@suite/set-language';
export const SET_DEBUG_MODE = '@suite/set-debug-mode';
export const SET_FLAG = '@suite/set-flag';
export const ONLINE_STATUS = '@suite/online-status';
export const TOR_STATUS = '@suite/tor-status';
export const TOR_BOOTSTRAP = '@suite/tor-bootstrap';
export const ONION_LINKS = '@suite/onion-links';
export const APP_CHANGED = '@suite/app-changed';
export const SET_THEME = '@suite/set-theme';
export const SET_ADDRESS_DISPLAY_TYPE = '@suite/set-display-address-type';
export const SET_AUTODETECT = '@suite/set-autodetect';
export const COINJOIN_RECEIVE_WARNING = '@suite/coinjoin-receive-warning';
export const DESKTOP_SUITE_PROMO = '@suite/desktop-suite-promo';
export const DEVICE_AUTHENTICITY_OPT_OUT = '@suite/device-authenticity-opt-out';
export const EVM_CONFIRM_EXPLANATION_MODAL = '@suite/evm-confirm-explanation-modal';
export const LOCK_UI = '@suite/lock-ui';
export const LOCK_DEVICE = '@suite/lock-device';
export const LOCK_ROUTER = '@suite/lock-router';
export const LOCK_TYPE = {
    NONE: 0,
    ROUTER: 1, // restricted route changes, all other actions are possible
    DEVICE: 2, // restricted device call (TrezorConnect)
    UI: 3, // restricted most of the UI actions (buttons, keyboard etc.)
} as const;
export const REQUEST_DEVICE_RECONNECT = '@suite/request-device-reconnect';
