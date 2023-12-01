import { deviceAccessMutex } from './DeviceAccessMutex';

/**
 * Puts the callback to the end of the queue and waits for its turn to execute.
 */
export const requestDeviceAccess = async <TParams extends unknown[], TReturnType>(
    deviceCallback: (...args: TParams) => TReturnType,
    ...callbackParams: TParams
): Promise<TReturnType> => {
    await deviceAccessMutex.lock();
    const response = await deviceCallback(...callbackParams);
    deviceAccessMutex.unlock();

    return response;
};

/**
 * Puts the callback to the beginning of the queue to execute the callback with priority.
 */
export const requestPrioritizedDeviceAccess = async <TParams extends unknown[], TReturnType>(
    deviceCallback: (...args: TParams) => TReturnType,
    ...callbackParams: TParams
): Promise<TReturnType> => {
    await deviceAccessMutex.prioritizedLock();
    const response = await deviceCallback(...callbackParams);
    deviceAccessMutex.unlock();

    return response;
};

export const clearAndUnlockDeviceAccessQueue = () => {
    deviceAccessMutex.clearQueue();
};
