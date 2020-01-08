export const INIT = '@suite/init';
export const READY = '@suite/ready';
export const ERROR = '@suite/error';
export const INITIAL_RUN_COMPLETED = '@suite/initial-run-completed';
export const CONNECT_INITIALIZED = '@suite/trezor-connect-initialized';
export const SELECT_DEVICE = '@suite/select-device';
export const UPDATE_SELECTED_DEVICE = '@suite/update-selected-device';
export const REQUEST_PASSPHRASE_MODE = '@suite/request-passphrase-mode';
export const RECEIVE_PASSPHRASE_MODE = '@suite/receive-passphrase-mode';
export const UPDATE_PASSPHRASE_MODE = '@suite/update-passphrase-mode';
export const AUTH_DEVICE = '@suite/auth-device';
export const REQUEST_DEVICE_INSTANCE = '@suite/request-device-instance';
export const CREATE_DEVICE_INSTANCE = '@suite/create-device-instance';
export const FORGET_DEVICE = '@suite/forget-device';
export const FORGET_DEVICE_INSTANCE = '@suite/forget-device-instance';
// export const REQUEST_REMEMBER_DEVICE = '@suite/request-remember-device';
export const REQUEST_REMEMBER_MODE = '@suite/request-remember-mode';
export const RECEIVE_REMEMBER_MODE = '@suite/receive-remember-mode';
export const REMEMBER_DEVICE = '@suite/remember-device';
export const REQUEST_DISCONNECT_DEVICE = '@suite/request-disconnect-device';
export const SET_LANGUAGE = '@suite/set-language';
export const TOGGLE_DEVICE_MENU = '@suite/toggle-device-menu';
export const TOGGLE_SIDEBAR = '@suite/toggle-sidebar';
export const SET_DEBUG_MODE = '@suite/set-debug-mode';
export const ONLINE_STATUS = '@suite/online-status';
export const APP_CHANGED = '@suite/app-changed';
export const LOCK_UI = '@suite/lock-ui';
export const LOCK_DEVICE = '@suite/lock-device';
export const LOCK_ROUTER = '@suite/lock-router';
export const LOCK_TYPE = {
    NONE: 0,
    ROUTER: 1, // restricted route changes, all other actions are possible
    DEVICE: 2, // restricted device call (TrezorConnect)
    UI: 3, // restricted most of the UI actions (buttons, keyboard etc.)
} as const;
