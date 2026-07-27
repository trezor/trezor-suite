import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { type Feedback } from './feedback';
import { getFeedbackUrl } from './getFeedbackUrl';

const FEEDBACK_MODULE_PREFIX = '@suite/feedback';

export const sendFeedbackAction = createThunk<void, Feedback>(
    `${FEEDBACK_MODULE_PREFIX}/sendFeedback`,
    async ({ type, payload }, { dispatch, rejectWithValue }) => {
        const url = getFeedbackUrl(type);
        const params = new URLSearchParams(
            Object.entries(payload)
                .filter(([, v]) => v != null)
                .map(([k, v]) => [k, String(v)]),
        );

        try {
            await fetch(`${url}?${params.toString()}`, {
                method: 'GET',
            });
            dispatch(notificationsActions.addToast({ type: 'user-feedback-send-success' }));
        } catch (err) {
            dispatch(notificationsActions.addToast({ type: 'user-feedback-send-error' }));
            console.error('failed to send user feedback', err);

            return rejectWithValue('Failed to send feedback');
        }
    },
);
