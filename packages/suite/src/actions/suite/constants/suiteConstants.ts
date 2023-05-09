export const INIT = '@suite/init';
export const READY = '@suite/ready';
export const ERROR = '@suite/error';
export const DESKTOP_HANDSHAKE = '@suite/desktop-handshake';
export const SELECT_DEVICE = '@suite/select-device';
export const UPDATE_SELECTED_DEVICE = '@suite/update-selected-device';
export const UPDATE_PASSPHRASE_MODE = '@suite/update-passphrase-mode';
export const AUTH_DEVICE = '@suite/auth-device';
export const AUTH_FAILED = '@suite/auth-failed';
export const REQUEST_AUTH_CONFIRM = '@suite/request-auth-confirm';
export const RECEIVE_AUTH_CONFIRM = '@suite/receive-auth-confirm';
export const CREATE_DEVICE_INSTANCE = '@suite/create-device-instance';
export const FORGET_DEVICE = '@suite/forget-device';
export const REMEMBER_DEVICE = '@suite/remember-device';
export const SET_LANGUAGE = '@suite/set-language';
export const SET_DEBUG_MODE = '@suite/set-debug-mode';
export const SET_FLAG = '@suite/set-flag';
export const ONLINE_STATUS = '@suite/online-status';
export const TOR_STATUS = '@suite/tor-status';
export const TOR_BOOTSTRAP = '@suite/tor-bootstrap';
export const ONION_LINKS = '@suite/onion-links';
export const APP_CHANGED = '@suite/app-changed';
export const ADD_BUTTON_REQUEST = '@suite/add-button-request';
export const SET_PROCESS_MODE = '@suite/set-process-mode';
export const SET_THEME = '@suite/set-theme';
export const SET_AUTODETECT = '@suite/set-autodetect';
export const COINJOIN_RECEIVE_WARNING = '@suite/coinjoin-receive-warning';
export const DESKTOP_SUITE_PROMO = '@suite/desktop-suite-promo';
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
