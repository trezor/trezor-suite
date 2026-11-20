import {
    type RunStakingDeviceCall,
    type StakingDeviceAccess,
    createStakingDeviceAccess,
} from '@suite-common/earn-staking';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect';

export type NativeStakingDeviceAccessDeps = GetTrezorConnectPrivilegedDep;

const runWithDeviceMutex: RunStakingDeviceCall = async callback => {
    const result = await requestPrioritizedDeviceAccess(callback);

    if (!result.success) {
        const failure: unknown = result.error;

        throw failure instanceof Error ? failure : new Error(result.error);
    }

    return result.payload;
};

export const createNativeStakingDeviceAccess = (
    deps: NativeStakingDeviceAccessDeps,
): StakingDeviceAccess =>
    createStakingDeviceAccess({
        getTrezorConnect: deps.getTrezorConnect,
        runStakingDeviceCall: runWithDeviceMutex,
    });
