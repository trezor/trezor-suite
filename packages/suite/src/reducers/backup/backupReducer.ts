import produce from 'immer';
import { BACKUP } from '@backup-actions/constants';
import { ConfirmKey } from '@backup-actions/backupActions';
import { Action } from '@suite-types';

interface BackupState {
    userConfirmed: ConfirmKey[];
}

const initialState: BackupState = {
    userConfirmed: [],
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

const backup = (state: BackupState = initialState, action: Action) => {
    return produce(state, draft => {
        switch (action.type) {
            case BACKUP.TOGGLE_CHECKBOX_BY_KEY:
                handleToggleCheckboxByKey(draft, action.payload);
                break;
            default:
            // no default
        }
    });
};

export default backup;
