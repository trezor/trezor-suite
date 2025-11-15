import { PersistentDeviceData } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/device-utils';

// This file is intentionally not reexported in index.ts, so that bundler won't have to import.

// TODO some mocks from @suite-common/test-utils should be moved to this file

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
};
