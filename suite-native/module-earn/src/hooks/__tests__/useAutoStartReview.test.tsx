import { renderHook, waitFor } from '@suite-native/test-utils';

import { type ReviewAutoStartControls, useAutoStartReview } from '../useAutoStartReview';

const mockWaitForDeviceReview = jest.fn();

jest.mock('@suite-native/transaction-management', () => ({
    useWaitForButtonRequest: jest.fn(() => mockWaitForDeviceReview),
}));

type Params = {
    shouldAutoStartReview: boolean;
    startReview: () => Promise<string>;
    onDeviceReviewReady: () => void;
    onReviewSettled: (result: string, controls: ReviewAutoStartControls) => void | Promise<void>;
};

const buildParams = (overrides: Partial<Params> = {}): Params => ({
    shouldAutoStartReview: true,
    startReview: jest.fn().mockResolvedValue('signed'),
    onDeviceReviewReady: jest.fn(),
    onReviewSettled: jest.fn(),
    ...overrides,
});

describe('useAutoStartReview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('starts the review once, arms the device-review reveal and forwards the outcome', async () => {
        const params = buildParams();

        renderHook(() => useAutoStartReview(params));

        await waitFor(() => expect(params.startReview).toHaveBeenCalledTimes(1));
        expect(mockWaitForDeviceReview).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(params.onReviewSettled).toHaveBeenCalledWith('signed', expect.any(Object)),
        );
    });

    it('does not start the review while it is not allowed yet', () => {
        const params = buildParams({ shouldAutoStartReview: false });

        renderHook(() => useAutoStartReview(params));

        expect(params.startReview).not.toHaveBeenCalled();
        expect(mockWaitForDeviceReview).not.toHaveBeenCalled();
    });

    it('re-arms and retries the review when the settle handler calls allowRestart', async () => {
        const startReview = jest
            .fn()
            .mockResolvedValueOnce('not-ready')
            .mockResolvedValue('signed');
        const onReviewSettled = jest.fn(
            (result: string, { allowRestart }: ReviewAutoStartControls) => {
                if (result === 'not-ready') {
                    allowRestart();
                }
            },
        );
        const params = buildParams({ startReview, onReviewSettled });

        const { rerender } = renderHook((props: Params) => useAutoStartReview(props), {
            initialProps: params,
        });

        await waitFor(() => expect(onReviewSettled).toHaveBeenCalledTimes(1));

        rerender({ ...params, shouldAutoStartReview: false });
        rerender({ ...params, shouldAutoStartReview: true });

        await waitFor(() => expect(startReview).toHaveBeenCalledTimes(2));
    });

    it('does not retry once a terminal outcome leaves the started ref set', async () => {
        const startReview = jest.fn().mockResolvedValue('failed');
        const params = buildParams({ startReview });

        const { rerender } = renderHook((props: Params) => useAutoStartReview(props), {
            initialProps: params,
        });

        await waitFor(() => expect(startReview).toHaveBeenCalledTimes(1));

        rerender({ ...params, shouldAutoStartReview: false });
        rerender({ ...params, shouldAutoStartReview: true });

        expect(startReview).toHaveBeenCalledTimes(1);
    });

    it('re-arms so the review can retry after startReview rejects', async () => {
        const startReview = jest
            .fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue('signed');
        const params = buildParams({ startReview });

        const { rerender } = renderHook((props: Params) => useAutoStartReview(props), {
            initialProps: params,
        });

        await waitFor(() => expect(startReview).toHaveBeenCalledTimes(1));

        rerender({ ...params, shouldAutoStartReview: false });
        rerender({ ...params, shouldAutoStartReview: true });

        await waitFor(() => expect(startReview).toHaveBeenCalledTimes(2));
    });

    it('re-arms when the settle handler rejects', async () => {
        const onReviewSettled = jest
            .fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue(undefined);
        const params = buildParams({ onReviewSettled });

        const { rerender } = renderHook((props: Params) => useAutoStartReview(props), {
            initialProps: params,
        });

        await waitFor(() => expect(onReviewSettled).toHaveBeenCalledTimes(1));

        rerender({ ...params, shouldAutoStartReview: false });
        rerender({ ...params, shouldAutoStartReview: true });

        await waitFor(() => expect(onReviewSettled).toHaveBeenCalledTimes(2));
    });

    it('does not settle the review after the component unmounts', async () => {
        let resolveStart: (result: string) => void = () => {};
        const startReview = jest.fn(
            () =>
                new Promise<string>(resolve => {
                    resolveStart = resolve;
                }),
        );
        const onReviewSettled = jest.fn();
        const params = buildParams({ startReview, onReviewSettled });

        const { unmount } = renderHook(() => useAutoStartReview(params));

        await waitFor(() => expect(startReview).toHaveBeenCalledTimes(1));

        unmount();
        resolveStart('signed');
        await new Promise<void>(resolve => {
            setTimeout(resolve, 0);
        });

        expect(onReviewSettled).not.toHaveBeenCalled();
    });
});
