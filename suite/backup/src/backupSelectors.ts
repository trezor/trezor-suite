import type { DeviceRootState } from '@suite-common/device';

import type { BackupState } from './backupReducer';
import type { BackupStatus } from './types';

export interface BackupRootState {
    backup: BackupState;
}

export const selectBackup = (state: BackupRootState) => state.backup;

export const selectBackupStatus = (state: BackupRootState & DeviceRootState): BackupStatus => {
    const backup_availability = state.device.selectedDevice?.features?.backup_availability;
    if (state.backup.error !== undefined) return 'error';
    else if (backup_availability === 'Available' || backup_availability === 'NotAvailable')
        return 'finished';
    else if (state.backup.inProgress) return 'in-progress';
    else return 'initial';
};
