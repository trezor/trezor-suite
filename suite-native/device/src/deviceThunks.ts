import { createThunk } from '@suite-common/redux-utils';
import { deviceActions, selectDevicePath, selectSelectedDevice } from '@suite-common/wallet-core';
import { WalletBackupType } from '@suite-native/device';
import TrezorConnect, { PROTO } from '@trezor/connect';

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
        default: {
            const _unhandledCase: never = walletBackupType;
            throw new Error(`Unhandled wallet backup type: ${_unhandledCase}`);
        }
    }
};

export const createAndBackupWalletThunk = createThunk(
    `${NATIVE_DEVICE_MODULE_PREFIX}/resetDevice`,
    async ({ walletBackupType }: { walletBackupType: WalletBackupType }, { getState }) => {
        const devicePath = selectDevicePath(getState());

        if (!devicePath) {
            throw new Error('Device not found');
        }

        // TODO: implement entropy check for mobile
        // https://github.com/trezor/trezor-suite/issues/18355
        const isEntropyCheckEnabled = false;

        return await TrezorConnect.resetDevice({
            device: { path: devicePath },
            skip_backup: false,
            ...getResetDeviceConfig(walletBackupType),
            //Entropy check can be toggled via message system config so it should be always last to avoid unintentional disabling.
            entropy_check: isEntropyCheckEnabled,
        });
    },
);
