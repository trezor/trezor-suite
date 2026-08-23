import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useEarnTransactionReview } from './useEarnTransactionReview';

const mockHandleReviewError = jest.fn();
const mockShowDeviceDisconnectedAlert = jest.fn();
const mockShowReviewAlert = jest.fn();
const mockLeaveReviewFromDeviceCancel = jest.fn();
const mockMarkReviewNavigationSuccess = jest.fn();
const mockRequestPrioritizedDeviceAccess = jest.fn();

jest.mock('./useHandleEarnReviewError', () => ({
    useHandleEarnReviewError: () => mockHandleReviewError,
}));
jest.mock('./useShowDeviceDisconnectedDuringEarnReviewAlert', () => ({
    useShowDeviceDisconnectedDuringEarnReviewAlert: () => mockShowDeviceDisconnectedAlert,
}));
jest.mock('./useShowPushTransactionFailedDuringReviewAlert', () => ({
    useShowPushTransactionFailedDuringReviewAlert: () => ({
        showReviewAlert: mockShowReviewAlert,
    }),
}));
jest.mock('./useYieldActionReviewBackNavigation', () => ({
    useYieldActionReviewBackNavigation: () => ({
        leaveReviewFromDeviceCancel: mockLeaveReviewFromDeviceCancel,
        markReviewNavigationSuccess: mockMarkReviewNavigationSuccess,
    }),
}));
jest.mock('@suite-native/device-mutex', () => ({
    requestPrioritizedDeviceAccess: (fn: () => unknown) => mockRequestPrioritizedDeviceAccess(fn),
}));

const fulfilled = <TPayload>(payload: TPayload) => ({
    meta: { requestStatus: 'fulfilled' as const },
    payload,
});

const rejected = <TPayload>(payload: TPayload | undefined) => ({
    meta: { requestStatus: 'rejected' as const },
    payload,
});

const SIGNED_PAYLOAD = { serializedTx: '0xsigned' };
const PUSHED_PAYLOAD = { txid: 'test-txid' };

const createParams = (overrides: Record<string, unknown> = {}) => ({
    formType: 'yield-deposit' as const,
    isSigned: false,
    navigation: { pop: jest.fn() },
    onPushSuccess: jest.fn(),
    onSignSuccess: jest.fn(),
    reportCancel: jest.fn(),
    reportError: jest.fn(),
    signAction: jest.fn(),
    pushAction: jest.fn(),
    ...overrides,
});

type HookParams = ReturnType<typeof createParams>;

const renderReview = (params: HookParams, { isDeviceConnected = true } = {}) =>
    renderHookWithStoreProvider((props: HookParams) => useEarnTransactionReview(props), {
        preloadedState: { device: { selectedDevice: { connected: isDeviceConnected } } },
        initialProps: params,
    });

