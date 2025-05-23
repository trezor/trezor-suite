import { produce } from 'immer';

import { BreakpointFlags, initialBreakpointFlags } from '@trezor/theme';

import { WINDOW } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';

export interface State extends BreakpointFlags {
    isVisible: boolean;
}

interface WindowRootState {
    window: State;
}

export const initialState: State = {
    ...initialBreakpointFlags,
    isVisible: true,
};

const windowReducer = (state: State = initialState, action: Action): State =>
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
