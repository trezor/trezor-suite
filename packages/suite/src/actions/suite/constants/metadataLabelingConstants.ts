import {
    MetadataEncryptionVersion,
    AccountLabels,
    WalletLabels,
} from '@suite-common/metadata-types';
import { TrezorConnect } from '@trezor/connect';

/**
 * Changelog:
 * 1.0.0 - initial version
 * 1.0.1 - added "dummy" (optional - only empty dummy files created during migration), added "migratedFrom" (optional - only migrated files)
 */
export const FORMAT_VERSION = '1.0.1';

// @trezor/connect params
export const ENABLE_LABELING_PATH = "m/10015'/0'";
export const ENABLE_LABELING_KEY = 'Enable labeling?';
export const ENABLE_LABELING_VALUE =
    'fedcba98765432100123456789abcdeffedcba98765432100123456789abcdef';
export const FETCH_INTERVAL = 1000 * 60 * 3; // 3 minutes?

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
