import { DeviceModelInternal } from '@trezor/connect';

export const DEFAULT_FLAGSHIP_MODEL = DeviceModelInternal.T3T1;

export const SUPPORTS_DEVICE_AUTHENTICITY_CHECK: Record<DeviceModelInternal, boolean> = {
    [DeviceModelInternal.UNKNOWN]: true, // We must require device authenticity check so it cannot be used as and exploit to bypass it
    [DeviceModelInternal.T1B1]: false,
    [DeviceModelInternal.T2T1]: false,
    [DeviceModelInternal.T2B1]: true,
    [DeviceModelInternal.T3B1]: true,
    [DeviceModelInternal.T3T1]: true,
    [DeviceModelInternal.T3W1]: true,
};
