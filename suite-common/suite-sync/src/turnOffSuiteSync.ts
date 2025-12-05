import { selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';

export type TurnOffSuiteSync = () => Promise<void>;

export type TurnOffSuiteSyncDep = { turnOffSuiteSync: TurnOffSuiteSync };

type CreateTurnOffSuiteSyncDeps = {
    getState: () => any;
} & TurnOffSuiteSyncForWalletDep;

export const createTurnOffSuiteSync =
    (deps: CreateTurnOffSuiteSyncDeps): TurnOffSuiteSync =>
    async () => {
        // Intentionally `isSuiteSyncEnabled` check, as dispose will happen when the flag may be already off,
        // but we want to unsubscribe anyway

        const devices = selectDevices(deps.getState()) ?? [];

        await Promise.all(
            devices
                .filter(isTrezorDeviceWithState)
                .map(device => deps.turnOffSuiteSyncForWallet({ device })),
        );
    };
