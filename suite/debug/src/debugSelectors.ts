import { type DebugRootState } from './debugSlice';

export const selectDebug = (state: DebugRootState) => state.debug;
export const selectIsDebugModeActive = (state: DebugRootState) => state.debug.showDebugMenu;
