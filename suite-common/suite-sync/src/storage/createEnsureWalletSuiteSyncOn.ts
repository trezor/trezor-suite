import {
    type DeviceRootState,
    isTrezorDeviceWithState,
    selectDeviceByStaticSessionId,
} from '@suite-common/device';
import {
    type EnsureSubscribedStorageDep,
    type EnsureSuiteSyncKeysDep,
    type EnsureWalletSuiteSyncOn,
    type OnStorageEnsuredDep,
    type SubscriptionStorageDep,
} from '@suite-common/suite-sync-types';
import { err } from '@trezor/type-utils';

import { isFwUpgradeNeededForSuiteSync, isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

export type EnsureWalletSuiteSyncOnDeps = {
    getState: () => DeviceRootState;
} & EnsureSubscribedStorageDep &
    EnsureSuiteSyncKeysDep &
    SubscriptionStorageDep &
    OnStorageEnsuredDep;

/**
 * Responsibility:
 * - Run top-level eligibility checks before starting Suite Sync for a wallet.
 */
export const createEnsureWalletSuiteSyncOn =
    (deps: EnsureWalletSuiteSyncOnDeps): EnsureWalletSuiteSyncOn =>
    async ({ deviceStaticSessionId, isWriteMode }) => {
        const device = selectDeviceByStaticSessionId(deps.getState(), deviceStaticSessionId);

        if (isFwUpgradeNeededForSuiteSync(device)) {
            return err({ type: 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType' });
        }

        const canTurnOnSuiteSync =
            device && isTrezorDeviceWithState(device) && isSuiteSyncSupportedByDevice(device);

        if (!canTurnOnSuiteSync) {
            return err({ type: 'SuiteSyncUnavailableOnDeviceError' });
        }

        const result = await deps.ensureSubscribedStorage({ deviceStaticSessionId, isWriteMode });

        if (!result.success) {
            return result;
        }

        await deps.onStorageEnsured({
            deviceStaticSessionId,
            isWriteMode,
            storage: result.payload,
        });

        return result;
    };
