import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';

import { type Dispatch } from 'src/types/suite';

import { GUIDE } from './constants';

export type GuideAction =
    | { type: typeof GUIDE.OPEN }
    | { type: typeof GUIDE.CLOSE }
    | { type: typeof GUIDE.SET_INDEX_NODE; payload: GuideCategory }
    | { type: typeof GUIDE.SET_VIEW; payload: ActiveView }
    | { type: typeof GUIDE.UNSET_NODE }
    | { type: typeof GUIDE.OPEN_NODE; payload: GuideNode };

export const open = (): GuideAction => ({
    type: GUIDE.OPEN,
});

export const close = (): GuideAction => ({
    type: GUIDE.CLOSE,
});

export const unsetNode = (): GuideAction => ({
    type: GUIDE.UNSET_NODE,
});

export const setView = (payload: ActiveView) => (dispatch: Dispatch) => {
    if (payload !== 'GUIDE_ARTICLE' && payload !== 'GUIDE_CATEGORY') {
        dispatch(unsetNode());
    }

    dispatch({ type: GUIDE.SET_VIEW, payload });
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