describe('useEarnTransactionReview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequestPrioritizedDeviceAccess.mockImplementation(
            async (fn: () => Promise<unknown>) => ({ success: true, payload: await fn() }),
        );
    });

    describe('startReview', () => {
        it('signs successfully and passes the payload to onSignSuccess', async () => {
            const params = createParams();
            params.signAction.mockResolvedValue(fulfilled(SIGNED_PAYLOAD));
            const { result } = renderReview(params);

            let signingResult;
            await act(async () => {
                signingResult = await result.current.startReview();
            });

            expect(signingResult).toBe('signed');
            expect(params.onSignSuccess).toHaveBeenCalledWith(SIGNED_PAYLOAD);
            expect(mockHandleReviewError).not.toHaveBeenCalled();
            expect(params.reportError).not.toHaveBeenCalled();
        });

        it('handles a rejected sign with an error payload', async () => {
            const errorPayload = { error: 'sign-transaction-failed', message: 'boom' };
            const params = createParams();
            params.signAction.mockResolvedValue(rejected(errorPayload));
            const { result } = renderReview(params);

            let signingResult;
            await act(async () => {
                signingResult = await result.current.startReview();
            });

            expect(signingResult).toBe('failed');
            expect(mockHandleReviewError).toHaveBeenCalledWith(errorPayload);
            expect(params.reportError).toHaveBeenCalledWith('submit-failed');
            expect(params.onSignSuccess).not.toHaveBeenCalled();
        });

        it('detects a user cancellation without treating it as an error', async () => {
            const params = createParams();
            params.signAction.mockResolvedValue(
                rejected({ error: 'sign-transaction-failed', message: 'tx-cancelled' }),
            );
            const { result } = renderReview(params);

            let signingResult;
            await act(async () => {
                signingResult = await result.current.startReview();
            });

            expect(signingResult).toBe('cancelled');
            expect(params.reportCancel).toHaveBeenCalled();
            expect(mockHandleReviewError).not.toHaveBeenCalled();
            expect(params.reportError).not.toHaveBeenCalled();
        });
    });

    describe('handleSubmitted', () => {
        it('pushes successfully and marks the navigation success before onPushSuccess', async () => {
            const params = createParams({ isSigned: true });
            params.pushAction.mockResolvedValue(fulfilled(PUSHED_PAYLOAD));
            const { result } = renderReview(params);

            await act(async () => {
                await result.current.handleSubmitted();
            });

            expect(params.onPushSuccess).toHaveBeenCalledWith(PUSHED_PAYLOAD);
            expect(mockMarkReviewNavigationSuccess).toHaveBeenCalled();
            const markOrder =
                mockMarkReviewNavigationSuccess.mock.invocationCallOrder[0] ??
                Number.POSITIVE_INFINITY;
            const pushOrder =
                params.onPushSuccess.mock.invocationCallOrder[0] ?? Number.NEGATIVE_INFINITY;
            expect(markOrder).toBeLessThan(pushOrder);
            expect(mockShowReviewAlert).not.toHaveBeenCalled();
        });

        it('shows the pending-conflict alert on a conflicting push', async () => {
            const params = createParams({ isSigned: true });
            params.pushAction.mockResolvedValue(
                rejected({ error: 'push-transaction-pending-conflict' }),
            );
            const { result } = renderReview(params);

            await act(async () => {
                await result.current.handleSubmitted();
            });

            expect(mockShowReviewAlert).toHaveBeenCalledWith('pendingConflict');
            expect(params.reportError).toHaveBeenCalledWith('push-failed');
            expect(params.onPushSuccess).not.toHaveBeenCalled();
            expect(mockMarkReviewNavigationSuccess).not.toHaveBeenCalled();
        });

        it('ignores a second submit while the first push is still pending', async () => {
            const params = createParams({ isSigned: true });
            let resolvePush: (value: unknown) => void = () => {};
            params.pushAction.mockReturnValue(
                new Promise(resolve => {
                    resolvePush = resolve;
                }),
            );
            const { result } = renderReview(params);

            await act(async () => {
                const firstSubmit = result.current.handleSubmitted();
                const secondSubmit = result.current.handleSubmitted();

                resolvePush(fulfilled(PUSHED_PAYLOAD));

                await Promise.all([firstSubmit, secondSubmit]);
            });

            expect(params.pushAction).toHaveBeenCalledTimes(1);
            expect(params.onPushSuccess).toHaveBeenCalledTimes(1);
            expect(mockShowReviewAlert).not.toHaveBeenCalled();
        });

        it('allows a deliberate retry after a failed push', async () => {
            const params = createParams({ isSigned: true });
            params.pushAction
                .mockResolvedValueOnce(rejected({ error: 'push-transaction-failed' }))
                .mockResolvedValueOnce(fulfilled(PUSHED_PAYLOAD));
            const { result } = renderReview(params);

            await act(async () => {
                await result.current.handleSubmitted();
            });

            expect(mockShowReviewAlert).toHaveBeenCalledWith('pushFailed');
            expect(params.onPushSuccess).not.toHaveBeenCalled();

            await act(async () => {
                await result.current.handleSubmitted();
            });

            expect(params.pushAction).toHaveBeenCalledTimes(2);
            expect(params.onPushSuccess).toHaveBeenCalledWith(PUSHED_PAYLOAD);
        });

        it('does nothing when pushAction returns null and never switches to sending', async () => {
            const params = createParams({ isSigned: true });
            params.pushAction.mockReturnValue(null);
            const { result } = renderReview(params);

            await act(async () => {
                await result.current.handleSubmitted();
            });

            expect(result.current.status).toBe('signed');
            expect(params.onPushSuccess).not.toHaveBeenCalled();
            expect(mockMarkReviewNavigationSuccess).not.toHaveBeenCalled();
            expect(mockShowReviewAlert).not.toHaveBeenCalled();
        });
    });
});
