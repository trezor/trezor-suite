import { type RecoveryState } from './recoveryReducer';

type RecoveryRootState = { recovery: RecoveryState };

export const selectRecovery = (state: RecoveryRootState) => state.recovery;
export const selectRecoveryInputType = (state: RecoveryRootState) =>
    state.recovery.recoveryInputType;
export const selectWordsCount = (state: RecoveryRootState) => state.recovery.wordsCount;
export const selectRecoveryStatus = (state: RecoveryRootState) => state.recovery.status;
export const selectRecoveryError = (state: RecoveryRootState) => state.recovery.error;
