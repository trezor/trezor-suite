import { produce } from 'immer';

import type { DeviceRootState } from '@suite-common/device';

import { type BackupStatus, type ConfirmKey } from 'src/actions/backup/backupActions';
import { BACKUP } from 'src/actions/backup/constants';
import { type Action } from 'src/types/suite';

export interface BackupRootState {
    backup: BackupState;
}

export interface BackupState {
    userConfirmed: ConfirmKey[];
    inProgress: boolean;
    error?: string;
}

const initialState: BackupState = {
    userConfirmed: [],
    inProgress: false,
};

const handleToggleCheckboxByKey = (draft: BackupState, key: ConfirmKey) => {
    if (!draft.userConfirmed.includes(key)) {
        draft.userConfirmed.push(key);

        return;
    }
    draft.userConfirmed.splice(
        draft.userConfirmed.findIndex(r => r === key),
        1,
    );
};

const backup = (state: BackupState = initialState, action: Action) =>
    produce(state, draft => {
        switch (action.type) {
            case BACKUP.TOGGLE_CHECKBOX_BY_KEY:
                handleToggleCheckboxByKey(draft, action.payload);
                break;
            case BACKUP.SET_IN_PROGRESS:
                draft.inProgress = action.payload;
                break;
            case BACKUP.SET_ERROR:
                draft.inProgress = false;
                draft.error = action.payload;
                break;
            case BACKUP.RESET_REDUCER:
                return initialState;
            default:
            // no default
        }
    });

export const selectBackup = (state: BackupRootState) => state.backup;
export const selectBackupStatus = (state: BackupRootState & DeviceRootState): BackupStatus => {
    const backup_availability = state.device.selectedDevice?.features?.backup_availability;
    if (state.backup.error !== undefined) return 'error';
    else if (backup_availability === 'Available' || backup_availability === 'NotAvailable')
        return 'finished';
    else if (state.backup.inProgress) return 'in-progress';
    else return 'initial';
};

export default backup;
