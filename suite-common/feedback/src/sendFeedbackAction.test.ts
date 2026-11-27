import { notificationsActions } from '@suite-common/toast-notifications';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { type Feedback } from './feedback';
import { sendFeedbackThunk } from './sendFeedbackAction';

const feedback: Feedback = {
    type: 'SUGGESTION',
    payload: {
        category: 'feature',
        feature: 'staking',
        description: 'Feedback',
        rating: '4',
        platform: 'desktop',
        os: 'macos',
        user_agent: '',
        suite_version: '26.12.0',
        suite_revision: '',
        window_dimensions: '1280x800',
        firmware_version: '',
        firmware_revision: '',
        firmware_type: '',
    },
};

describe(sendFeedbackThunk.typePrefix, () => {
    afterEach(() => jest.restoreAllMocks());

    it('fulfills a submission accepted by the feedback endpoint', async () => {
        const fetch = jest
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response(null, { status: 204 }));
        const { actions, dispatch } = createMockDispatch({ getState: () => ({}), extra: {} });

        const result = await dispatch(
            sendFeedbackThunk({
                ...feedback,
                payload: {
                    ...feedback.payload,
                    feature: 'yield',
                    context: 'claim',
                    tokenSymbols: ['MORPHO', 'USDC'],
                },
            }),
        );

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('tokenSymbols=MORPHO%2CUSDC'), {
            method: 'GET',
        });
        expect(sendFeedbackThunk.fulfilled.match(result)).toBe(true);
        expect(actions).toContainEqual(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'user-feedback-send-success' }),
            }),
        );
    });

    it('rejects a submission when the endpoint responds with an error', async () => {
        jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));
        const { actions, dispatch } = createMockDispatch({ getState: () => ({}), extra: {} });

        const result = await dispatch(sendFeedbackThunk(feedback));

        expect(sendFeedbackThunk.rejected.match(result)).toBe(true);
        expect(actions).toContainEqual(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'user-feedback-send-error' }),
            }),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'user-feedback-send-success' }),
            }),
        );
    });

    it('rejects a submission after a network error', async () => {
        jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'));
        const { actions, dispatch } = createMockDispatch({ getState: () => ({}), extra: {} });

        const result = await dispatch(sendFeedbackThunk(feedback));

        expect(sendFeedbackThunk.rejected.match(result)).toBe(true);
        expect(actions).toContainEqual(
            expect.objectContaining({
                type: notificationsActions.addToast.type,
                payload: expect.objectContaining({ type: 'user-feedback-send-error' }),
            }),
        );
    });
});
