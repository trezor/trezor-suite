import type { StakingDeviceAccess } from '@suite-common/earn-staking';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect';

export type NativeStakingDeviceAccessDeps = GetTrezorConnectPrivilegedDep;

// A queued callback has not reached the device yet, so a cancel while it waits would abort
// whatever operation holds the device; the callback ends itself once it runs.
export const createNativeStakingDeviceAccess = (
    deps: NativeStakingDeviceAccessDeps,
): StakingDeviceAccess => {
    let isDeviceCallRunning = false;

    return {
        run: async callback => {
            const result = await requestPrioritizedDeviceAccess(async () => {
                isDeviceCallRunning = true;

                try {
                    return await callback();
                } finally {
                    isDeviceCallRunning = false;
                }
            });

            if (!result.success) {
                const failure: unknown = result.error;

                throw failure instanceof Error ? failure : new Error(result.error);
            }

            return result.payload;
        },
        cancel: reason => {
            if (!isDeviceCallRunning) return;

            deps.getTrezorConnect().cancel({ reason });
        },
    };
};
