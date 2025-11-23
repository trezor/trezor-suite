import { Dispatch } from '@reduxjs/toolkit';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { CreateSuiteSyncOwner } from '@suite-common/suite-sync-storage';
import {
    DelegatedIdentityKey,
    TrezorDevice,
    TrezorDeviceWithState,
} from '@suite-common/suite-types';
import {
    deviceActions,
    getProofOfDelegatedIdentity,
    isCanceledErrorMessage,
    retrieveDelegatedIdentityKeyThunk,
    selectDevices,
} from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

const PROOF_OF_DELEGATED_IDENTITY_HEADER = 'EvoluGetNode';

type RetrieveEvoluNodeDeps = {
    createSuiteSyncOwner: CreateSuiteSyncOwner;
};

type RetrieveEvoluNodeParams = {
    device: TrezorDeviceWithState;
    delegatedKey: DelegatedIdentityKey;
};

const retrieveEvoluNode =
    (deps: RetrieveEvoluNodeDeps) =>
    async ({ device, delegatedKey }: RetrieveEvoluNodeParams) => {
        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: PROOF_OF_DELEGATED_IDENTITY_HEADER,
        });

        const result = await TrezorConnect.evoluGetNode({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance ?? 0,
            },
            useEmptyPassphrase: device.useEmptyPassphrase ?? false,
            proof_of_delegated_identity: proofOfDelegatedIdentity,
        });

        if (result.success) {
            return deps.createSuiteSyncOwner({ data: result.payload.data });
        }

        if (isCanceledErrorMessage(result.payload.error)) {
            return err({ type: 'DeviceCancelled' as const });
        }

        return err({ type: 'DeviceError' as const, message: result.payload.error });
    };

type RefreshSuiteSyncKeysThunkParams = {
    device: TrezorDevice;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const refreshSuiteSyncKeysThunk =
    ({ device: originalDevice }: RefreshSuiteSyncKeysThunkParams) =>
    async (dispatch: Dispatch, getState: () => any, extra: ExtraDependencies) => {
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (
            device === undefined ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' || // bootloader,
            !isTrezorDeviceWithState(device) ||
            device.suiteSyncOwner !== undefined
        ) {
            return ok(); // No action needed
        }

        const delegatedKeyResult = await dispatch(retrieveDelegatedIdentityKeyThunk({ device }));

        if (!delegatedKeyResult.ok) {
            return delegatedKeyResult;
        }

        const evoluNodeResult = await retrieveEvoluNode({
            createSuiteSyncOwner: ({ data }) =>
                dispatch(extra.thunks.createSuiteSyncOwner({ data })),
        })({
            device,
            delegatedKey: delegatedKeyResult.value,
        });

        if (!evoluNodeResult.ok) {
            dispatch(deviceActions.setLocalFirstStorageSecret({ device, owner: undefined }));
            dispatch(
                deviceActions.setDelegatedIdentityKey({ deviceId: device.id, delegatedKey: null }),
            );

            return evoluNodeResult;
        }

        dispatch(
            deviceActions.setLocalFirstStorageSecret({
                device,
                owner: evoluNodeResult.value ?? undefined,
            }),
        );

        return ok();
    };
