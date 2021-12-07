import { GUIDE } from './constants';
import { Dispatch } from '@suite-types';
import { addToast } from '@suite-actions/notificationActions';

import type { ActiveView, Feedback, FeedbackType, Category, Node } from '@suite-types/guide';

export type GuideAction =
    | { type: typeof GUIDE.OPEN }
    | { type: typeof GUIDE.CLOSE }
    | { type: typeof GUIDE.SET_INDEX_NODE; payload: Category }
    | { type: typeof GUIDE.SET_VIEW; payload: ActiveView }
    | { type: typeof GUIDE.UNSET_NODE }
    | { type: typeof GUIDE.OPEN_NODE; payload: Node };

export const open = () => ({
    type: GUIDE.OPEN,
});

export const close = () => ({
    type: GUIDE.CLOSE,
});

export const setIndexNode = (payload: Category) => ({
    type: GUIDE.SET_INDEX_NODE,
    payload,
});

export const unsetNode = () => ({
    type: GUIDE.UNSET_NODE,
});

export const setView = (payload: ActiveView) => (dispatch: Dispatch) => {
    if (payload !== 'GUIDE_PAGE' && payload !== 'GUIDE_CATEGORY') {
        dispatch(unsetNode());
    }

    dispatch({ type: GUIDE.SET_VIEW, payload });
};

export const openNode = (payload: Node) => (dispatch: Dispatch) => {
    if (payload.type === 'page') {
        dispatch(setView('GUIDE_PAGE'));
    } else {
        dispatch(setView('GUIDE_CATEGORY'));
    }

    dispatch({
        type: GUIDE.OPEN_NODE,
        payload,
    });
};

const getUrl = (feedbackType: FeedbackType) => {
    const typeUri = feedbackType === 'BUG' ? 'bugs' : 'feedback';
    const base = `https://data.trezor.io/suite/${typeUri}`;

    if (process.env.CODESIGN_BUILD) {
        return `${base}/stable.log`;
    }

    return `${base}/develop.log`;
};

export const sendFeedback =
    ({ type, payload }: Feedback) =>
    async (dispatch: Dispatch) => {
        const url = getUrl(type);
        const params = new URLSearchParams({ ...payload });
        try {
            await fetch(`${url}?${params.toString()}`, {
                method: 'GET',
            });
            dispatch(addToast({ type: 'user-feedback-send-success' }));
        } catch (err) {
            dispatch(addToast({ type: 'user-feedback-send-error' }));
            console.error('failed to send user feedback', err);
        }
    };
