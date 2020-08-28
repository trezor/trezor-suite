export const ENABLE = '@metadata/enable';
export const DISABLE = '@metadata/disable';
export const SET_READY = '@metadata/set-ready';
export const CANCELLED = '@metadata/cancelled';
export const SET_DEVICE_METADATA = '@metadata/set-device-metadata';
export const SET_PROVIDER = '@metadata/set-provider';
export const WALLET_LOADED = '@metadata/wallet-loaded';
export const WALLET_ADD = '@metadata/wallet-loaded';
export const ACCOUNT_LOADED = '@metadata/account-loaded';
export const ACCOUNT_ADD = '@metadata/account-add';
export const SET_EDITING = '@metadata/set-editing';
export const SET_INITIATING = '@metadata/set-initiating';

// todo: use in metadataActions, currently migration is not implemented yet
export const METADATA_VERSION = '2.0.0';

// trezor-connect params
export const ENABLE_LABELING_PATH = "m/10015'/0'";
export const ENABLE_LABELING_KEY = 'Enable labeling?';
export const ENABLE_LABELING_VALUE =
    'fedcba98765432100123456789abcdeffedcba98765432100123456789abcdef';
export const FETCH_INTERVAL = 1000 * 60 * 3; // 3 minutes?

export const AUTH_WINDOW_TITLE = 'AuthPopup';
export const AUTH_WINDOW_WIDTH = 600;
export const AUTH_WINDOW_HEIGHT = 720;
export const AUTH_WINDOW_PROPS = `width=${AUTH_WINDOW_WIDTH},height=${AUTH_WINDOW_HEIGHT},dialog=yes,dependent=yes,scrollbars=yes,location=yes`;

// todo: provide real client ids; these are for testing;
export const GOOGLE_CLIENT_ID =
    '842348096891-efhc485636d5t09klvrve0pi4njhq3l8.apps.googleusercontent.com';
// google client id from trezor-password-manager 296429812941-co5alkvv0tan1ptun23ilefh96gb1heb.apps.googleusercontent.com
export const DROPBOX_CLIENT_ID = 'g5f5vaogrxvvrnv';
// export const DROPBOX_CLIENT_ID = 'wg0yz2pbgjyhoda'; // from mytrzor
// dropbox client id from trezor-password-manager s340kh3l0vla1nv
