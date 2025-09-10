import { DeviceModelInternal, models } from '@trezor/device-utils';
import { ImageKey } from '@trezor/components';

export const getModelFrontColor = (
    deviceModelInternal?: DeviceModelInternal,
    deviceUnitColor?: number,
) => (deviceModelInternal && models[deviceModelInternal].frontColors?.[`${deviceUnitColor}`]) ?? 1;

export const getLargeModelImagePath = (
    deviceModelInternal?: DeviceModelInternal,
    deviceUnitColor?: number,
) => {
    const frontColor = getModelFrontColor(deviceModelInternal, deviceUnitColor);

    return `TREZOR_${deviceModelInternal}${frontColor === 1 ? '' : `_FRONTCOLOR_${frontColor}`}_LARGE` as ImageKey;
};
