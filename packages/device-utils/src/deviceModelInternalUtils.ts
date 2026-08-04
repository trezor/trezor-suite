import { DeviceModelInternal } from './deviceModelInternal';

type NarrowedDeviceModelInternal<T extends DeviceModelInternal> = T extends DeviceModelInternal.T2B1
    ? DeviceModelInternal.T3B1
    : T;

/**
 * Returns DeviceModelInternal, but returns T3B1 if T2B1 is provided.
 * This is desirable because they both represent the same model (differing internally in the chip) and should behave the same in most situations,
 * so we don't need to provide separate assets, translations keys, URLs etc. for both.
 */
export const getNarrowedDeviceModelInternal = <T extends DeviceModelInternal>(
    model: T,
): NarrowedDeviceModelInternal<T> =>
    (model === DeviceModelInternal.T2B1
        ? DeviceModelInternal.T3B1
        : model) as unknown as NarrowedDeviceModelInternal<T>;
