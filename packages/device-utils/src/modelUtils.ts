import { DeviceModelInternal } from '@trezor/connect';

export const getDeviceDisplayName = (deviceModelInternal?: DeviceModelInternal) => {
    switch (deviceModelInternal) {
        case DeviceModelInternal.T1B1:
            return 'Trezor Model One';
        case DeviceModelInternal.T2T1:
            return 'Trezor Model T';
        case DeviceModelInternal.T2B1:
            return 'Trezor Model R';
        default:
            return 'Trezor';
    }
};

export const pickByDeviceModel = <Type>(
    deviceModelInternal: DeviceModelInternal | undefined,
    options: {
        default: Type;
        [DeviceModelInternal.T1B1]?: Type;
        [DeviceModelInternal.T2T1]?: Type;
        [DeviceModelInternal.T2B1]?: Type;
    },
): Type => {
    if (!deviceModelInternal || typeof options[deviceModelInternal] === 'undefined') {
        return options.default;
    }

    return options[deviceModelInternal] ?? options.default;
};
