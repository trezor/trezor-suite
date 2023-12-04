import { deviceAccessMutex } from './DeviceAccessMutex';
import { DEVICE_ACCESS_ERROR } from './constants';
import { DeviceAccessResponse } from './types';

/**
 * Puts the callback to the end of the queue and waits for its turn to execute.
 */
export const requestDeviceAccess = async <TParams extends unknown[], TReturnType>(
    deviceCallback: (...args: TParams) => TReturnType,
    ...callbackParams: TParams
): DeviceAccessResponse<TReturnType> => {
    const wasLockSuccessful = await deviceAccessMutex.lock();
    if (!wasLockSuccessful) return DEVICE_ACCESS_ERROR;

    const response = await deviceCallback(...callbackParams);
    deviceAccessMutex.unlock();

    return { success: true, payload: response };
};

/**
 * Puts the callback to the beginning of the queue to execute the callback with priority.
 */
export const requestPrioritizedDeviceAccess = async <TParams extends unknown[], TReturnType>(
    deviceCallback: (...args: TParams) => TReturnType,
    ...callbackParams: TParams
): DeviceAccessResponse<TReturnType> => {
    const wasLockSuccessful = await deviceAccessMutex.prioritizedLock();
    if (!wasLockSuccessful) return DEVICE_ACCESS_ERROR;

    const response = await deviceCallback(...callbackParams);
    deviceAccessMutex.unlock();

    return { success: true, payload: response };
};

export const clearAndUnlockDeviceAccessQueue = () => {
    deviceAccessMutex.clearQueue();
};
