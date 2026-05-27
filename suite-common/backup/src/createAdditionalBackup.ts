import TrezorConnect, { type DeviceUniquePath, PROTO } from '@trezor/connect';

import { type AdditionalBackupResult } from './types';

type CreateAdditionalBackupParams = {
    devicePath: DeviceUniquePath;
    backupMethod: PROTO.BackupMethod;
    skipVerification?: boolean;
    onVerificationComplete?: () => void;
};

/**
 * Core additional backup flow: verify ownership via recovery, then create backup.
 * Platform-specific thunks should wrap this with their own device access patterns.
 */
export const createAdditionalBackup = async ({
    devicePath,
    backupMethod,
    skipVerification,
    onVerificationComplete,
}: CreateAdditionalBackupParams): Promise<AdditionalBackupResult> => {
    if (!skipVerification) {
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
    }

    const backupResponse = await TrezorConnect.backupDevice({
        backup_method: backupMethod,
        device: { path: devicePath },
    });

    if (!backupResponse.success) {
        return { success: false, phase: 'backup' };
    }

    return { success: true };
};
