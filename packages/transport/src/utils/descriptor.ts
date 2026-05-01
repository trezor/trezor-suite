import type { UsbDeviceLike } from '../types/usbInterface';

/**
 * references: DeviceModelInternal, MODEL_BLE_CODE
 * DeviceModelInternal represented as number
 */
export enum DescriptorModel {
    UNKNOWN = 0,
    T1B1 = 1,
    T2T1 = 2,
    T2B1 = 3,
    T3B1 = 4,
    T3T1 = 5,
    T3W1 = 6,
}

export const getUSBDescriptorModel = (device: UsbDeviceLike): DescriptorModel => {
    if (device.deviceVersionMajor === 1) {
        return DescriptorModel.T1B1;
    }

    if (device.deviceVersionMajor === 2) {
        switch (device.productName) {
            case 'TREZOR':
                return DescriptorModel.T2T1;
            case 'Trezor Safe 3':
                return DescriptorModel.T3B1; // NOTE: this could be also T2B1
            case 'Trezor Safe 5':
                return DescriptorModel.T3T1;
            case 'Trezor Safe 7':
                return DescriptorModel.T3W1;
            default:
                return DescriptorModel.UNKNOWN;
        }
    }

    return DescriptorModel.UNKNOWN;
};

/**
 * Returns DescriptorModel from bluetooth Manufacturer Data [2] byte. see MODEL_BLE_CODE
 */
export const getBLEDescriptorModel = (data: number | undefined): DescriptorModel =>
    typeof data === 'number' && Object.values(DescriptorModel).includes(data)
        ? data
        : DescriptorModel.UNKNOWN;
