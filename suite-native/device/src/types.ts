import { DeviceModelInternal } from '@trezor/device-utils';

export type SetupSupportingDeviceModel = Exclude<
    DeviceModelInternal,
    DeviceModelInternal.T1B1 | DeviceModelInternal.T3W1 | DeviceModelInternal.UNKNOWN
>;

export type WalletBackupType = 'shamir-single' | 'shamir-advanced' | '12-words' | '24-words';
