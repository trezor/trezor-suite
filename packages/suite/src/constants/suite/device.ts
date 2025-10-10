import { DeviceModelInternal } from '@trezor/device-utils';

export const MAX_LABEL_LENGTH = 16;
export const DEFAULT_PASSPHRASE_PROTECTION = false;
export const DEFAULT_SKIP_BACKUP = true;

export const DEFAULT_STRENGTH: Record<DeviceModelInternal, number> = {
    [DeviceModelInternal.UNKNOWN]: 128, // just to have something
    [DeviceModelInternal.T1B1]: 256,
    [DeviceModelInternal.T2T1]: 128,
    [DeviceModelInternal.T2B1]: 128,
    [DeviceModelInternal.T3B1]: 128,
    [DeviceModelInternal.T3T1]: 128,
    [DeviceModelInternal.T3W1]: 128,
};

export const HAS_MONOCHROME_SCREEN: Record<DeviceModelInternal, boolean> = {
    [DeviceModelInternal.UNKNOWN]: false, // just to have something
    [DeviceModelInternal.T1B1]: true,
    [DeviceModelInternal.T2T1]: false,
    [DeviceModelInternal.T2B1]: true,
    [DeviceModelInternal.T3B1]: true,
    [DeviceModelInternal.T3T1]: false,
    [DeviceModelInternal.T3W1]: false,
};
