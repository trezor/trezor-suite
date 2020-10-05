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

// todo: still thinking about this google token. this one is for iOS (which is recommended token type to be used in electron). It works
// for both electron and web. But we also may have web token which works only for web. Web has restriction on redirect urls, iOs does not.
// we use PKCE for both. Is there any additional security in using token for web? Hmmm...
export const GOOGLE_CLIENT_ID =
    '705190185912-q1usa46qtt21mbtldki8juhn78a0v0ma.apps.googleusercontent.com';
export const DROPBOX_CLIENT_ID = 'wg0yz2pbgjyhoda';
