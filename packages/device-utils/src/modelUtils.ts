import { PartialDevice } from './types';

export enum DeviceModel {
    T1 = '1',
    TT = 'T',
    T2B1 = 'R',
    UNKNOWN = '',
}

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
