import { Dispatch } from '@reduxjs/toolkit';

import {
    DelegatedIdentityKey,
    EvoluKeys,
    TrezorDevice,
    TrezorDeviceWithState,
    asDeviceEvoluOwnerId,
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
import { createTryLock } from '@trezor/utils';

import { createEvoluAppOwnerFromTrezorData } from '../createEvoluAppOwnerFromTrezorData';

const PROOF_OF_DELEGATED_IDENTITY_HEADER = 'EvoluGetNode';

type RetrieveEvoluNodeParams = {
    device: TrezorDeviceWithState;
    delegatedKey: DelegatedIdentityKey;
};

const retrieveEvoluNode = async ({ device, delegatedKey }: RetrieveEvoluNodeParams) => {
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
        const appOwnerResult = createEvoluAppOwnerFromTrezorData({
            data: result.payload.data,
        });

        if (!appOwnerResult.ok) {
            console.error('Evolu: appOwnerResult error', appOwnerResult);

            // We log the (unexpected) error, so we won't propagate it.
            // This shall never happen under standard circumstances and if this happens
            // something is terribly wrong (like Evolu BC Breaking Change)
            return ok();
        }

        const evoluKeys: EvoluKeys = {
            ownerId: asDeviceEvoluOwnerId(appOwnerResult.value.id),
            ownerSecret: result.payload.data,
        };

        return ok(evoluKeys);
    }

    if (isCanceledErrorMessage(result.payload.error)) {
        return err({ type: 'DeviceCancelled' as const });
    }

    return err({ type: 'DeviceError' as const, message: result.payload.error });
};

/**
 * Ideally, this shall be done per-physical device. But practically,
 * it is not needed. We won't run `refreshSuiteSyncKeysThunk`
 * in parallel on multiple physical devices.
 */
const tryLock = createTryLock();

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
    async (dispatch: Dispatch, getState: () => any) => {
        const inner = async () => {
            const device = selectDevices(getState())?.find(
                it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
            );

            if (
                device === undefined ||
                !device.connected || // disconnected device cannot resolve Evolu-Keys
                device.mode !== 'normal' || // bootloader,
                !isTrezorDeviceWithState(device) ||
                device.localFirstStorageSecret?.evoluKeys !== undefined
            ) {
                return ok(); // No action needed
            }

            const delegatedKeyResult = await dispatch(
                retrieveDelegatedIdentityKeyThunk({ device }),
            );

            if (!delegatedKeyResult.ok) {
                return delegatedKeyResult;
            }

            const evoluNodeResult = await retrieveEvoluNode({
                device,
                delegatedKey: delegatedKeyResult.value,
            });

            if (!evoluNodeResult.ok) {
                dispatch(
                    deviceActions.setLocalFirstStorageSecret({ device, evoluKeys: undefined }),
                );
                dispatch(
                    deviceActions.setDelegatedIdentityKey({
                        deviceId: device.id,
                        delegatedKey: null,
                    }),
                );

                return evoluNodeResult;
            }

            dispatch(
                deviceActions.setLocalFirstStorageSecret({
                    device,
                    evoluKeys: evoluNodeResult.value ?? undefined,
                }),
            );

            return ok();
        };

        // Hack: We are already getting the keys in different "await". This may happen
        // if selectedDeviceThunk is called concurrently. So we run it under
        // try-lock to prevent double-calling of the device.
        // Todo: This probably shall not happen, but it happens currently.
        const lockedResult = await tryLock(inner);

        return lockedResult !== null ? lockedResult : ok();
    };
