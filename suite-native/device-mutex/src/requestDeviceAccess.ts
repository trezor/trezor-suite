import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { v4 as uuidv4 } from 'uuid';

import { deviceAccessMutex } from './DeviceAccessMutex';
import { DEVICE_ACCESS_ERROR } from './constants';
import { type DeviceAccessResponse } from './types';

/**
 * Puts the callback to the end of the queue and waits for its turn to execute.
 */
export const requestDeviceAccess = async <TReturnType>(
    deviceCallback: () => TReturnType,
    isPrioritized?: boolean,
): DeviceAccessResponse<TReturnType> => {
    const wasLockSuccessful = await (isPrioritized
        ? deviceAccessMutex.prioritizedLock()
        : deviceAccessMutex.lock());
    if (!wasLockSuccessful) return DEVICE_ACCESS_ERROR;

    const keepAwakeTag = uuidv4();

    try {
        activateKeepAwakeAsync(keepAwakeTag); // Prevents screen from sleeping while app interacts with device.
        const response = await deviceCallback();
        deviceAccessMutex.unlock();

        return { success: true, payload: response };
    } catch (error) {
        deviceAccessMutex.unlock();

        return { success: false, error };
    } finally {
        deactivateKeepAwake(keepAwakeTag);
    }
};

/**
 * Puts the callback to the beginning of the queue to execute the callback with priority.
 */
export const requestPrioritizedDeviceAccess = <TReturnType>(
    deviceCallback: () => TReturnType,
): DeviceAccessResponse<TReturnType> => requestDeviceAccess(deviceCallback, true);

export const clearAndUnlockDeviceAccessQueue = () => {
    deviceAccessMutex.clearQueue();
};
