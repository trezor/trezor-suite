import { DeviceModelInternal } from '@trezor/connect';

export const pickByDeviceModel = <Type>(
    deviceModelInternal: DeviceModelInternal | undefined,
    options: { default: Type } & Partial<Record<DeviceModelInternal, Type>>,
): Type => {
    if (!deviceModelInternal || typeof options[deviceModelInternal] === 'undefined') {
        return options.default;
    }

    return options[deviceModelInternal] ?? options.default;
};
