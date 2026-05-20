import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { type DeviceUniquePath, PROTO } from '@trezor/connect';

import { actionPrefix } from './constants';

type AdditionalBackupResult =
    | { success: true }
    | { success: false; phase: 'verify-ownership' | 'backup' };

export const createAdditionalBackupThunk = createThunk(
    `${actionPrefix}/createAdditionalBackupThunk`,
    async (
        {
            devicePath,
            onVerificationComplete,
        }: { devicePath: DeviceUniquePath; onVerificationComplete?: () => void },
        _thunkApi,
    ): Promise<AdditionalBackupResult> => {
        const verifyResponse = await TrezorConnect.recoveryDevice({
            type: 'UnlockRepeatedBackup',
            input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
            enforce_wordlist: true,
            device: { path: devicePath },
        });

        if (!verifyResponse.success) {
            return { success: false, phase: 'verify-ownership' };
        }

        onVerificationComplete?.();

        const backupResponse = await TrezorConnect.backupDevice({
            backup_method: PROTO.BackupMethod.N4W1,
            device: { path: devicePath },
        });

        if (!backupResponse.success) {
            return { success: false, phase: 'backup' };
        }

        return { success: true };
    },
);
