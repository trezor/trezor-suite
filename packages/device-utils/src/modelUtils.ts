import { PartialDevice } from './types';

export enum DeviceModel {
    T1 = '1',
    TT = 'T',
    T2B1 = 'R',
    UNKNOWN = '',
}

export enum DeviceInternalModel {
    T1 = 'T1B1',
    TT = 'T2T1',
    T2B1 = 'T2B1',
    UNKNOWN = '',
}

export const getDeviceDisplayName = (deviceModel: DeviceModel) => {
    switch (deviceModel) {
        case DeviceModel.T1:
            return 'Trezor Model One';
        case DeviceModel.TT:
            return 'Trezor Model T';
        case DeviceModel.T2B1:
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
