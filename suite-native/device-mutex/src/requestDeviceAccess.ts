import { deviceAccessMutex } from './DeviceAccessMutex';
import { DEVICE_ACCESS_ERROR } from './constants';
import { DeviceAccessResponse } from './types';

/**
 * Puts the callback to the end of the queue and waits for its turn to execute.
 */
export const requestDeviceAccess = async <TParams extends unknown[], TReturnType>({
    deviceCallback,
    isPrioritized = false,
    callbackParams = [] as unknown as TParams,
}: {
    deviceCallback: (...args: TParams) => TReturnType;
    isPrioritized?: boolean;
    callbackParams?: TParams;
}): DeviceAccessResponse<TReturnType> => {
    const wasLockSuccessful = await (isPrioritized
        ? deviceAccessMutex.prioritizedLock()
        : deviceAccessMutex.lock());
    if (!wasLockSuccessful) return DEVICE_ACCESS_ERROR;

    try {
        const response = await deviceCallback(...callbackParams);
        deviceAccessMutex.unlock();

        return { success: true, payload: response };
    } catch (error) {
        deviceAccessMutex.unlock();

        return { success: false, error };
    }
};

/**
 * Puts the callback to the beginning of the queue to execute the callback with priority.
 */
export const requestPrioritizedDeviceAccess = <TParams extends unknown[], TReturnType>({
    deviceCallback,
    callbackParams = [] as unknown as TParams,
}: {
    deviceCallback: (...args: TParams) => TReturnType;
    callbackParams?: TParams;
}) => requestDeviceAccess({ deviceCallback, isPrioritized: true, callbackParams });

export const clearAndUnlockDeviceAccessQueue = () => {
    deviceAccessMutex.clearQueue();
};
