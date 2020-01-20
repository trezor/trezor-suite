import produce from 'immer';
import { RECOVERY } from '@settings-actions/constants';
import { Action } from '@suite-types';

export interface RecoveryState {
    advancedRecovery: boolean;
    wordsCount: 12 | 18 | 24;
    success: boolean | null;
    error: string | null;
}

const initialState: RecoveryState = {
    advancedRecovery: false,
    wordsCount: 12,
    success: null,
    error: null,
};

const recovery = (state: RecoveryState = initialState, action: Action): RecoveryState => {
    return produce(state, draft => {
        switch (action.type) {
            case RECOVERY.SET_WORDS_COUNT:
                draft.wordsCount = action.payload;
                break;
            case RECOVERY.SET_ADVANCED_RECOVERY:
                draft.advancedRecovery = action.payload;
                break;
            case RECOVERY.SET_RESULT:
                draft.error = action.payload.error;
                draft.success = action.payload.success;
                break;
            case RECOVERY.RESET_REDUCER:
                return initialState;
            default:
            // no default
        }
    });
};

export default recovery;
