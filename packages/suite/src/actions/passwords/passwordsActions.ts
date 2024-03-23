import * as PASSWORDS from './constants/passwordsConstants';

export type PasswordsAction =
    | { type: typeof PASSWORDS.SET_FILENAME; payload: { deviceState: string; filename: string } };

export const setFilename = (deviceState: string, filename: string): PasswordsAction => ({
    type: PASSWORDS.SET_FILENAME,
    payload: {
        deviceState,
        filename,
    },
})