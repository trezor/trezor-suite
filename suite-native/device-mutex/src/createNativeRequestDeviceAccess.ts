import { type RequestDeviceAccess } from '@suite-common/suite-types';

import { deviceAccessMutex } from './DeviceAccessMutex';
import { requestDeviceAccess } from './requestDeviceAccess';

const SKIPPED_RESULT = {
    success: false,
    error: 'Device access skipped - another task is already waiting for the device.',
    wasSkipped: true,
} as const;

/**
 * Device access on mobile: every call takes its turn on the device mutex.
 */
export const createNativeRequestDeviceAccess =
    (): RequestDeviceAccess => async (deviceCallback, options) => {
        // One waiting task is enough. A repeating caller would otherwise queue an attempt per tick
        // and keep the device busy long after it stopped asking.
        if (options?.priority === 'skipIfBusy' && deviceAccessMutex.taskQueue.length > 0) {
            return SKIPPED_RESULT;
        }

        const response = await requestDeviceAccess(
            deviceCallback,
            options?.priority === 'prioritized',
        );

        if (response.success) return response;

        // Anything the mutex reports is a genuine failure — a request that gives up on its own has
        // already returned above. Its error is whatever the device call threw, which the mutex
        // passes through untouched despite typing it as a string.
        const { error }: { error: unknown } = response;

        return {
            ...response,
            error: error instanceof Error ? error.message : String(error),
            wasSkipped: false,
        };
    };
