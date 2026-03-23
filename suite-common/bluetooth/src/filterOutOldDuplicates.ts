import { type BluetoothDeviceCommon } from './types';

// There is a UX need to remap devices that are in pairing mode and emit more than once
// we do this by filtering out duplicates by name, color and model
export const filterOutOldDuplicates = <T extends BluetoothDeviceCommon>(devices: T[]) =>
    devices.filter(device => {
        if (device.manufacturerData.filterPolicy?.pairing !== true) return true;

        const hasNewerDuplicate = devices.some(
            d =>
                d.id !== device.id &&
                d.name === device.name &&
                d.manufacturerData.deviceColor === device.manufacturerData.deviceColor &&
                d.manufacturerData.deviceModel === device.manufacturerData.deviceModel &&
                d.lastUpdatedTimestamp > device.lastUpdatedTimestamp,
        );

        return !hasNewerDuplicate;
    });
