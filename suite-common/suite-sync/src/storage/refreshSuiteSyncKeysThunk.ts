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
import type { TrezorConnect } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { createEvoluAppOwnerFromTrezorData } from '../createEvoluAppOwnerFromTrezorData';

const PROOF_OF_DELEGATED_IDENTITY_HEADER = 'EvoluGetNode';

type RetrieveEvoluNodeDeps = {
    connect: TrezorConnect;
};

type RetrieveEvoluNodeParams = {
    device: TrezorDeviceWithState;
    delegatedKey: DelegatedIdentityKey;
};

export const retrieveEvoluNode =
    (deps: RetrieveEvoluNodeDeps) =>
    async ({ device, delegatedKey }: RetrieveEvoluNodeParams) => {
        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: PROOF_OF_DELEGATED_IDENTITY_HEADER,
        });

        const result = await deps.connect.evoluGetNode({
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

type RefreshSuiteSyncKeysThunkParams = {
    device: TrezorDevice;
};

type RefreshSuiteSyncKeysThunkDeps = {
    dispatch: Dispatch;
    getState: () => any;

    // Todo: there shall be interface, this is hack, but maybe its ok?
    retrieveDelegatedIdentityKeyThunk: ReturnType<typeof retrieveDelegatedIdentityKeyThunk>;
    retrieveEvoluNode: ReturnType<typeof retrieveEvoluNode>;
};

/**
 * Intentionally no `createThunk`, it is unnecessarily complicated, all we need is `Result` type.
 *
 * This is part of the experiment here: https://github.com/trezor/trezor-suite/issues/23202
 */
export const refreshSuiteSyncKeysThunk =
    (deps: RefreshSuiteSyncKeysThunkDeps) =>
    async ({ device: originalDevice }: RefreshSuiteSyncKeysThunkParams) => {
        const device = selectDevices(deps.getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (
            device === undefined ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' || // bootloader,
            !isTrezorDeviceWithState(device) ||
            device.localFirstStorageSecret?.evoluKeys !== undefined ||
            // We are already getting the keys in different "await"
            // This may happen if selectedDeviceThunk is called concurrently.
            // Todo: This probably shall not happen, but it happens currently.
            device.localFirstStorageSecret?.isRetrieving
        ) {
            return ok(); // No action needed
        }

        deps.dispatch(
            deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: true }),
        );

        const delegatedKeyResult = await deps.retrieveDelegatedIdentityKeyThunk({
            device,
        });

        if (!delegatedKeyResult.ok) {
            deps.dispatch(
                deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: false }),
            );

            return delegatedKeyResult;
        }

        const evoluNodeResult = await deps.retrieveEvoluNode({
            device,
            delegatedKey: delegatedKeyResult.value,
        });

        if (!evoluNodeResult.ok) {
            deps.dispatch(
                deviceActions.setLocalFirstStorageSecret({ device, evoluKeys: undefined }),
            );
            deps.dispatch(
                deviceActions.setDelegatedIdentityKey({ deviceId: device.id, delegatedKey: null }),
            );

            return evoluNodeResult;
        }

        // This also sets the `isRetrieving` flag to `false`
        deps.dispatch(
            deviceActions.setLocalFirstStorageSecret({
                device,
                evoluKeys: evoluNodeResult.value ?? undefined,
            }),
        );

        return ok();
    };
