import {
    MetadataEncryptionVersion,
    AccountLabels,
    WalletLabels,
} from '@suite-common/metadata-types';
import { TrezorConnect } from '@trezor/connect';

export const ENABLE = '@metadata/enable';
export const DISABLE = '@metadata/disable';
export const SET_DEVICE_METADATA = '@metadata/set-device-metadata';
export const ADD_PROVIDER = '@metadata/add-provider';
export const REMOVE_PROVIDER = '@metadata/remove-provider';
export const ACCOUNT_ADD = '@metadata/account-add';
export const SET_EDITING = '@metadata/set-editing';
export const SET_INITIATING = '@metadata/set-initiating';
export const SET_DATA = '@metadata/set-data';
export const SET_SELECTED_PROVIDER = '@metadata/set-selected-provider';
export const SET_ERROR_FOR_DEVICE = '@metadata/set-error-for-device';

export const FORMAT_VERSION = '1.0.0';

// @trezor/connect params
export const ENABLE_LABELING_PATH = "m/10015'/0'";
export const ENABLE_LABELING_KEY = 'Enable labeling?';
export const ENABLE_LABELING_VALUE =
    'fedcba98765432100123456789abcdeffedcba98765432100123456789abcdef';
export const FETCH_INTERVAL = 1000 * 60 * 3; // 3 minutes?

export const AUTH_WINDOW_TITLE = 'AuthPopup';
export const AUTH_WINDOW_WIDTH = 600;
export const AUTH_WINDOW_HEIGHT = 720;
export const AUTH_WINDOW_PROPS = `width=${AUTH_WINDOW_WIDTH},height=${AUTH_WINDOW_HEIGHT},dialog=yes,dependent=yes,scrollbars=yes,location=yes`;

// used for desktop app when auth-server is running - generate testing credentials for development
export const GOOGLE_CODE_FLOW_CLIENT_ID =
    '705190185912-m4mrh55knjbg6gqhi72fr906a6n0b0u1.apps.googleusercontent.com';

// used in web app or as a fallback from authorization code flow
export const GOOGLE_IMPLICIT_FLOW_CLIENT_ID =
    '705190185912-nejegm4dbdecdaiumncbaa4ulrfnpk82.apps.googleusercontent.com';

// dropbox allows authorization code flow for both web and desktop without client secret
export const DROPBOX_CLIENT_ID = 'wg0yz2pbgjyhoda';

export const ENCRYPTION_VERSION: MetadataEncryptionVersion = 1;

export const ENCRYPTION_VERSION_CONFIGS: Record<
    MetadataEncryptionVersion,
    Parameters<TrezorConnect['cipherKeyValue']>[0]['bundle'][0]
> = {
    1: {
        path: ENABLE_LABELING_PATH,
        key: ENABLE_LABELING_KEY,
        value: ENABLE_LABELING_VALUE,
        encrypt: true,
        askOnEncrypt: true,
        askOnDecrypt: true,
    },
    2: {
        path: ENABLE_LABELING_PATH,
        key: ENABLE_LABELING_KEY,
        value: ENABLE_LABELING_VALUE,
        encrypt: true,
        askOnEncrypt: false,
        askOnDecrypt: false,
    },
};

export const DEFAULT_ACCOUNT_METADATA: AccountLabels = {
    accountLabel: '',
    outputLabels: {},
    addressLabels: {},
};

export const DEFAULT_WALLET_METADATA: WalletLabels = {
    walletLabel: '',
};

export const DROPBOX_PASSWORDS_CLIENT_ID = 's340kh3l0vla1nv';
