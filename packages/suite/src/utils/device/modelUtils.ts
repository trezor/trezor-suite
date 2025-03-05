import { DeviceModelInternal } from '@trezor/connect';

export const pickByDeviceModel = <Type>(
    deviceModelInternal: DeviceModelInternal | undefined,
    options: { default: Type } & Partial<Record<DeviceModelInternal, Type>>,
): Type => {
    if (!deviceModelInternal) {
        return options.default;
    }

    const valueForDevice = options[deviceModelInternal];

    return valueForDevice === undefined ? options.default : valueForDevice;
};
