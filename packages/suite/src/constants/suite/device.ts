import { DeviceModelInternal } from '@trezor/connect';

export const DEFAULT_LABEL = 'My Trezor';
export const MAX_LABEL_LENGTH = 16;
export const DEFAULT_PASSPHRASE_PROTECTION = true;
export const DEFAULT_SKIP_BACKUP = true;
export const MAX_ADDRESS_DISPLAY_LENGTH = 64;

export const DEFAULT_STRENGTH = {
    [DeviceModelInternal.T1B1]: 256,
    [DeviceModelInternal.T2T1]: 128,
    [DeviceModelInternal.T2B1]: 128,
};
