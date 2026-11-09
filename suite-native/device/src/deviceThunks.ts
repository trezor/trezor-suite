import {
    type DeviceRootState,
    selectDevicePath,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { type BackupType } from '@suite-common/suite-types';
import {
    type ResetDeviceWithEntropyCheckThunkDeps,
    resetDeviceWithEntropyCheckThunk,
} from '@suite-common/wallet-core';
import {
    deviceAccessMutex,
    requestDeviceAccess,
    requestPrioritizedDeviceAccess,
} from '@suite-native/device-mutex';
import TrezorConnect, { type OkWithDevice, PROTO, type Response } from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { createThunk } from '@trezor/redux-utils';
import { type Err, exhaustive } from '@trezor/type-utils';

const NATIVE_DEVICE_MODULE_PREFIX = 'nativeDevice';

const getResetDeviceConfig = (walletBackupType: BackupType): PROTO.ResetDevice => {
    switch (walletBackupType) {
        case 'shamir-single':
            return {
                backup_type: PROTO.Enum_BackupType.Slip39_Single_Extendable,
                strength: 128,
            };
        case 'shamir-advanced':
            return {
                backup_type: PROTO.Enum_BackupType.Slip39_Basic_Extendable,
                strength: 128,
            };
        case '12-words':
            return { backup_type: PROTO.Enum_BackupType.Bip39, strength: 128 };
        case '24-words':
            return { backup_type: PROTO.Enum_BackupType.Bip39, strength: 256 };
        default:
            return exhaustive(walletBackupType);
    }
};

type CreateAndBackupWalletThunkState = DeviceRootState & MessageSystemRootState;

type CreateAndBackupWalletThunkDeps = ResetDeviceWithEntropyCheckThunkDeps;

export const createAndBackupWalletThunk = createThunk<
    Err<SerializedError> | OkWithDevice<PROTO.Success>,
    { walletBackupType: BackupType },
    {
        rejectValue: string;
        state: CreateAndBackupWalletThunkState;
        extra: CreateAndBackupWalletThunkDeps;
    }
>(
    `${NATIVE_DEVICE_MODULE_PREFIX}/createAndBackupWalletThunk`,
    async ({ walletBackupType }, { getState, dispatch, fulfillWithValue, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());
        const devicePath = selectDevicePath(getState());
        const isDeviceInitialized = selectIsDeviceInitialized(getState());
        const isEntropyCheckEnabled = selectIsFeatureEnabled(
            getState(),
            Feature.entropyCheckMobile,
            true,
        );

        if (!device?.features || !devicePath) {
            return rejectWithValue('Device not found');
        }

        // If the device already has a seed, backup is created.
        if (isDeviceInitialized) {
            const { backup_type } = device.features;

            const backupParams: PROTO.BackupDevice =
                backup_type === 'Slip39_Basic' || backup_type === 'Slip39_Basic_Extendable'
                    ? {
                          group_threshold: 1,
                          groups: [{ member_count: 1, member_threshold: 1 }],
                      }
                    : {};

            const deviceResponse = await requestPrioritizedDeviceAccess(() =>
                TrezorConnect.backupDevice({
                    ...backupParams,
                    device: { path: device.path },
                }),
            );
            // error from device-mutex
            if (!deviceResponse.success) return rejectWithValue(deviceResponse.error);

            // full response from connect, which is either success or error
            return fulfillWithValue(deviceResponse.payload);
        }

        const deviceResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                resetDeviceWithEntropyCheckThunk({
                    device,
                    params: {
                        device: { path: devicePath },
                        skip_backup: false,
                        ...getResetDeviceConfig(walletBackupType),
                    },
                    isEntropyCheckEnabled,
                }),
            ).unwrap(),
        );
        // error from device-mutex
        if (!deviceResponse.success) return rejectWithValue(deviceResponse.error);

        return fulfillWithValue(deviceResponse.payload);
    },
);

type RecoverWalletThunkState = DeviceRootState;

export const recoverWalletThunk = createThunk<
    Response<PROTO.Success>,
    void,
    { state: RecoverWalletThunkState }
>(`${NATIVE_DEVICE_MODULE_PREFIX}/recoverWalletThunk`, async (_, { getState, dispatch }) => {
    const device = selectSelectedDevice(getState());
    const devicePath = selectDevicePath(getState());

    const deviceResponse = await requestPrioritizedDeviceAccess(() =>
        TrezorConnect.recoveryDevice({ device: { path: devicePath } }),
    );

    if (!deviceResponse.success) {
        throw new Error(deviceResponse.error);
    }

    // The recovered seed replaces any seed whose xpub hashes were stored by the wallet creation entropy check
    // (e.g. if the device was disconnected during backup, the seed was never stored).
    // Must happen before fulfilled, because that triggers discovery.
    if (deviceResponse.payload.success && device?.id) {
        dispatch(persistentDeviceDataActions.clearEntropyCheckXPubHashes({ deviceId: device.id }));
    }

    return deviceResponse.payload;
});

/**
 * Connect call to rerun FW authenticity checks (getFeatures used as the most basic no-op device call).
 */
type RerunFwAuthenticityChecksThunkState = DeviceRootState;

export const rerunFwAuthenticityChecksThunk = createThunk<
    void,
    void,
    { state: RerunFwAuthenticityChecksThunkState }
>(`${NATIVE_DEVICE_MODULE_PREFIX}/rerunFwAuthenticityChecksThunk`, (_, { getState }) => {
    const device = selectSelectedDevice(getState());
    if (device === undefined) return;
    // refrain from scheduling multiple tasks (since this runs in a loop)
    if (deviceAccessMutex.taskQueue.length === 0) {
        void requestDeviceAccess(() =>
            TrezorConnect.getFeatures({ device: { path: device.path } }),
        );
    }
});
