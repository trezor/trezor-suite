import { DeviceModelInternal } from '@trezor/connect';

// Firmware does not have support for address chunking, so the address is always displayed as one continuous line.
export type PaginationCompatibleDeviceModel = Exclude<
    DeviceModelInternal,
    DeviceModelInternal.T1B1
>;

export type DevicePaginationActivePage = 1 | 2;

export function isPaginationCompatibleDeviceModel(
    value: any,
): value is PaginationCompatibleDeviceModel {
    return value && (value === DeviceModelInternal.T2B1 || value === DeviceModelInternal.T2T1);
}
