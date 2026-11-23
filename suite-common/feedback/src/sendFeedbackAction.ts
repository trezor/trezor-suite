import { notificationsActions } from '@suite-common/toast-notifications';
import { createThunk } from '@trezor/redux-utils';

import { type Feedback } from './feedback';
import { getFeedbackUrl } from './getFeedbackUrl';

const FEEDBACK_MODULE_PREFIX = '@suite/feedback';

export const sendFeedbackThunk = createThunk<void, Feedback, void>(
    `${FEEDBACK_MODULE_PREFIX}/sendFeedback`,
    async ({ type, payload }, { dispatch, rejectWithValue }) => {
        const url = getFeedbackUrl(type);
        const params = new URLSearchParams(
            Object.entries(payload)
                .filter(([, v]) => v != null)
                .map(([k, v]) => [k, String(v)]),
        );

        try {
            const response = await fetch(`${url}?${params.toString()}`, {
                method: 'GET',
            });
            if (response.ok) {
                dispatch(notificationsActions.addToast({ type: 'user-feedback-send-success' }));

                return;
            }
        } catch {
            // Network failures use the same error toast as server rejections.
        }

        dispatch(notificationsActions.addToast({ type: 'user-feedback-send-error' }));

        return rejectWithValue('Failed to send feedback');
    },
);
