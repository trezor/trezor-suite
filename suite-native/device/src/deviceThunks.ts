import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import {
    ConnectDeviceSettings,
    deviceActions,
    selectDevicePath,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { WalletBackupType, reportCheckFail } from '@suite-native/device';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
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
            const settings: ConnectDeviceSettings = {
                defaultWalletLoading: 'standard',
            };

            dispatch(deviceActions.forgetDevice({ device, settings }));
        }

        return;
    },
);

const getResetDeviceConfig = (walletBackupType: WalletBackupType): PROTO.ResetDevice => {
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

export const createAndBackupWalletThunk = createThunk(
    `${NATIVE_DEVICE_MODULE_PREFIX}/resetDevice`,
    async (
        { walletBackupType }: { walletBackupType: WalletBackupType },
        { getState, dispatch },
    ) => {
        const device = selectSelectedDevice(getState());
        const devicePath = selectDevicePath(getState());
        const isDeviceInitialized = selectIsDeviceInitialized(getState());
        const isEntropyCheckEnabled = selectIsFeatureEnabled(
            getState(),
            Feature.entropyCheckMobile,
            true,
        );

        if (!device || !device.features || !devicePath) {
            throw new Error('Device not found');
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

            return await TrezorConnect.backupDevice({
                ...backupParams,
                device: {
                    path: device.path,
                },
            });
        }

        const result = await TrezorConnect.resetDevice({
            device: { path: devicePath },
            skip_backup: false,
            ...getResetDeviceConfig(walletBackupType),
            //Entropy check can be toggled via message system config so it should be always last to avoid unintentional disabling.
            entropy_check: isEntropyCheckEnabled,
        });

        if (!result.success && result.payload.code === 'Failure_EntropyCheck') {
            const contextData = {
                model: device?.features?.internal_model,
                revision: device?.features?.revision,
                version: getFirmwareVersion(device),
                vendor: device?.features?.fw_vendor,
            };
            reportCheckFail('Entropy', contextData, result.payload.error);
            // TODO: temporary exception to avoid false positives, see https://github.com/trezor/trezor-suite-private/issues/135
            if (result.payload.error !== 'device disconnected during action') {
                dispatch(deviceActions.setEntropyCheckFail(device.id));
            }
        }

        return result;
    },
);

export const recoverWalletThunk = createThunk(
    `${NATIVE_DEVICE_MODULE_PREFIX}/recoverWallet`,
    (_, { getState }) => {
        const devicePath = selectDevicePath(getState());

        return TrezorConnect.recoveryDevice({ device: { path: devicePath } });
    },
);
