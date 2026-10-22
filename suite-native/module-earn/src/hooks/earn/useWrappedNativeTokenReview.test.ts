import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useWrappedNativeTokenReview } from './useWrappedNativeTokenReview';

const mockSignResponse = jest.fn();
const mockNavigation = { popTo: jest.fn() };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));
jest.mock('@suite-native/device-mutex', () => ({
    requestPrioritizedDeviceAccess: async (fn: () => Promise<unknown>) => ({
        success: true,
        payload: await fn(),
    }),
}));
jest.mock('../yield/useYieldActionReviewBackNavigation', () => ({
    useYieldActionReviewBackNavigation: () => ({
        leaveReviewFromDeviceCancel: jest.fn(),
        markReviewNavigationSuccess: jest.fn(),
    }),
}));
jest.mock('./useHandleEarnReviewError', () => ({ useHandleEarnReviewError: () => jest.fn() }));
jest.mock('./useShowDeviceDisconnectedDuringEarnReviewAlert', () => ({
    useShowDeviceDisconnectedDuringEarnReviewAlert: () => jest.fn(),
}));
jest.mock('./useShowPushTransactionFailedDuringReviewAlert', () => ({
    useShowPushTransactionFailedDuringReviewAlert: () => ({ showReviewAlert: jest.fn() }),
}));
jest.mock('../../thunks/earn/wrappedNativeTokenThunks', () => ({
    signWrappedNativeTokenThunk: () => mockSignResponse,
    pushWrappedNativeTokenThunk: jest.fn(),
}));

describe.each(['standalone', 'in-flow'] as const)('%s review analytics', flowContext => {
    describe.each(['wrap', 'unwrap'] as const)(
        '%s review cancellation classification',
        flowType => {
            it.each([
                { message: 'tx-cancelled', result: 'cancelled', reportsError: false },
                { message: 'Device communication failed', result: 'failed', reportsError: true },
            ])('classifies $message correctly', async ({ message, result, reportsError }) => {
                mockSignResponse.mockResolvedValue({
                    meta: { requestStatus: 'rejected' },
                    payload: { error: 'sign-transaction-failed', message },
                });
                const { account, token } = mockResolvedYieldFlowData();
                const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
                const onError = jest.fn();
                const { result: review } = await renderHookWithStoreProvider(
                    () =>
                        useWrappedNativeTokenReview({
                            account,
                            token,
                            flowType,
                            flowContext,
                            onError,
                            amount: '1',
                            unsignedTransaction: '{}',
                        }),
                    {
                        services,
                        preloadedState: {
                            deviceAuthorization: deviceAuthorizationInitialState,
                            device: { selectedDevice: { connected: true } },
                        },
                    },
                );

                await act(async () => {
                    expect(await review.current.startReview()).toBe(result);
                });

                if (reportsError && flowContext === 'standalone') {
                    expect(services.analytics.report).toHaveBeenCalledWith({
                        type: `yield/${flowType}`,
                        payload: {
                            type: 'error',
                            action: 'continue',
                            networkSymbol: 'eth',
                            errorMessage: 'submit-failed',
                        },
                    });
                } else {
                    expect(services.analytics.report).not.toHaveBeenCalled();
                }
                if (reportsError && flowContext === 'in-flow') {
                    expect(onError).toHaveBeenCalledWith('submit-failed');
                    expect(onError).toHaveBeenCalledTimes(1);
                } else {
                    expect(onError).not.toHaveBeenCalled();
                }
            });
        },
    );
});
