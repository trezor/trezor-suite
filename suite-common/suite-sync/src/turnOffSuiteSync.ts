import { TurnOfSuiteSync, UnsubscribeSuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

type CreateTurnOffSuiteSyncDeps = {
    getState: () => any;
    unsubscribeSuiteSyncStorage: UnsubscribeSuiteSyncStorage;
};

export const createTurnOffSuiteSync =
    (deps: CreateTurnOffSuiteSyncDeps): TurnOfSuiteSync =>
    async () => {
        // Intentionally `isSuiteSyncEnabled` check, as dispose will happen when the flag may be already off,
        // but we want to unsubscribe anyway

        const devices = selectDevices(deps.getState()) ?? [];

        await Promise.all(
            devices
                .filter(isTrezorDeviceWithState)
                .map(device => deps.unsubscribeSuiteSyncStorage({ device })),
        );
    };
