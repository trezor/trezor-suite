import type { UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import { type BreakpointFlags, initialBreakpointFlags } from '@trezor/theme';

import { updateBreakpoints, updateWindowVisibility } from 'src/actions/suite/windowActions';

export interface WindowState extends BreakpointFlags {
    isVisible: boolean;
}

interface WindowRootState {
    window: WindowState;
}

export const initialState: WindowState = {
    ...initialBreakpointFlags,
    isVisible: true,
};

const windowReducer = (state: WindowState = initialState, action: UnknownAction): WindowState =>
    produce(state, draft => {
        if (updateBreakpoints.match(action)) {
            Object.assign(draft, action.payload);
        } else if (updateWindowVisibility.match(action)) {
            draft.isVisible = action.payload.isVisible;
        }
    });

export default windowReducer;

export const selectIsWindowVisible = (state: WindowRootState) => state.window.isVisible;

export const selectBreakpointFlags = (state: WindowRootState): BreakpointFlags => {
    const { isVisible, ...breakpointFlags } = state.window;

    return breakpointFlags;
};
