import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';

type RemapKnownDevicesForLinuxAndWindowsParams = {
    knownDevices: DesktopBluetoothDevice[];
    nearbyDevices: DesktopBluetoothDevice[];
};

/**
 * On linux and windows, when bluetooth adapter is turned off/on again, the paired
 * devices will get different `id`, but `address` will remain the same.
 *
 * Therefore, we have to remap the knownDevices to change the `id`.
 */
export const remapKnownDevicesForLinuxAndWindows = ({
    knownDevices,
    nearbyDevices,
}: RemapKnownDevicesForLinuxAndWindowsParams): DesktopBluetoothDevice[] =>
    knownDevices.map(knownDevice => {
        const nearbyDeviceWithSameAddress = nearbyDevices.find(
            nearbyDevice =>
                nearbyDevice.macAddress === knownDevice.macAddress &&
                nearbyDevice.id !== knownDevice.id,
        );

        return nearbyDeviceWithSameAddress
            ? { ...knownDevice, id: nearbyDeviceWithSameAddress.id }
            : knownDevice;
    });
