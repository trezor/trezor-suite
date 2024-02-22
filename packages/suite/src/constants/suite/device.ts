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

export const MAX_ROWS_PER_PAGE: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 4,
    [DeviceModelInternal.T2T1]: 5,
    [DeviceModelInternal.T2B1]: 4,
};

export const MAX_CHARACTERS_ON_ROW: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 21,
    [DeviceModelInternal.T2T1]: 17, // -1 for the space for the scrollbar (Trezor T only)
    [DeviceModelInternal.T2B1]: 18,
};

export const CHARACTER_OFFSET_FOR_CONTINUES_ARROW: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 3,
    [DeviceModelInternal.T2T1]: 4,
    [DeviceModelInternal.T2B1]: 2,
};

export const CHARACTER_OFFSET_FOR_NEXT_ARROW: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.T1B1]: 0,
    [DeviceModelInternal.T2T1]: 4,
    [DeviceModelInternal.T2B1]: 2,
};
