import { BluetoothDeviceCommon } from '@suite-common/bluetooth/src/types';

// MacOS && iOS does not provide a stable device ID for Bluetooth devices. Therefore, we need to
// remap known devices based on their name. If there are multiple devices with the same name,
// we keep only the most recently updated one.
export const filterOutOldDuplicatesByName = <T extends BluetoothDeviceCommon>(devices: T[]) =>
    devices.filter(device => {
        const duplicates = devices.filter(d => d.name === device.name);

        if (duplicates.length > 1) {
            const latest = duplicates.reduce((a, b) =>
                a.lastUpdatedTimestamp > b.lastUpdatedTimestamp ? a : b,
            );

            return device.id === latest.id;
        }

        return true;
    });
