import produce from 'immer';
import { BACKUP } from '@backup-actions/constants';
import { ConfirmKey, BackupStatus } from '@backup-actions/backupActions';
import { Action } from '@suite-types';

export interface BackupState {
    userConfirmed: ConfirmKey[];
    status: BackupStatus;
    error?: string;
}

const initialState: BackupState = {
    userConfirmed: [],
    status: 'initial',
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
            case BACKUP.SET_STATUS:
                draft.status = action.payload;
                break;
            case BACKUP.SET_ERROR:
                draft.error = action.payload;
                break;
            case BACKUP.RESET_REDUCER:
                return initialState;
            default:
            // no default
        }
    });

export default backup;
