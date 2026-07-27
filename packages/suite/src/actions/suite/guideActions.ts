import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';

import { type Dispatch, type GetState } from 'src/types/suite';

import { GUIDE } from './constants';

export type GuideAction =
    | { type: typeof GUIDE.OPEN }
    | { type: typeof GUIDE.CLOSE }
    | { type: typeof GUIDE.SET_INDEX_NODE; payload: GuideCategory }
    | { type: typeof GUIDE.SET_VIEW; payload: ActiveView }
    | { type: typeof GUIDE.UNSET_NODE }
    | { type: typeof GUIDE.OPEN_NODE; payload: GuideNode }
    | { type: typeof GUIDE.SET_WIDTH; payload: number };

export const open = (): GuideAction => ({
    type: GUIDE.OPEN,
});

export const close = (): GuideAction => ({
    type: GUIDE.CLOSE,
});

export const unsetNode = (): GuideAction => ({
    type: GUIDE.UNSET_NODE,
});

export const setWidth = (payload: number): GuideAction => ({
    type: GUIDE.SET_WIDTH,
    payload,
});

export const setView = (payload: ActiveView) => (dispatch: Dispatch) => {
    if (payload !== 'GUIDE_ARTICLE' && payload !== 'GUIDE_CATEGORY') {
        dispatch(unsetNode());
    }

    dispatch({ type: GUIDE.SET_VIEW, payload });
};

// Reads state at dispatch-time (via getState) rather than relying on a value captured by
// a keyboard-shortcut handler's render closure, so the toggle can't act on a stale open/view.
export const toggleView = (payload: ActiveView) => (dispatch: Dispatch, getState: GetState) => {
    const { open: isOpen, view } = getState().guide;

    if (isOpen && view === payload) {
        dispatch(close());
    } else {
        dispatch(setView(payload));
        if (!isOpen) {
            dispatch(open());
        }
    }
};

export const openNode = (payload: GuideNode) => (dispatch: Dispatch) => {
    if (payload.type === 'page') {
        dispatch(setView('GUIDE_ARTICLE'));
    } else {
        dispatch(setView('GUIDE_CATEGORY'));
    }

    dispatch({
        type: GUIDE.OPEN_NODE,
        payload,
    });
};
