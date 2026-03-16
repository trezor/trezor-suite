import { isTrezorDeviceWithState, selectDeviceByStaticSessionId } from '@suite-common/device';
import {
    type EnsureWalletSuiteSyncOn,
    type RefreshSuiteSyncKeysDep,
    type SubscribeSuiteSyncDataDep,
    type SubscriptionStorageDep,
} from '@suite-common/suite-sync-types';
import { err } from '@trezor/type-utils';

import { isFwUpgradeNeededForSuiteSync, isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

export type EnsureWalletSuiteSyncOnDeps = {
    getState: () => any;
} & SubscribeSuiteSyncDataDep &
    RefreshSuiteSyncKeysDep &
    SubscriptionStorageDep;

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

        return await deps.ensureSuiteSyncData({
            deviceStaticSessionId,
            isWriteMode,
        });
    };
