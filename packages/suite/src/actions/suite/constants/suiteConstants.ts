export const INIT = '@suite/init';
export const READY = '@suite/ready';
export const ERROR = '@suite/error';
export const DESKTOP_HANDSHAKE = '@suite/desktop-handshake';
export const SET_BIO_AUTH_ENABLED = '@suite/set-bio-auth-enabled';
export const REQUEST_BIO_AUTH_CHANGE = '@suite/request-bio-auth-change';
export const REQUEST_BIO_AUTH_CHANGE_END = '@suite/request-bio-auth-change-end';
export const REQUEST_BIO_AUTH_VALIDATED = '@suite/request-bio-auth-validated';
export const BIO_AUTH_WINDOW_BLUR = '@suite/bio-auth-window-blur';
export const BIO_AUTH_WINDOW_FOCUS = '@suite/bio-auth-window-focus';
export const TOGGLE_BIO_AUTH_VALIDATION_REQUESTED = '@suite/toggle-bio-auth-validation-requested';
export const SET_LANGUAGE = '@suite/set-language';
export const SET_DEBUG_MODE = '@suite/set-debug-mode';
export const SET_FLAG = '@suite/set-flag';
export const ONLINE_STATUS = '@suite/online-status';
export const TOR_STATUS = '@suite/tor-status';
export const TOR_BOOTSTRAP = '@suite/tor-bootstrap';
export const ONION_LINKS = '@suite/onion-links';
export const APP_CHANGED = '@suite/app-changed';
export const SET_THEME = '@suite/set-theme';
export const SET_SEND_FORM_PREFILL = '@suite/set-send-form-prefill';
export const SET_TRANSACTION_HISTORY_PREFILL = '@suite/set-transaction-history-prefill';
export const SET_ADDRESS_DISPLAY_TYPE = '@suite/set-display-address-type';
export const SET_DEFAULT_WALLET_LOADING = '@suite/set-default-wallet-loading';
export const SET_AUTODETECT = '@suite/set-autodetect';
export const COINJOIN_RECEIVE_WARNING = '@suite/coinjoin-receive-warning';
export const TOGGLE_DEVICE_AUTHENTICITY_CHECK = '@suite/toggle-device-authenticity-check';
export const TOGGLE_FIRMWARE_REVISION_CHECK = '@suite/toggle-firmware-revision-check';
export const TOGGLE_FIRMWARE_HASH_CHECK = '@suite/toggle-firmware-hash-check';
export const TOGGLE_ENTROPY_CHECK = '@suite/toggle-entropy-check';
export const EVM_CONFIRM_EXPLANATION_MODAL = '@suite/evm-confirm-explanation-modal';
export const EVM_CLOSE_EXPLANATION_BANNER = '@suite/evm-close-explanation-banner';
export const DISMISSED_TRADING_TERMS = '@suite/dismissed-trading-terms';
export const LOCK_UI = '@suite/lock-ui';
export const LOCK_DEVICE = '@suite/lock-device';
export const LOCK_ROUTER = '@suite/lock-router';
export const LOCK_TYPE = {
    ROUTER: 'router', // restricted route changes, all other actions are possible
    DEVICE: 'device', // restricted device call (TrezorConnect)
    UI: 'ui', // restricted most of the UI actions (buttons, keyboard etc.)
} as const;
export const SET_EXPERIMENTAL_FEATURES = '@suite/set-experimental-features';
export const SET_SIDEBAR_WIDTH = '@suite/set-sidebar-width';
export const SET_IS_COINS_FILTER_VISIBLE = '@suite/set-is-coins-filter-visible';
