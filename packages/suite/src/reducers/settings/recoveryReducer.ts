import produce from 'immer';
import { RECOVERY } from '@settings-actions/constants';
import { Action } from '@suite-types';

export interface RecoveryState {
    advancedRecovery: boolean;
    wordsCount: 12 | 18 | 24;
}

const initialState: RecoveryState = {
    advancedRecovery: false,
    wordsCount: 12,
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
            default:
            // no default
        }
    });
};

export default recovery;
