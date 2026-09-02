import type { BluetoothFilterPolicy, BluetoothManufacturerData } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { fixLinuxManufacturerData } from './fixLinuxManufacturerData';
import { mockDesktopBluetoothDevice } from '../../../mocks/mockDesktopBluetoothDevice';

const mockedFilterPolicy: BluetoothFilterPolicy = {
    pairing: true,
    bond_memory_full: true,
    connected: false,
    user_disconnected: false,
};

const mockedManufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T2T1,
    deviceColor: 1,
    filterPolicy: mockedFilterPolicy,
};

describe('fixLinuxManufacturerData', () => {
    const mockKnownDevice = mockDesktopBluetoothDevice({
        id: asBluetoothDeviceId('1'),
        manufacturerData: mockedManufacturerData,
    });
    it('should preserve known device manufacturer data when device model is UNKNOWN', () => {
        const deviceWithUnknownModel = mockDesktopBluetoothDevice({
            ...mockKnownDevice,
            manufacturerData: {
                deviceModel: DeviceModelInternal.UNKNOWN,
                deviceColor: 5,
                filterPolicy: mockedFilterPolicy,
            },
        });

        const result = fixLinuxManufacturerData(deviceWithUnknownModel, mockKnownDevice);

        expect(result.manufacturerData).toEqual(mockedManufacturerData);
    });

    it('should return device unchanged when model is not UNKNOWN', () => {
        const deviceWithValidModel = mockDesktopBluetoothDevice({
            ...mockKnownDevice,
            manufacturerData: {
                deviceModel: DeviceModelInternal.T2T1,
                deviceColor: 2,
                filterPolicy: mockedFilterPolicy,
            },
        });

        const result = fixLinuxManufacturerData(deviceWithValidModel, mockKnownDevice);

        expect(result).toBe(deviceWithValidModel);
    });

    it('should return device unchanged when no known device exists', () => {
        const device = mockKnownDevice;
        const result = fixLinuxManufacturerData(device, undefined);

        expect(result).toBe(device);
    });
});
