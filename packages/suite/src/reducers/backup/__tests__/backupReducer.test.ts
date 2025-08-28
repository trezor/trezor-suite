import { BackupAvailability } from '@trezor/protobuf/src/messages';

import type { DesktopDeviceRootState } from 'src/actions/device/deviceSlice';

import { selectBackupStatus } from '../backupReducer';
import type { BackupRootState, BackupState } from '../backupReducer';

describe('selectBackupStatus', () => {
    const baseBackup: BackupState = {
        userConfirmed: [],
        inProgress: false,
        error: undefined,
    };

    const errorBackup: BackupState = {
        userConfirmed: [],
        inProgress: false,
        error: 'error message',
    };

    const inProgressBackup: BackupState = {
        userConfirmed: [],
        inProgress: true,
        error: undefined,
    };

    const getState = (
        backup: BackupState,
        backup_availability: BackupAvailability,
    ): BackupRootState & DesktopDeviceRootState => ({
        backup: { ...baseBackup, ...backup },
        device: {
            devices: [],
            isDeviceAutoEjectEnabled: false,
            persistentDeviceData: [],
            isConnectionModalOpen: true,
            defaultConnectionMode: 'cable',
            selectedDevice: {
                features: { backup_availability },
            } as any,
        },
    });

    it('returns "finished" if backup_availability is Available regardless of backup state', () => {
        [baseBackup, errorBackup, inProgressBackup].forEach(backup => {
            const state = getState(backup, 'Available');
            expect(selectBackupStatus(state)).toBe('finished');
        });
    });

    it('returns "finished" if backup_availability is NotAvailable regardless of backup state', () => {
        [baseBackup, errorBackup, inProgressBackup].forEach(backup => {
            const state = getState(backup, 'NotAvailable');
            expect(selectBackupStatus(state)).toBe('finished');
        });
    });

    it('returns "error" if backup.error is set', () => {
        const state = getState(errorBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('error');
    });

    it('returns "in-progress" if backup.inProgress is true', () => {
        const state = getState(inProgressBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('in-progress');
    });

    it('returns "initial" if none of the above', () => {
        const state = getState(baseBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('initial');
    });
});
