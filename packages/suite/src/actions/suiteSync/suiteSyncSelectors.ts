import { DesktopSuiteSyncRootState } from './suiteSyncSlice';

export const selectShowEnableSuiteSyncModal = (state: DesktopSuiteSyncRootState): boolean =>
    state.suiteSync.showEnableSuiteSyncModal;
