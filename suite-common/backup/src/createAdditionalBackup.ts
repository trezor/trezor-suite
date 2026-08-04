import TrezorConnect, { PROTO } from '@trezor/connect';

export type CreateAdditionalBackupConnect = {
    recoveryDevice: typeof TrezorConnect.recoveryDevice;
    backupDevice: typeof TrezorConnect.backupDevice;
};

export type CreateAdditionalBackupResult =
    | Awaited<ReturnType<CreateAdditionalBackupConnect['recoveryDevice']>>
    | Awaited<ReturnType<CreateAdditionalBackupConnect['backupDevice']>>;

export const CreateAdditionalBackupFlowResult = {
    Success: 'success',
    CanceledOnTrezor: 'canceled-on-trezor',
    Interrupted: 'interrupted',
    Error: 'error',
} as const;

export type CreateAdditionalBackupFlowResult =
    (typeof CreateAdditionalBackupFlowResult)[keyof typeof CreateAdditionalBackupFlowResult];

type CreateAdditionalBackupParams = {
    devicePath: string;
    isAdditionalShamirBackupInProgress: boolean;
    trezorConnect?: CreateAdditionalBackupConnect;
};

export const createAdditionalBackup = async ({
    devicePath,
    isAdditionalShamirBackupInProgress,
    trezorConnect = TrezorConnect,
}: CreateAdditionalBackupParams): Promise<CreateAdditionalBackupResult> => {
    if (!isAdditionalShamirBackupInProgress) {
        const unlockResponse = await trezorConnect.recoveryDevice({
            type: 'UnlockRepeatedBackup',
            input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
            enforce_wordlist: true,
            device: {
                path: devicePath,
            },
        });

        if (!unlockResponse.success) {
            return unlockResponse;
        }
    }

    return trezorConnect.backupDevice({
        backup_method: PROTO.BackupMethod.N4W1,
        device: {
            path: devicePath,
        },
    });
};

export const getCreateAdditionalBackupFlowResult = (
    response: CreateAdditionalBackupResult,
): CreateAdditionalBackupFlowResult => {
    if (response.success) {
        return CreateAdditionalBackupFlowResult.Success;
    }

    if (response.error.code === 'Failure_ActionCancelled') {
        return CreateAdditionalBackupFlowResult.CanceledOnTrezor;
    }

    if (response.error.code === 'Method_Interrupted') {
        return CreateAdditionalBackupFlowResult.Interrupted;
    }

    return CreateAdditionalBackupFlowResult.Error;
};
