import TrezorConnect, { PROTO } from '@trezor/connect';

import { createAdditionalBackup } from './createAdditionalBackup';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        default: {
            recoveryDevice: jest.fn(),
            backupDevice: jest.fn(),
        },
    };
});

const mockRecoveryDevice = jest.mocked(TrezorConnect.recoveryDevice);
const mockBackupDevice = jest.mocked(TrezorConnect.backupDevice);

const devicePath = 'device-path-1' as any;
const backupMethod = PROTO.BackupMethod.N4W1;

describe(createAdditionalBackup.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns success when both verification and backup succeed', async () => {
        mockRecoveryDevice.mockResolvedValue({ success: true } as any);
        mockBackupDevice.mockResolvedValue({ success: true } as any);

        const result = await createAdditionalBackup({ devicePath, backupMethod });

        expect(result).toEqual({ success: true });
    });

    it('returns failure with verify-ownership phase when recovery fails', async () => {
        mockRecoveryDevice.mockResolvedValue({ success: false } as any);

        const result = await createAdditionalBackup({ devicePath, backupMethod });

        expect(result).toEqual({ success: false, phase: 'verify-ownership' });
        expect(mockBackupDevice).not.toHaveBeenCalled();
    });

    it('returns failure with backup phase when backup fails', async () => {
        mockRecoveryDevice.mockResolvedValue({ success: true } as any);
        mockBackupDevice.mockResolvedValue({ success: false } as any);

        const result = await createAdditionalBackup({ devicePath, backupMethod });

        expect(result).toEqual({ success: false, phase: 'backup' });
    });

    it('calls onVerificationComplete after successful verification', async () => {
        mockRecoveryDevice.mockResolvedValue({ success: true } as any);
        mockBackupDevice.mockResolvedValue({ success: true } as any);
        const onVerificationComplete = jest.fn();

        await createAdditionalBackup({ devicePath, backupMethod, onVerificationComplete });

        expect(onVerificationComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onVerificationComplete when verification fails', async () => {
        mockRecoveryDevice.mockResolvedValue({ success: false } as any);
        const onVerificationComplete = jest.fn();

        await createAdditionalBackup({ devicePath, backupMethod, onVerificationComplete });

        expect(onVerificationComplete).not.toHaveBeenCalled();
    });

    it('skips verification when skipVerification is true', async () => {
        mockBackupDevice.mockResolvedValue({ success: true } as any);

        const result = await createAdditionalBackup({
            devicePath,
            backupMethod,
            skipVerification: true,
        });

        expect(mockRecoveryDevice).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true });
    });

    it('does not call onVerificationComplete when verification is skipped', async () => {
        mockBackupDevice.mockResolvedValue({ success: true } as any);
        const onVerificationComplete = jest.fn();

        await createAdditionalBackup({
            devicePath,
            backupMethod,
            skipVerification: true,
            onVerificationComplete,
        });

        expect(onVerificationComplete).not.toHaveBeenCalled();
    });

    it('passes backupMethod to backupDevice', async () => {
        mockRecoveryDevice.mockResolvedValue({ success: true } as any);
        mockBackupDevice.mockResolvedValue({ success: true } as any);

        await createAdditionalBackup({ devicePath, backupMethod });

        expect(mockBackupDevice).toHaveBeenCalledWith(
            expect.objectContaining({ backup_method: PROTO.BackupMethod.N4W1 }),
        );
    });

    it('passes devicePath to both TrezorConnect calls', async () => {
        mockRecoveryDevice.mockResolvedValue({ success: true } as any);
        mockBackupDevice.mockResolvedValue({ success: true } as any);

        await createAdditionalBackup({ devicePath, backupMethod });

        expect(mockRecoveryDevice).toHaveBeenCalledWith(
            expect.objectContaining({ device: { path: devicePath } }),
        );
        expect(mockBackupDevice).toHaveBeenCalledWith(
            expect.objectContaining({ device: { path: devicePath } }),
        );
    });
});
