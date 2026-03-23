import { type ImageKey } from '@trezor/components';
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
    const deviceName =
        deviceModelInternal === DeviceModelInternal.T2B1 ? 'T3B1' : deviceModelInternal;

    return `TREZOR_${deviceName}${String(frontColor) === '1' ? '' : `_FRONTCOLOR_${frontColor}`}_LARGE` as ImageKey;
};
