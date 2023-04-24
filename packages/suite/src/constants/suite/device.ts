import { DeviceModel } from '@trezor/device-utils';

export const DEFAULT_LABEL = 'My Trezor';
export const MAX_LABEL_LENGTH = 16;
export const DEFAULT_PASSPHRASE_PROTECTION = true;
export const DEFAULT_SKIP_BACKUP = true;

export const DEFAULT_STRENGTH = {
    [DeviceModel.T1]: 256,
    [DeviceModel.TT]: 128,
    [DeviceModel.T2B1]: 128,
};
