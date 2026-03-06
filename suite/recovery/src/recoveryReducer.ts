import { AnyAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import {
    RECOVERY_RESET_REDUCER,
    RECOVERY_SET_ADVANCED_RECOVERY,
    RECOVERY_SET_ERROR,
    RECOVERY_SET_STATUS,
    RECOVERY_SET_WORDS_COUNT,
} from './constants';
import { SeedInputStatus, WordCount } from './types';

export interface RecoveryState {
    advancedRecovery: boolean;
    wordsCount: WordCount;
    status: SeedInputStatus;
    error?: string;
}

const initialState: RecoveryState = {
    advancedRecovery: false,
    wordsCount: 12,
    error: undefined,
    status: 'initial',
};

export const recoveryReducer = (
    state: RecoveryState = initialState,
    action: AnyAction,
): RecoveryState =>
    produce(state, draft => {
        switch (action.type) {
            case RECOVERY_SET_WORDS_COUNT:
                draft.wordsCount = action.payload;
                break;
            case RECOVERY_SET_ADVANCED_RECOVERY:
                draft.advancedRecovery = action.payload;
                break;
            case RECOVERY_SET_ERROR:
                draft.error = action.payload;
                break;
            case RECOVERY_SET_STATUS:
                draft.status = action.payload;
                break;
            case RECOVERY_RESET_REDUCER:
                return initialState;
            default:
            // no default
        }
    });
