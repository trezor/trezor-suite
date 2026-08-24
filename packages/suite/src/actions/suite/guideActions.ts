import { type Dispatch, type UnknownAction, createAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';

import { type GuideState } from 'src/reducers/suite/guideReducer';

import { GUIDE } from './constants';

export const open = createAction(GUIDE.OPEN);
export const close = createAction(GUIDE.CLOSE);
export const unsetNode = createAction(GUIDE.UNSET_NODE);
export const setWidth = createAction<number>(GUIDE.SET_WIDTH);
export const setIndexNode = createAction<GuideCategory>(GUIDE.SET_INDEX_NODE);
export const setGuideView = createAction<ActiveView>(GUIDE.SET_VIEW);
export const openGuideNode = createAction<GuideNode>(GUIDE.OPEN_NODE);

export const setView = (payload: ActiveView) => (dispatch: Dispatch<UnknownAction>) => {
    if (payload !== 'GUIDE_ARTICLE' && payload !== 'GUIDE_CATEGORY') {
        dispatch(unsetNode());
    }

    dispatch(setGuideView(payload));
};

// Reads state at dispatch-time (via getState) rather than relying on a value captured by
// a keyboard-shortcut handler's render closure, so the toggle can't act on a stale open/view.
type ToggleViewThunkState = { guide: GuideState };

export const toggleView =
    (payload: ActiveView) =>
    (
        dispatch: ThunkDispatch<ToggleViewThunkState, unknown, UnknownAction>,
        getState: () => ToggleViewThunkState,
    ) => {
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

export const openNode =
    (payload: GuideNode) =>
    (dispatch: ThunkDispatch<Record<never, never>, unknown, UnknownAction>) => {
        if (payload.type === 'page') {
            dispatch(setView('GUIDE_ARTICLE'));
        } else {
            dispatch(setView('GUIDE_CATEGORY'));
        }

        dispatch(openGuideNode(payload));
    };
