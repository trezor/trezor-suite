import { DeviceModelInternal } from '@trezor/connect';

export const DEFAULT_LABEL = 'My Trezor';
export const MAX_LABEL_LENGTH = 16;
export const DEFAULT_PASSPHRASE_PROTECTION = true;
export const DEFAULT_SKIP_BACKUP = true;

export const DEFAULT_STRENGTH: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 256,
    [DeviceModelInternal.T2T1]: 128,
    [DeviceModelInternal.T2B1]: 128,
};

export const MAX_CHARACTERS_ON_SCREEN: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 81,
    [DeviceModelInternal.T2T1]: 81,
    [DeviceModelInternal.T2B1]: 71,
};

export const MAX_CHARACTERS_ON_ROW: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 21,
    [DeviceModelInternal.T2T1]: 17, // -1 for the space for the scrollbar (Trezor T only)
    [DeviceModelInternal.T2B1]: 18,
};

export const CHARACTER_OFFSET_FOR_ARROW: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 0, // Trezor One does not have prev-arrow, and only "..." is used for "next-arrow"
    [DeviceModelInternal.T2T1]: 4,
    [DeviceModelInternal.T2B1]: 1,
};
