import { StaticSessionId } from '@trezor/connect';

import { DesktopSuiteSyncRootState } from './suiteSyncSlice';

export const selectShowEnableSuiteSyncModal = (
    state: DesktopSuiteSyncRootState,
): StaticSessionId | null => state.suiteSync.showEnableSuiteSyncModal;
