import { p256 } from '@noble/curves/nist';
import { sha256 } from '@noble/hashes/sha2';

import { createThunk } from '@suite-common/redux-utils';
import {
    AcquiredDevice,
    DelegatedKey,
    EvoluKeys,
    TrezorDevice,
    asDelegatedKey,
    asDeviceEvoluOwnerId,
} from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DEVICE_MODULE_PREFIX, deviceActions, selectDevices } from '@suite-common/wallet-core';
import TrezorConnect, { ProofOfDelegatedIdentity } from '@trezor/connect';
import { asProofOfDelegatedIdentity } from '@trezor/connect/src/types/device';
import { Result, err, ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';

import { createEvoluAppOwnerFromTrezorData } from '../createEvoluAppOwnerFromTrezorData';

type InitCipherKeyThunkParams = {
    device: TrezorDevice;
};

const isCanceledErrorMessage = (errorMessage: string | null | undefined) =>
    Boolean(errorMessage?.toLocaleLowerCase().includes('cancelled'));

const isDeviceWithState = (
    device: TrezorDevice,
): device is AcquiredDevice & { state: NonNullable<AcquiredDevice['state']> } =>
    device.state !== undefined && device.state !== null;

const getProofOfDelegatedIdentity = (delegatedKey: DelegatedKey): ProofOfDelegatedIdentity => {
    const header = Buffer.from('EvoluGetNode');

    const prefixedMessageInBuffer = Buffer.concat([
        bufferUtils.getChunkSize(header.length),
        header,
    ]);

    const messageDigest = sha256(prefixedMessageInBuffer);
    const signature = p256.sign(messageDigest, delegatedKey);

    return asProofOfDelegatedIdentity(
        Buffer.from(signature.toBytes('compact').buffer).toString('hex'),
    );
};

type RetrieveEvoluNodeResult = {
    message: string;
    canceled: boolean;
};

const retrieveDelegatedIdentityKey = async (
    device: AcquiredDevice & { state: NonNullable<AcquiredDevice['state']> },
    currentDelegatedKey: DelegatedKey | null | undefined,
    options: {
        refreshKey?: boolean;
    } = {},
): Promise<Result<DelegatedKey, RetrieveEvoluNodeResult>> => {
    if (!currentDelegatedKey || options.refreshKey) {
        try {
            const result = await TrezorConnect.evoluGetDelegatedIdentityKey({
                device: {
                    path: device.path,
                    state: device.state,
                    instance: device.instance ?? 0,
                },
                useEmptyPassphrase: device.useEmptyPassphrase ?? false,
            });

            if (result.success) {
                return ok(asDelegatedKey(result.payload.private_key));
            }

            const canceled = isCanceledErrorMessage(result.payload.error);

            return err({
                message: result.payload.error,
                canceled,
            });
        } catch (e) {
            return err({
                message: String(e),
                canceled: false,
            });
        }
    }

    return ok(currentDelegatedKey);
};

const retrieveEvoluNode = async (
    device: AcquiredDevice & { state: NonNullable<AcquiredDevice['state']> },
    delegatedKey: DelegatedKey,
): Promise<Result<EvoluKeys, RetrieveEvoluNodeResult>> => {
    const proofOfDelegatedIdentity = getProofOfDelegatedIdentity(delegatedKey);
    try {
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
                console.error('Evolu: appOwnerResult error', appOwnerResult.error);

                return err({
                    message: String(appOwnerResult.error),
                    canceled: false,
                });
            }

            const evoluKeys: EvoluKeys = {
                ownerId: asDeviceEvoluOwnerId(appOwnerResult.value.id),
                ownerSecret: result.payload.data,
            };

            return ok(evoluKeys);
        }

        const canceled = isCanceledErrorMessage(result.payload.error);

        return err({
            message: result.payload.error,
            canceled,
        });
    } catch (e) {
        return err({
            message: String(e),
            canceled: false,
        });
    }
};

export const initEvoluKeysThunk = createThunk<void, InitCipherKeyThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/initEvoluKeysThunk`,
    async ({ device: originalDevice }, { dispatch, getState, rejectWithValue }) => {
        if (originalDevice.state?.staticSessionId === undefined) {
            return;
        }

        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (
            device === undefined ||
            device.mode === 'bootloader' ||
            device.mode === 'initialize' ||
            device.id === null
        ) {
            return;
        }

        if (!isDeviceWithState(device)) {
            console.warn('initEvoluKeysThunk: device.state is undefined');

            return rejectWithValue('Evolu: initEvoluKeysThunk: device.state is undefined');
        }

        if (
            device.localFirstStorageSecret?.evoluKeys !== undefined ||
            // We are already getting the keys in different "await"
            // This may happen if selectedDeviceThunk is called concurrently.
            // Todo: This probably shall not happen, but it happens currently.
            device.localFirstStorageSecret?.isRetrieving
        ) {
            return rejectWithValue(
                'Evolu: initEvoluKeysThunk: device.localFirstStorageSecret?.isRetrieving',
            );
        }

        dispatch(
            deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: true }),
        );

        const delegatedKeyResult = await retrieveDelegatedIdentityKey(device, device.delegatedKey, {
            refreshKey: false,
        });

        dispatch(
            deviceActions.setLocalFirstDelegatedKey({
                deviceId: device.id,
                delegatedKey: delegatedKeyResult.ok ? delegatedKeyResult.value : null,
            }),
        );

        if (!delegatedKeyResult.ok) {
            console.error('Evolu: retrieveDelegatedIdentityKey(...) failed: ', delegatedKeyResult);

            if (!delegatedKeyResult.error.canceled) {
                dispatch(notificationsActions.addToast({ type: 'suite-sync-keys-error' }));
            }

            dispatch(
                deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: false }),
            );

            return rejectWithValue(delegatedKeyResult.error);
        }

        const evoluNodeResult = await retrieveEvoluNode(device, delegatedKeyResult.value);
        // This also sets the `isRetrieving` flag to `false`
        dispatch(
            deviceActions.setLocalFirstStorageSecret({
                device,
                evoluKeys: evoluNodeResult.ok ? evoluNodeResult.value : undefined,
            }),
        );

        if (!evoluNodeResult.ok) {
            console.error('Evolu: retrieveEvoluNode(...) failed: ', evoluNodeResult);

            if (!evoluNodeResult.error.canceled) {
                dispatch(notificationsActions.addToast({ type: 'suite-sync-keys-error' }));
            }

            dispatch(
                deviceActions.setLocalFirstDelegatedKey({
                    deviceId: device.id,
                    delegatedKey: null,
                }),
            );

            return rejectWithValue(evoluNodeResult.error);
        }
    },
);
