import type { StakingDeviceAccess } from '@suite-common/earn-staking';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect';

export type NativeStakingDeviceAccessDeps = GetTrezorConnectPrivilegedDep;

export const createNativeStakingDeviceAccess = (
    deps: NativeStakingDeviceAccessDeps,
): StakingDeviceAccess => ({
    run: async callback => {
        const result = await requestPrioritizedDeviceAccess(callback);

        if (!result.success) {
            const failure: unknown = result.error;

            throw failure instanceof Error ? failure : new Error(result.error);
        }

        return result.payload;
    },
    cancel: reason => {
        deps.getTrezorConnect().cancel({ reason });
    },
});
