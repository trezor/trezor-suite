import { ImageKey } from '@trezor/components';
import { DeviceModelInternal, models } from '@trezor/device-utils';

export const getModelFrontColor = (
    deviceModelInternal?: DeviceModelInternal,
    deviceUnitColor?: number,
): number =>
    Number(
        (deviceModelInternal && models[deviceModelInternal].frontColors?.[`${deviceUnitColor}`]) ??
            1,
    );

export const getLargeModelImagePath = (
    deviceModelInternal?: DeviceModelInternal,
    deviceUnitColor?: number,
): ImageKey => {
    const frontColor = getModelFrontColor(deviceModelInternal, deviceUnitColor);

    return `TREZOR_${deviceModelInternal}${frontColor === 1 ? '' : `_FRONTCOLOR_${frontColor}`}_LARGE` as ImageKey;
};
