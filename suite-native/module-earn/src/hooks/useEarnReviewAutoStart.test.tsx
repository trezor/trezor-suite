import { renderHook, waitFor } from '@suite-native/test-utils';

import { useEarnReviewAutoStart } from './useEarnReviewAutoStart';

const mockWaitForDeviceReview = jest.fn();

jest.mock('@suite-native/transaction-management', () => ({
    useWaitForButtonRequest: jest.fn(() => mockWaitForDeviceReview),
}));

type Params = Parameters<typeof useEarnReviewAutoStart>[0];

const buildParams = (overrides: Partial<Params> = {}): Params => ({
    handleSign: jest.fn().mockResolvedValue(true),
    isSigned: false,
    canStart: true,
    onDeviceReviewReady: jest.fn(),
    onSignFailed: jest.fn(),
    ...overrides,
});

describe('useEarnReviewAutoStart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('auto-starts signing and arms the device-review reveal once the review is ready', async () => {
        const params = buildParams();

        renderHook(() => useEarnReviewAutoStart(params));

        await waitFor(() => expect(params.handleSign).toHaveBeenCalledTimes(1));
        expect(mockWaitForDeviceReview).toHaveBeenCalledTimes(1);
        expect(params.onSignFailed).not.toHaveBeenCalled();
    });

    it('does not start signing when the transaction is already signed', () => {
        const params = buildParams({ isSigned: true });

        renderHook(() => useEarnReviewAutoStart(params));

        expect(params.handleSign).not.toHaveBeenCalled();
        expect(mockWaitForDeviceReview).not.toHaveBeenCalled();
    });

    it('waits until the transaction can be signed before starting', async () => {
        const params = buildParams({ canStart: false });

        const { rerender } = renderHook((props: Params) => useEarnReviewAutoStart(props), {
            initialProps: params,
        });

        expect(params.handleSign).not.toHaveBeenCalled();

        rerender({ ...params, canStart: true });

        await waitFor(() => expect(params.handleSign).toHaveBeenCalledTimes(1));
    });

    it('calls onSignFailed when the signature is declined', async () => {
        const params = buildParams({ handleSign: jest.fn().mockResolvedValue(false) });

        renderHook(() => useEarnReviewAutoStart(params));

        await waitFor(() => expect(params.onSignFailed).toHaveBeenCalledTimes(1));
    });

    it('signs only once and never re-prompts even if the screen re-renders', async () => {
        const params = buildParams();

        const { rerender } = renderHook((props: Params) => useEarnReviewAutoStart(props), {
            initialProps: params,
        });

        await waitFor(() => expect(params.handleSign).toHaveBeenCalledTimes(1));

        rerender({ ...params });
        rerender({ ...params });

        expect(params.handleSign).toHaveBeenCalledTimes(1);
    });
});
