import type { PasswordManagerState } from 'src/types/suite/metadata';

export const FILENAME_MESS = '5f91add3fa1c3c76e90c90a3bd0999e2bd7833d06a483fe884ee60397aca277a';
export const HD_HARDENED = 0x80000000;
export const PATH = [10016 + HD_HARDENED, 0];
export const DEFAULT_KEYPHRASE = 'Activate TREZOR Password Manager?';
export const DEFAULT_NONCE =
    '2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee2d650551248d792eabf628f451200d7f51cb63e46aadcbb1038aacb05e8c8aee';
export const DEFAULT_PASSWORD_MANAGER_STATE: PasswordManagerState = {
    config: {
        orderType: 'date',
    },
    entries: {},
    extVersion: '',
    tags: {},
};
