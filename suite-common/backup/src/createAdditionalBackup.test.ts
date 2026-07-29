import { PROTO } from '@trezor/connect';

import {
    type CreateAdditionalBackupConnect,
    CreateAdditionalBackupFlowResult,
    type CreateAdditionalBackupResult,
    createAdditionalBackup,
    getCreateAdditionalBackupFlowResult,
} from './createAdditionalBackup';

const devicePath = 'device-path';
const successResponse = { success: true, payload: { message: 'Success' } } as const;
const errorResponse = {
    success: false,
    error: { code: 'Failure_ActionCancelled', message: 'Action cancelled' },
} as const;

const createTrezorConnectMock = ({
    recoveryDeviceResponse = successResponse,
    backupDeviceResponse = successResponse,
}: {
    recoveryDeviceResponse?: CreateAdditionalBackupResult;
    backupDeviceResponse?: CreateAdditionalBackupResult;
} = {}): jest.Mocked<CreateAdditionalBackupConnect> => ({
    recoveryDevice: jest
        .fn<
            ReturnType<CreateAdditionalBackupConnect['recoveryDevice']>,
            Parameters<CreateAdditionalBackupConnect['recoveryDevice']>
        >()
        .mockResolvedValue(recoveryDeviceResponse),
    backupDevice: jest
        .fn<
            ReturnType<CreateAdditionalBackupConnect['backupDevice']>,
            Parameters<CreateAdditionalBackupConnect['backupDevice']>
        >()
        .mockResolvedValue(backupDeviceResponse),
});

describe(createAdditionalBackup.name, () => {
    it('unlocks repeated backup before creating backup when backup mode is not active', async () => {
        const trezorConnect = createTrezorConnectMock();

        const result = await createAdditionalBackup({
            devicePath,
            isAdditionalShamirBackupInProgress: false,
            trezorConnect,
        });

        expect(result).toEqual(successResponse);
        expect(trezorConnect.recoveryDevice).toHaveBeenCalledWith({
            type: 'UnlockRepeatedBackup',
            input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
            enforce_wordlist: true,
            device: {
                path: devicePath,
            },
        });
        expect(trezorConnect.backupDevice).toHaveBeenCalledWith({
            backup_method: PROTO.BackupMethod.N4W1,
            device: {
                path: devicePath,
            },
        });
    });

    it('creates backup directly when backup mode is already active', async () => {
        const trezorConnect = createTrezorConnectMock();

        await createAdditionalBackup({
            devicePath,
            isAdditionalShamirBackupInProgress: true,
            trezorConnect,
        });

        expect(trezorConnect.recoveryDevice).not.toHaveBeenCalled();
        expect(trezorConnect.backupDevice).toHaveBeenCalledWith({
            backup_method: PROTO.BackupMethod.N4W1,
            device: {
                path: devicePath,
            },
        });
    });

    it('returns unlock error and does not create backup when unlock fails', async () => {
        const trezorConnect = createTrezorConnectMock({
            recoveryDeviceResponse: errorResponse,
        });

        const result = await createAdditionalBackup({
            devicePath,
            isAdditionalShamirBackupInProgress: false,
            trezorConnect,
        });

        expect(result).toEqual(errorResponse);
        expect(trezorConnect.backupDevice).not.toHaveBeenCalled();
    });
});

describe(getCreateAdditionalBackupFlowResult.name, () => {
    it.each([
        {
            response: successResponse,
            expected: CreateAdditionalBackupFlowResult.Success,
        },
        {
            response: errorResponse,
            expected: CreateAdditionalBackupFlowResult.CanceledOnTrezor,
        },
        {
            response: {
                success: false,
                error: { code: 'Method_Interrupted', message: 'Interrupted' },
            } as const,
            expected: CreateAdditionalBackupFlowResult.Interrupted,
        },
        {
            response: {
                success: false,
                error: { code: 'Failure_ProcessError', message: 'Process error' },
            } as const,
            expected: CreateAdditionalBackupFlowResult.Error,
        },
    ])('returns $expected', ({ response, expected }) => {
        expect(getCreateAdditionalBackupFlowResult(response)).toBe(expected);
    });
});
