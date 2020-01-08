import { setWordsCount, setAdvancedRecovery, submit } from '@onboarding-actions/recoveryActions';

export interface RecoveryState {
    advancedRecovery: boolean;
    wordsCount: number;
}

export interface RecoveryActions {
    submit: typeof submit;
    setWordsCount: typeof setWordsCount;
    setAdvancedRecovery: typeof setAdvancedRecovery;
}

export const SET_WORDS_COUNT = '@onboarding/recovery-set-words-count';
export const SET_ADVANCED_RECOVERY = '@onboarding/recovery-set-advanced-recovery';

interface SetWordsCountAction {
    type: typeof SET_WORDS_COUNT;
    payload: number;
}

interface SetAdvancedRecoveryAction {
    type: typeof SET_ADVANCED_RECOVERY;
    payload: boolean;
}

export type RecoveryActionTypes = SetWordsCountAction | SetAdvancedRecoveryAction;
