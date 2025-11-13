import { DesktopSuiteSyncRootState } from './suiteSyncSlice';

export const selectShowEnableLocalFirstStorageModal = (state: DesktopSuiteSyncRootState): boolean =>
    state.suiteSync.showEnableLocalFirstStorageModal;
