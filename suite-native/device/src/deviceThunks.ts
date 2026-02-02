import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { BackupType } from '@suite-common/suite-types';
import {
    deviceActions,
    processEntropyCheckResultThunk,
    selectDevicePath,
    selectIsDeviceInitialized,
    selectSelectedDevice,
    selectSimulatedEntropyCheckFail,
} from '@suite-common/wallet-core';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect, { PROTO, SuccessWithDevice, Unsuccessful } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

const NATIVE_DEVICE_MODULE_PREFIX = 'nativeDevice';

export const setTemporaryRememberedDeviceThunk = createThunk(
    `${NATIVE_DEVICE_MODULE_PREFIX}/setTemporaryRememberedDevice`,
    (
        { temporaryRemember }: { temporaryRemember: boolean },
        { getState, rejectWithValue, dispatch },
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device) {
            return rejectWithValue('Device not found');
        }

        dispatch(
            deviceActions.setTemporaryRememberedDevice({
                device,
                temporaryRemember,
            }),
        );

        // if the device is not connected and it was remembered only temporarily, we need to forget it
        if (!device.connected && device.temporaryRemember && !temporaryRemember) {
            dispatch(deviceActions.forgetDevice({ device }));
        }

        return;
    },
);

const getResetDeviceConfig = (walletBackupType: BackupType): PROTO.ResetDevice => {
    switch (walletBackupType) {
        case 'shamir-single':
            return {
                backup_type: 3,
                strength: 128,
            };
        case 'shamir-advanced':
            return {
                backup_type: 4,
                strength: 128,
            };
        case '12-words':
            return { backup_type: PROTO.BackupType.Bip39, strength: 128 };
        case '24-words':
            return { backup_type: PROTO.BackupType.Bip39, strength: 256 };
        default:
            return exhaustive(walletBackupType);
    }
};

export const createAndBackupWalletThunk = createThunk<
    Unsuccessful | SuccessWithDevice<PROTO.Success>,
    { walletBackupType: BackupType },
    { rejectValue: string }
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
        // Used only in tests! See deviceReducer for the property definition.
        const simulatedFailResult = selectSimulatedEntropyCheckFail(getState());

        if (!device || !device.features || !devicePath) {
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
            TrezorConnect.resetDevice({
                device: { path: devicePath },
                skip_backup: false,
                ...getResetDeviceConfig(walletBackupType),
                //Entropy check can be toggled via message system config so it should be always last to avoid unintentional disabling.
                entropy_check: isEntropyCheckEnabled,
            }),
        );
        // error from device-mutex
        if (!deviceResponse.success) return rejectWithValue(deviceResponse.error);

        // full response from connect, which is either success or error
        const result = deviceResponse.payload;
        if (isEntropyCheckEnabled) {
            if (simulatedFailResult) {
                dispatch(processEntropyCheckResultThunk({ device, result: simulatedFailResult }));

                return fulfillWithValue(simulatedFailResult);
            }
            dispatch(processEntropyCheckResultThunk({ device, result }));
        }

        return fulfillWithValue(result);
    },
);

export const recoverWalletThunk = createThunk(
    `${NATIVE_DEVICE_MODULE_PREFIX}/recoverWalletThunk`,
    async (_, { getState }) => {
        const devicePath = selectDevicePath(getState());

        const deviceResponse = await requestPrioritizedDeviceAccess(() =>
            TrezorConnect.recoveryDevice({ device: { path: devicePath } }),
        );

        if (!deviceResponse.success) {
            throw new Error(deviceResponse.error);
        }

        return deviceResponse.payload;
    },
);
