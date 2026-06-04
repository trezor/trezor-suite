import { type DiscreetModeRootState } from './discreetModeSlice';

export const selectIsDiscreteModeActive = (state: DiscreetModeRootState) =>
    state.discreetMode.isActive;
