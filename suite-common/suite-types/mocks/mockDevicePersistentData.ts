import { DeviceModelInternal } from '@trezor/device-utils';

import type { PersistentDeviceData } from '../src';

export const defaultDevicePersistentData: PersistentDeviceData = {
    device_id: 'device-id',
    internal_model: DeviceModelInternal.UNKNOWN,
    fw_vendor: null,
    revision: null,
    label: null,
    initialized: null,
    firmwareVersion: null,
    lastConnectedVia: null,
    delegatedIdentityKey: null,
    manualCheckResult: { success: true },
};
