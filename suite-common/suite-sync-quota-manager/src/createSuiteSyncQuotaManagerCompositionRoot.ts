import { type Dispatch } from '@reduxjs/toolkit';

import { type DeviceRootState } from '@suite-common/device';
import { type GetIsTorEnabledDep } from '@suite-common/suite-sync-types';
import { type TrezorConnectCallable } from '@trezor/connect';

import { createPrepareChallengeSessionFetch } from './challenge/createPrepareChallengeSessionFetch';
import { createEnsureQuota } from './createEnsureQuota';
import { createCheckStorageByPublicKeyFetch } from './device/createCheckStorageByPublicKeyFetch';
import { createEnsureDeviceHasQuota } from './device/createEnsureDeviceHasQuota';
import { createRegisterDevice } from './device/createRegisterDevice';
import { createRegisterDeviceFetch } from './device/createRegisterDeviceFetch';
import { type GetDeviceForStaticSessionIdDep } from './device/getDeviceForStaticSessionId';
import { type GetHasDeviceRegisteredAndOwnerHasAllowance } from './getHasDeviceRegisteredAndOwnerHasAllowance';
import { type GetIsUsingTrezorRelayDep } from './getIsDefaultRelayUrlSet';
import { type GetIsQuotaManagerEnabled } from './getIsQuotaManagerEnabled';
import { createAllocateOwnerQuota } from './owner/createAllocateOwnerQuota';
import { createCheckStorageByOwnerIdFetch } from './owner/createCheckStorageByOwnerIdFetch';
import { createEnsureOwnerHasAllocatedQuota } from './owner/createEnsureOwnerHasAllocatedQuota';
import { createTransferStorageFetch } from './owner/createTransferStorageFetch';
import { type GetOwnerHasAllowance } from './owner/getOwnerHasAllowance';
import { type FetchDep, createQuotaManagerFetch } from './quotaManagerFetch';
import {
    type WithSuiteSyncQuotaManagerState,
    selectEnforceQuotaManager,
    selectHasDeviceRegisteredAndOwnerHasAllowance,
    selectHasOwnerAllowance,
    selectLeftDeviceQuota,
} from './quotaManagerSelectors';
import { selectQuotaManagerUrl } from './quotaManagerUrl';
import { generateSessionId } from './session/generateSessionId';

type CreateSuiteSyncQuotaManagerCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => DeviceRootState & WithSuiteSyncQuotaManagerState;
    trezorConnect: Pick<TrezorConnectCallable, 'evoluSignRegistrationRequest'>;
} & GetDeviceForStaticSessionIdDep &
    GetIsTorEnabledDep &
    GetIsUsingTrezorRelayDep &
    FetchDep;

export const createSuiteSyncQuotaManagerCompositionRoot = (
    deps: CreateSuiteSyncQuotaManagerCompositionRootDeps,
) => {
    const quotaManagerFetch = createQuotaManagerFetch({
        fetch: deps.fetch,
        getQuotaManagerUrl: () => selectQuotaManagerUrl(deps.getState(), deps.getIsTorEnabled()),
    });

    // We only want to use QM for our own relay servers. In case custom URL has been set, QM is ignored,
    // unless enforceQuotaManager is set (used for e2e tests with a local relay).
    const getIsQuotaManagerEnabled: GetIsQuotaManagerEnabled = () =>
        deps.getIsUsingTrezorRelay() || selectEnforceQuotaManager(deps.getState());

    const getHasDeviceRegisteredAndOwnerHasAllowance: GetHasDeviceRegisteredAndOwnerHasAllowance = (
        deviceId,
        walletDescriptor,
    ) =>
        !getIsQuotaManagerEnabled() ||
        selectHasDeviceRegisteredAndOwnerHasAllowance(deps.getState(), deviceId, walletDescriptor);

    const getOwnerHasAllowance: GetOwnerHasAllowance = walletDescriptor =>
        !getIsQuotaManagerEnabled() || selectHasOwnerAllowance(deps.getState(), walletDescriptor);

    const getLeftDeviceQuota = (deviceId: string) =>
        selectLeftDeviceQuota(deps.getState(), deviceId);

    // Challenge
    const prepareChallengeSessionFetch = createPrepareChallengeSessionFetch({
        generateSessionId,
        quotaManagerFetch,
    });

    // Device
    const checkStorageByPublicKeyFetch = createCheckStorageByPublicKeyFetch({ quotaManagerFetch });

    const registerDeviceFetch = createRegisterDeviceFetch({
        quotaManagerFetch,
    });

    const registerDevice = createRegisterDevice({
        dispatch: deps.dispatch,
        prepareChallengeSessionFetch,
        registerDeviceFetch,
        trezorConnect: deps.trezorConnect,
    });

    const ensureDeviceHasQuota = createEnsureDeviceHasQuota({
        checkStorageByPublicKeyFetch,
        dispatch: deps.dispatch,
        registerDevice,
    });

    // Owner

    const checkStorageByOwnerIdFetch = createCheckStorageByOwnerIdFetch({
        quotaManagerFetch,
    });

    const transferStorageFetch = createTransferStorageFetch({
        dispatch: deps.dispatch,
        quotaManagerFetch,
    });

    const allocateOwnerQuota = createAllocateOwnerQuota({
        getLeftDeviceQuota,
        prepareChallengeSessionFetch,
        transferStorageFetch,
    });

    const ensureOwnerHasAllocatedQuota = createEnsureOwnerHasAllocatedQuota({
        allocateOwnerQuota,
        checkStorageByOwnerIdFetch,
        dispatch: deps.dispatch,
    });

    // Main

    const ensureQuota = createEnsureQuota({
        ensureDeviceHasQuota,
        ensureOwnerHasAllocatedQuota,
        getDeviceForStaticSessionId: deps.getDeviceForStaticSessionId,
        getHasDeviceRegisteredAndOwnerHasAllowance,
    });

    return {
        allocateOwnerQuota,
        ensureQuota,
        getHasDeviceRegisteredAndOwnerHasAllowance,
        getOwnerHasAllowance,
    };
};
