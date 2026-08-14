import { type Getter } from '@suite-common/dependency-injection';
import { type RequestDeviceAccess } from '@suite-common/suite-types';

type DesktopRequestDeviceAccessDeps = {
    getIsDeviceLocked: Getter<[], boolean>;
};

/**
 * Device access on desktop and web (both run this composition root): calls are not queued, the
 * device lock only says whether one is already running. `prioritized` and `default` therefore
 * behave the same — there is nothing to order — and only `skipIfBusy` observes the lock.
 */
export const createDesktopRequestDeviceAccess =
    ({ getIsDeviceLocked }: DesktopRequestDeviceAccessDeps): RequestDeviceAccess =>
    async (deviceCallback, options) => {
        if (options?.priority === 'skipIfBusy' && getIsDeviceLocked()) {
            return {
                success: false,
                error: 'Device access skipped - the device is locked by another call.',
                wasSkipped: true,
            };
        }

        try {
            return { success: true, payload: await deviceCallback() };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                wasSkipped: false,
            };
        }
    };
