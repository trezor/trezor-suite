import type { PasswordManagerState } from 'src/types/suite/metadata';

export const FILENAME_MESS = '5f91add3fa1c3c76e90c90a3bd0999e2bd7833d06a483fe884ee60397aca277a';
export const HD_HARDENED = 0x80000000;
export const PATH = [10016 + HD_HARDENED, 0];
export const DEFAULT_KEYPHRASE = 'Activate TREZOR Password Manager?';
export const DEFAULT_NONCE =
    '2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee';

// based on https://github.com/trezor/trezor-password-manager/blob/6266f685226bc5d5e0d8c7f08490b282f64ad1d1/source/background/background.js#L116
export const DEFAULT_PASSWORD_MANAGER_STATE: PasswordManagerState = {
    config: {
        orderType: 'date',
    },
    version: '0.0.1',
    // we probably don't care about extVersion, adding it just to make sure to ensure backwards compatibility with TPM
    extVersion: '0.6.0',
    tags: {
        '0': {
            title: 'All',
            icon: 'home',
        },
        '1': {
            title: 'Social',
            icon: 'person-stalker',
        },
        '2': {
            title: 'Bitcoin',
            icon: 'social-bitcoin',
        },
    },
    entries: {},
};

export const FETCH_INTERVAL = 1000 * 30;
