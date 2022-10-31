import { PartialDevice } from './types';

export const getDeviceModel = (device: PartialDevice): 'T' | '1' => {
    const { features } = device;
    return typeof features?.major_version === 'number' && features?.major_version > 1 ? 'T' : '1';
};
