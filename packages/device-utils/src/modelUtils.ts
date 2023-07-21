import { DeviceModelInternal } from '@trezor/connect';

import { PartialDevice } from './types';

export enum DeviceModel {
    T1 = '1',
    TT = 'T',
    T2B1 = 'R',
    UNKNOWN = '',
}

export const getDeviceDisplayName = (deviceModelInternal?: DeviceModelInternal) => {
    switch (deviceModelInternal) {
        case DeviceModelInternal.T1B1:
            return 'Trezor Model One';
        case DeviceModelInternal.T2T1:
            return 'Trezor Model T';
        case DeviceModelInternal.T2B1:
            return 'Trezor Model R';
        default:
            console.error('Unknown Trezor device');
            return 'Trezor';
    }
};

export const getDeviceModel = (device?: PartialDevice): DeviceModel => {
    const deviceModel = device?.features?.model;

    if (Object.values(DeviceModel).includes(deviceModel as DeviceModel)) {
        return deviceModel as DeviceModel;
    }

    return DeviceModel.UNKNOWN;
};

export const pickByDeviceModel = <Type>(
    deviceModel: DeviceModel | undefined,
    options: {
        default: Type;
        [DeviceModel.T1]?: Type;
        [DeviceModel.TT]?: Type;
        [DeviceModel.T2B1]?: Type;
    },
): Type => {
    if (!deviceModel || typeof options[deviceModel] === 'undefined') {
        return options.default;
    }

    return options[deviceModel] ?? options.default;
};
