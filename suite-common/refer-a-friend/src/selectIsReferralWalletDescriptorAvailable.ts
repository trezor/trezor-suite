import {
    type DeviceRootState,
    selectStandardWalletDescriptorByDeviceId,
} from '@suite-common/device';

// This could be in suite-common/device, but the selector name and location intentionally carries semantics for Refer a Friend.
export const selectIsReferralWalletDescriptorAvailable = (
    state: DeviceRootState,
    deviceId: string | undefined,
): boolean => selectStandardWalletDescriptorByDeviceId(state, deviceId) !== null;
