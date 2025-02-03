import { DeviceModelInternal } from '@trezor/connect';

export type SetupSupportingDeviceModel = Exclude<
    DeviceModelInternal,
    | DeviceModelInternal.T1B1
    | DeviceModelInternal.T2T1
    | DeviceModelInternal.T3W1
    | DeviceModelInternal.UNKNOWN
>;
