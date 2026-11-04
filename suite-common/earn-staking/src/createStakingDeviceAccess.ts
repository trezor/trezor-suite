import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect-common';

export const STAKING_DEVICE_ACCESS_CANCEL_REASONS = ['tx-cancelled', 'tx-timeout'] as const;

export type StakingDeviceAccessCancelReason = (typeof STAKING_DEVICE_ACCESS_CANCEL_REASONS)[number];

export type StakingDeviceAccessDeps = GetTrezorConnectPrivilegedDep;

/** @serviceContract */
export type StakingDeviceAccess = {
    run: <T>(callback: () => Promise<T>) => Promise<T>;
    cancel: (reason: StakingDeviceAccessCancelReason) => void;
};

export const createStakingDeviceAccess = (deps: StakingDeviceAccessDeps): StakingDeviceAccess => {
    let isDeviceCallRunning = false;

    return {
        run: async callback => {
            isDeviceCallRunning = true;

            try {
                return await callback();
            } finally {
                isDeviceCallRunning = false;
            }
        },
        cancel: reason => {
            if (!isDeviceCallRunning) return;

            deps.getTrezorConnect().cancel({ reason });
        },
    };
};
