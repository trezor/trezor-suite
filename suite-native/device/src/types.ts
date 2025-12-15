import { type DeviceModelInternal } from '@trezor/device-utils';

export type SetupSupportingDeviceModel = Exclude<
    DeviceModelInternal,
    DeviceModelInternal.T1B1 | DeviceModelInternal.UNKNOWN
>;
