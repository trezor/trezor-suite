import produce from 'immer';
import {
    RecoveryReducer,
    RecoveryActionTypes,
    SET_WORD,
    SET_WORDS_COUNT,
    SET_ADVANCED_RECOVERY,
} from '@suite/types/onboarding/recovery';

const initialState = {
    word: null,
    advancedRecovery: false,
    wordsCount: 12,
};

const recovery = (state: RecoveryReducer = initialState, action: RecoveryActionTypes) => {
    return produce(state, draft => {
        switch (action.type) {
            case SET_WORD:
                draft.word = action.word;
                break;
            case SET_WORDS_COUNT:
                draft.wordsCount = action.count;
                break;
            case SET_ADVANCED_RECOVERY:
                draft.advancedRecovery = action.value;
                break;
            default:
                return state;
        }
    });
};

export default recovery;
