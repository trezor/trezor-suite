import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { fixLinuxManufacturerData } from './fixLinuxManufacturerData';

type RemapKnownDevicesParams = {
    knownDevices: DesktopBluetoothDevice[];
    nearbyDevices: DesktopBluetoothDevice[];
};

type RemapKnownDevicesResult = {
    knownDevices: DesktopBluetoothDevice[];
    nearbyDevices: DesktopBluetoothDevice[];
};

/**
 * Reconciles saved Bluetooth devices with the latest device-list event.
 *
 * On linux and windows, when bluetooth adapter is turned off/on again, the paired
 * devices will get different `id`, but `macAddress` will remain the same (on macOS it equals the `id`).
 * Therefore, we have to remap the knownDevices to change the `id`.
 *
 * Known devices found in the event take over its `id`, `connectionStatus`, `lastUpdatedTimestamp`, `rssi`
 * and `manufacturerData` (the saved one is kept when the model is `UNKNOWN`, only `filterPolicy` is taken).
 * The rest of the saved data (`name`, `deviceId`, ...) is kept.
 * Known devices missing in the event are returned untouched.
 * Both lists are returned together, because `nearbyDevices` contains the very same objects as `knownDevices`.
 * The order of the event is kept. Known devices that are not nearby are not added.
 */
export const remapKnownDevices = ({
    knownDevices,
    nearbyDevices,
}: RemapKnownDevicesParams): RemapKnownDevicesResult => {
    const nearbyDevicesById = new Map(nearbyDevices.map(device => [device.id, device]));

    const remappedKnownDevices = knownDevices.map(knownDevice => {
        const nearbyDeviceWithSameAddress = nearbyDevices.find(
            nearbyDevice =>
                nearbyDevice.macAddress === knownDevice.macAddress &&
                nearbyDevice.id !== knownDevice.id,
        );

        // The same address wins over the old id, which may still be listed next to the new one.
        const nearbyDevice = nearbyDevicesById.get(
            nearbyDeviceWithSameAddress?.id ?? knownDevice.id,
        );

        return nearbyDevice
            ? {
                  ...knownDevice,
                  id: nearbyDevice.id,
                  connectionStatus: nearbyDevice.connectionStatus,
                  lastUpdatedTimestamp: nearbyDevice.lastUpdatedTimestamp,
                  rssi: nearbyDevice.rssi,
                  manufacturerData: fixLinuxManufacturerData(nearbyDevice, knownDevice)
                      .manufacturerData,
              }
            : knownDevice;
    });

    const remappedKnownDevicesById = new Map(
        remappedKnownDevices.map(device => [device.id, device]),
    );

    return {
        knownDevices: remappedKnownDevices,
        nearbyDevices: nearbyDevices.map(
            nearbyDevice => remappedKnownDevicesById.get(nearbyDevice.id) ?? nearbyDevice,
        ),
    };
};
