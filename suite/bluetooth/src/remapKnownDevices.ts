import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';

type RemapKnownDevicesParams = {
    knownDevices: DesktopBluetoothDevice[];
    nearbyDevices: DesktopBluetoothDevice[];
};

/**
 * Reconciles saved Bluetooth devices with the latest device-list event.
 *
 * On linux and windows, when bluetooth adapter is turned off/on again, the paired
 * devices will get different `id`, but `address` will remain the same. Therefore, we have to remap the knownDevices to change the `id`.
 *
 * `connectionStatus` of the known devices is updated based on the nearby devices.
 */
export const remapKnownDevices = ({
    knownDevices,
    nearbyDevices,
}: RemapKnownDevicesParams): DesktopBluetoothDevice[] => {
    const nearbyDevicesById = new Map(nearbyDevices.map(device => [device.id, device]));

    return knownDevices.map(knownDevice => {
        const nearbyDeviceWithSameAddress = nearbyDevices.find(
            nearbyDevice =>
                nearbyDevice.macAddress === knownDevice.macAddress &&
                nearbyDevice.id !== knownDevice.id,
        );

        const nearbyDevice = nearbyDevicesById.get(
            nearbyDeviceWithSameAddress?.id ?? knownDevice.id,
        );

        return nearbyDevice
            ? {
                  ...knownDevice,
                  id: nearbyDevice.id,
                  connectionStatus: nearbyDevice.connectionStatus,
              }
            : knownDevice;
    });
};
