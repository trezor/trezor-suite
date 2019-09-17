import produce from 'immer';
import {
    RecoveryReducer,
    RecoveryActionTypes,
    SET_WORDS_COUNT,
    SET_ADVANCED_RECOVERY,
} from '@suite/types/onboarding/recovery';

const initialState = {
    advancedRecovery: false,
    wordsCount: 12,
};

const recovery = (state: RecoveryReducer = initialState, action: RecoveryActionTypes) => {
    return produce(state, draft => {
        switch (action.type) {
            case SET_WORDS_COUNT:
                draft.wordsCount = action.payload;
                break;
            case SET_ADVANCED_RECOVERY:
                draft.advancedRecovery = action.payload;
                break;
            default:
            // no default
        }
    });
};

export default recovery;
