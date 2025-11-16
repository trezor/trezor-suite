import { p256 } from '@noble/curves/nist';
import { sha256 } from '@noble/hashes/sha2';

import { createThunk } from '@suite-common/redux-utils';
import {
    AcquiredDevice,
    DelegatedIdentityKey,
    EvoluKeys,
    TrezorDevice,
    TrezorDeviceWithState,
    asDelegatedIdentityKey,
    asDeviceEvoluOwnerId,
} from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    DEVICE_MODULE_PREFIX,
    deviceActions,
    selectDevices,
    selectPersistentDeviceData,
} from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
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

const getProofOfDelegatedIdentity = (
    delegatedKey: DelegatedIdentityKey,
): ProofOfDelegatedIdentity => {
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

type RetrieveDelegatedIdentityKeyParams = {
    device: TrezorDeviceWithState;
    currentDelegatedKey: DelegatedIdentityKey | null | undefined;
    options?: {
        refreshKey?: boolean;
    };
};

const retrieveDelegatedIdentityKey = async ({
    device,
    currentDelegatedKey,
    options = {},
}: RetrieveDelegatedIdentityKeyParams): Promise<
    Result<DelegatedIdentityKey, RetrieveEvoluNodeResult>
> => {
    if (!currentDelegatedKey || options.refreshKey !== undefined) {
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
                return ok(asDelegatedIdentityKey(result.payload.private_key));
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
    delegatedKey: DelegatedIdentityKey,
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

// Todo: rename to initSuiteSync on something, separate SuiteSync and Evolu domains
export const initEvoluKeysThunk = createThunk<void, InitCipherKeyThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/initEvoluKeysThunk`,
    async ({ device: originalDevice }, { dispatch, getState, rejectWithValue }) => {
        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (
            device === undefined ||
            device.id === null ||
            !device.connected || // disconnected device cannot resolve Evolu-Keys
            device.mode !== 'normal' // bootloader,
        ) {
            return;
        }

        if (!isTrezorDeviceWithState(device)) {
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

        const persistedData = selectPersistentDeviceData(getState());
        const devicePersistedData = persistedData.find(it => it.device_id === device.id);

        dispatch(
            deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: true }),
        );

        const delegatedKeyResult = await retrieveDelegatedIdentityKey({
            device,
            currentDelegatedKey: devicePersistedData?.delegatedIdentityKey,
            options: { refreshKey: false },
        });

        dispatch(
            deviceActions.setDelegatedIdentityKey({
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
                deviceActions.setDelegatedIdentityKey({
                    deviceId: device.id,
                    delegatedKey: null,
                }),
            );

            return rejectWithValue(evoluNodeResult.error);
        }
    },
);
