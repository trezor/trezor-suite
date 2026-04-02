import { type Dispatch } from '@reduxjs/toolkit';

import { createEnsureQuota } from './createEnsureQuota';
import { type GetDeviceForStaticSessionIdDep } from './getDeviceForStaticSessionId';
import { type GetDeviceHasAllowance } from './getDeviceHasAllowance';
import { type GetIsUsingTrezorRelayDep } from './getIsDefaultRelayUrlSet';
import { type GetIsQuotaManagerEnabled } from './getIsQuotaManagerEnabled';
import { type GetOwnerHasAllowance } from './getOwnerHasAllowance';
import {
    type WithSuiteSyncQuotaManagerState,
    selectEnforceQuotaManager,
    selectHasDeviceAllowance,
    selectHasOwnerAllowance,
} from './quotaManagerSelectors';

type CreateSuiteSyncQuotaManagerCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => WithSuiteSyncQuotaManagerState;
} & GetDeviceForStaticSessionIdDep &
    GetIsUsingTrezorRelayDep;

export const createSuiteSyncQuotaManagerCompositionRoot = (
    deps: CreateSuiteSyncQuotaManagerCompositionRootDeps,
) => {
    // We only want to use QM for our own relay servers. In case custom URL has been set, QM is ignored,
    // unless enforceQuotaManager is set (used for e2e tests with a local relay).
    const getIsQuotaManagerEnabled: GetIsQuotaManagerEnabled = () =>
        deps.getIsUsingTrezorRelay() || selectEnforceQuotaManager(deps.getState());

    const getDeviceHasAllowance: GetDeviceHasAllowance = (deviceId, walletDescriptor) =>
        !getIsQuotaManagerEnabled() ||
        selectHasDeviceAllowance(deps.getState(), deviceId, walletDescriptor);

    const getOwnerHasAllowance: GetOwnerHasAllowance = walletDescriptor =>
        !getIsQuotaManagerEnabled() || selectHasOwnerAllowance(deps.getState(), walletDescriptor);

    const ensureQuota = createEnsureQuota({
        dispatch: deps.dispatch,
        getDeviceForStaticSessionId: deps.getDeviceForStaticSessionId,
        getDeviceHasAllowance,
    });

    return {
        ensureQuota,
        getDeviceHasAllowance,
        getOwnerHasAllowance,
    };
};
