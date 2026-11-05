import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect-common';

export const STAKING_DEVICE_ACCESS_CANCEL_REASONS = ['tx-cancelled', 'tx-timeout'] as const;

export type StakingDeviceAccessCancelReason = (typeof STAKING_DEVICE_ACCESS_CANCEL_REASONS)[number];

export type RunStakingDeviceCall = <T>(callback: () => Promise<T>) => Promise<T>;

export type StakingDeviceAccessDeps = GetTrezorConnectPrivilegedDep & {
    runStakingDeviceCall: RunStakingDeviceCall;
};

/** @serviceContract */
export type StakingDeviceAccess = {
    run: <T>(attemptId: string, callback: () => Promise<T>) => Promise<T>;
    cancel: (attemptId: string, reason: StakingDeviceAccessCancelReason) => void;
};

// A cancel reaches Connect only for the attempt whose callback is on
// the device: a queued callback would abort whatever holds the device,
// and an earlier attempt that finishes late must not hide a newer one.
export const createStakingDeviceAccess = (deps: StakingDeviceAccessDeps): StakingDeviceAccess => {
    let deviceAttemptId: string | null = null;

    return {
        run: (attemptId, callback) =>
            deps.runStakingDeviceCall(async () => {
                deviceAttemptId = attemptId;

                try {
                    return await callback();
                } finally {
                    if (deviceAttemptId === attemptId) {
                        deviceAttemptId = null;
                    }
                }
            }),
        cancel: (attemptId, reason) => {
            if (deviceAttemptId !== attemptId) return;

            deps.getTrezorConnect().cancel({ reason });
        },
    };
};
