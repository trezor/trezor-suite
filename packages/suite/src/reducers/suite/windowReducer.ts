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
                // Simply copy all properties from the payload
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

// Selector for the breakpoint flags
export const selectBreakpointFlags = (state: WindowRootState): BreakpointFlags => ({
    isBelowMobile: state.window.isBelowMobile,
    isBelowTablet: state.window.isBelowTablet,
    isBelowLaptop: state.window.isBelowLaptop,
    isBelowDesktop: state.window.isBelowDesktop,
    isAboveMobile: state.window.isAboveMobile,
    isAboveTablet: state.window.isAboveTablet,
    isAboveLaptop: state.window.isAboveLaptop,
    isAboveDesktop: state.window.isAboveDesktop,
});
