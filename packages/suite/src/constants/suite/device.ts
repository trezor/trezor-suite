import { DeviceModelInternal } from '@trezor/connect';

export const DEFAULT_LABEL = 'My Trezor';
export const MAX_LABEL_LENGTH = 16;
export const DEFAULT_PASSPHRASE_PROTECTION = true;
export const DEFAULT_SKIP_BACKUP = true;
export const MAX_CHARACTER_T2B1 = 70;
export const MAX_CHARACTERS_T2T1 = 81;

export const DEFAULT_STRENGTH = {
    [DeviceModelInternal.T1B1]: 256,
    [DeviceModelInternal.T2T1]: 128,
    [DeviceModelInternal.T2B1]: 128,
};

export const MAX_CHARACTERS_ON_SCREEN = {
    [DeviceModelInternal.T1B1]: 81,
    [DeviceModelInternal.T2T1]: 81,
    [DeviceModelInternal.T2B1]: 71,
};
