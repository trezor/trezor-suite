import { type DebugRootState } from './debugSlice';

export const selectIsDebugModeActive = (state: DebugRootState) => state.debug.showDebugMenu;
