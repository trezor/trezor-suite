import { DeviceModelInternal } from '@trezor/device-utils';

import type { DesktopBluetoothDevice } from './DesktopBluetoothDevice';

/**
 * Fixes manufacturer data on Linux where adapter reconnection
 * can cause device model to become UNKNOWN
 */
export const fixLinuxManufacturerData = (
    device: DesktopBluetoothDevice,
    knownDevice: DesktopBluetoothDevice | undefined,
): DesktopBluetoothDevice => {
    if (knownDevice && device.manufacturerData.deviceModel === DeviceModelInternal.UNKNOWN) {
        return {
            ...device,
            manufacturerData: {
                ...knownDevice.manufacturerData,
                filterPolicy: device.manufacturerData?.filterPolicy,
            },
        };
    }

    return device;
};
