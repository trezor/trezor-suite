import { BluetoothDevice } from '@trezor/transport-bluetooth';

type RemapKnownDevicesForLinuxParams = {
    knownDevices: BluetoothDevice[];
    nearbyDevices: BluetoothDevice[];
};

/**
 * On linux, when bluetooth adapter is turned off/on again, the paired
 * devices will get different `id`, but `address` will remain the same.
 *
 * Therefore, we have to remap the knownDevices to change the `id`.
 */
export const remapKnownDevicesForLinux = ({
    knownDevices,
    nearbyDevices,
}: RemapKnownDevicesForLinuxParams): BluetoothDevice[] =>
    knownDevices.map(knownDevice => {
        const nearbyDeviceWithSameAddress = nearbyDevices.find(
            nearbyDevice =>
                nearbyDevice.address === knownDevice.address && nearbyDevice.id !== knownDevice.id,
        );

        return nearbyDeviceWithSameAddress
            ? { ...knownDevice, id: nearbyDeviceWithSameAddress.id }
            : knownDevice;
    });
