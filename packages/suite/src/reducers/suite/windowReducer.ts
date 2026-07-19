import { produce } from 'immer';
import { type Action as ReduxAction } from 'redux';

import { type BreakpointFlags, initialBreakpointFlags } from '@trezor/theme';
import { isArrayMember } from '@trezor/utils';

import { WINDOW } from 'src/actions/suite/constants';
import { type WindowAction } from 'src/actions/suite/windowActions';

const WINDOW_ACTION_TYPES = Object.values(WINDOW);

const isWindowAction = (action: ReduxAction): action is WindowAction =>
    isArrayMember(action.type, WINDOW_ACTION_TYPES);

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

const windowReducer = (state: WindowState = initialState, action: ReduxAction): WindowState => {
    if (!isWindowAction(action)) {
        return state;
    }

    const windowAction: WindowAction = action;

    return produce(state, draft => {
        switch (windowAction.type) {
            case WINDOW.UPDATE_BREAKPOINTS:
                Object.assign(draft, windowAction.payload);
                break;
            case WINDOW.UPDATE_WINDOW_VISIBILITY:
                draft.isVisible = windowAction.payload.isVisible;
                break;
            // no default
        }
    });
};

export default windowReducer;

export const selectIsWindowVisible = (state: WindowRootState) => state.window.isVisible;

export const selectBreakpointFlags = (state: WindowRootState): BreakpointFlags => {
    const { isVisible, ...breakpointFlags } = state.window;

    return breakpointFlags;
};
