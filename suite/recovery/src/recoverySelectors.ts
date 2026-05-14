import { type RecoveryState } from './recoveryReducer';

type RecoveryRootState = { recovery: RecoveryState };

export const selectRecovery = (state: RecoveryRootState) => state.recovery;
export const selectAdvancedRecovery = (state: RecoveryRootState) => state.recovery.advancedRecovery;
export const selectWordsCount = (state: RecoveryRootState) => state.recovery.wordsCount;
export const selectRecoveryStatus = (state: RecoveryRootState) => state.recovery.status;
export const selectRecoveryError = (state: RecoveryRootState) => state.recovery.error;
