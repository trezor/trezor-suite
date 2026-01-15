import { Dispatch } from '@reduxjs/toolkit';

import { TurnOnSuiteSync } from '@suite-common/suite-sync-types';
import { EnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types/src/storage/ensureWalletSuiteSyncOn';
import { selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';
import { isSuiteSyncSupportedByDevice } from './suiteSyncUtils';

export type CreateTurnOnSuiteSyncDeps = {
    getState: () => any;
    dispatch: Dispatch;
} & EnsureWalletSuiteSyncOnDep;

export const createTurnOnSuiteSync =
    (deps: CreateTurnOnSuiteSyncDeps): TurnOnSuiteSync =>
    async ({ onError }) => {
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(deps.getState());

        if (isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: true }));

        // Turn on and subscribe labeling for all wallets.
        const devices = selectDevices(deps.getState());

        for (const device of devices) {
            if (device?.state?.staticSessionId) {
                const canTurnOnSuiteSync =
                    isTrezorDeviceWithState(device) && isSuiteSyncSupportedByDevice(device);

                if (!canTurnOnSuiteSync) {
                    continue;
                }

                const result = await deps.ensureWalletSuiteSyncOn({
                    deviceStaticSessionId: device.state.staticSessionId,
                });

                if (!result.success) {
                    onError({
                        deviceStaticSessionId: device.state.staticSessionId,
                        error: result.error,
                    });
                }
            }
        }
    };
