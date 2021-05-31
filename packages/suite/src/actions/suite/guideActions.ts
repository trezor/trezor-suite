import qs from 'qs';
import { GUIDE } from './constants';
import type { ActiveView, Feedback, FeedbackType } from '@suite-types/guide';
import { Dispatch } from '@suite-types';
import { addToast } from '@suite-actions/notificationActions';

export type GuideAction =
    | { type: typeof GUIDE.OPEN }
    | { type: typeof GUIDE.CLOSE }
    | { type: typeof GUIDE.SET_VIEW; payload: ActiveView }
    | { type: typeof GUIDE.OPEN_ARTICLE; payload: string };

export const open = () => ({
    type: GUIDE.OPEN,
});

export const close = () => ({
    type: GUIDE.CLOSE,
});

export const setView = (payload: ActiveView) => ({
    type: GUIDE.SET_VIEW,
    payload,
});

export const openArticle = (payload: string) => (dispatch: Dispatch) => {
    dispatch(setView('GUIDE_ARTICLE'));
    dispatch({
        type: GUIDE.OPEN_ARTICLE,
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

export const sendFeedback = ({ type, payload }: Feedback) => async (dispatch: Dispatch) => {
    const url = getUrl(type);
    const params = qs.stringify(payload);
    try {
        await fetch(`${url}?${params}`, {
            method: 'GET',
        });
        dispatch(addToast({ type: 'user-feedback-send-success' }));
    } catch (err) {
        dispatch(addToast({ type: 'user-feedback-send-error' }));
        console.error('failed to send user feedback', err);
    }
};
