import { produce } from 'immer';

import { type BreakpointFlags, initialBreakpointFlags } from '@trezor/theme';

import { WINDOW } from 'src/actions/suite/constants';
import { type Action } from 'src/types/suite';

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

const windowReducer = (state: WindowState = initialState, action: Action): WindowState =>
    produce(state, draft => {
        switch (action.type) {
            case WINDOW.UPDATE_BREAKPOINTS:
                Object.assign(draft, action.payload);
                break;
            case WINDOW.UPDATE_WINDOW_VISIBILITY:
                draft.isVisible = action.payload.isVisible;
                break;
            // no default
        }
    });

export default windowReducer;

export const selectIsWindowVisible = (state: WindowRootState) => state.window.isVisible;

export const selectBreakpointFlags = (state: WindowRootState): BreakpointFlags => {
    const { isVisible, ...breakpointFlags } = state.window;

    return breakpointFlags;
};
