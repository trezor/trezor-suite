import produce from 'immer';
import { RECOVERY } from '@recovery-actions/constants';
import { Action } from '@suite-types';
import { WordCount } from '@recovery-types';
import { SeedInputStatus } from '@recovery-actions/recoveryActions';

export interface RecoveryState {
    advancedRecovery: boolean;
    wordsCount: WordCount;
    status: SeedInputStatus;
    error?: string;
}

const initialState: RecoveryState = {
    advancedRecovery: false,
    wordsCount: 12,
    error: '',
    status: 'initial',
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
            case RECOVERY.SET_ERROR:
                draft.error = action.payload;
                break;
            case RECOVERY.SET_STATUS:
                draft.status = action.payload;
                break;
            case RECOVERY.RESET_REDUCER:
                return initialState;
            default:
            // no default
        }
    });
};

export default recovery;
