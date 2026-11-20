import { DeviceModelInternal } from '@trezor/device-utils';

export const SUPPORTS_DEVICE_AUTHENTICITY_CHECK: Record<DeviceModelInternal, boolean> = {
    [DeviceModelInternal.UNKNOWN]: true, // We must require device authenticity check so it cannot be used as an exploit to bypass it.
    [DeviceModelInternal.T1B1]: false,
    [DeviceModelInternal.T2T1]: false,
    [DeviceModelInternal.T2B1]: true,
    [DeviceModelInternal.T3B1]: true,
    [DeviceModelInternal.T3T1]: true,
    [DeviceModelInternal.T3W1]: true,
};

// All products ship in a plastic wrap, but only some have it branded with the Trezor logo, which is what the manual device check instructs the user to verify.
export const HAS_BRANDED_PLASTIC_WRAP_PACKAGING: Record<DeviceModelInternal, boolean> = {
    // No need to fail closed: the check relies only on user input and is reversible, so avoiding confusion is more important.
    [DeviceModelInternal.UNKNOWN]: false,
    [DeviceModelInternal.T1B1]: false,
    [DeviceModelInternal.T2T1]: false,
    [DeviceModelInternal.T2B1]: false,
    [DeviceModelInternal.T3B1]: false,
    [DeviceModelInternal.T3T1]: false,
    [DeviceModelInternal.T3W1]: true,
};
