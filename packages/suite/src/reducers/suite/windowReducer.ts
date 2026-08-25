import type { UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import { createWeakMapSelector } from '@suite-common/redux-utils';
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

const createMemoizedSelector = createWeakMapSelector.withTypes<WindowRootState>();

export const selectIsWindowVisible = (state: WindowRootState) => state.window.isVisible;

// Memoized because it builds a new object: without it every consumer would re-render on every
// action instead of only when a breakpoint is actually crossed.
export const selectBreakpointFlags = createMemoizedSelector(
    [state => state.window],
    ({ isVisible, ...breakpointFlags }): BreakpointFlags => breakpointFlags,
);
