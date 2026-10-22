import { type ComponentProps, type PropsWithChildren } from 'react';

import { mockResolvedYieldFlowData } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { act, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { YieldDepositWrapReviewScreen } from './YieldDepositWrapReviewScreen';
import { YieldWithdrawUnwrapReviewScreen } from './YieldWithdrawUnwrapReviewScreen';
import { type WrappedNativeTokenReviewContent } from '../../components/earn/WrappedNativeTokenReviewContent';

const mockData = mockResolvedYieldFlowData();
const mockNavigation = { navigate: jest.fn(), popTo: jest.fn() };
const mockSessions = {
    wrap: {
        step: 'wrap',
        action: { review: { type: 'wrap', amount: '1', unsignedTransaction: '{}' } },
    },
    unwrap: {
        step: 'unwrap',
        action: { review: { type: 'unwrap', amount: '1', unsignedTransaction: '{}' } },
    },
};
let mockStep: 'wrap' | 'unwrap' = 'wrap';
let mockOperation: 'withdraw' | 'redeem' = 'withdraw';
let mockOnError: ComponentProps<typeof WrappedNativeTokenReviewContent>['onError'];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => ({ params: { withdrawFlowType: mockOperation } }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectYieldSessionByFlowKey: () => mockSessions[mockStep],
}));
jest.mock('../../hooks/yield/useYieldFlowData', () => ({ useYieldFlowData: () => mockData }));
jest.mock('../../hooks/earn/useWrappedNativeReviewPreview', () => ({
    useWrappedNativeReviewPreview: () => ({ preview: {}, spentToken: mockData.token }),
}));
jest.mock('../../components/earn/EarnDeviceConnectionGuard', () => ({
    EarnDeviceConnectionGuard: ({ children }: PropsWithChildren) => children,
}));
jest.mock('../../components/earn/WrappedNativeTokenReviewContent', () => ({
    WrappedNativeTokenReviewContent: (
        props: ComponentProps<typeof WrappedNativeTokenReviewContent>,
    ) => {
        mockOnError = props.onError;

        return null;
    },
}));

describe.each([
    { step: 'wrap', operation: 'withdraw', event: 'yield/deposit' },
    { step: 'unwrap', operation: 'withdraw', event: 'yield/withdraw' },
    { step: 'unwrap', operation: 'redeem', event: 'yield/withdraw' },
] as const)('$step errors in $operation flow', ({ step, operation, event }) => {
    it.each(['submit-failed', 'push-failed'] as const)(
        'attributes %s to its parent yield flow',
        async errorMessage => {
            mockStep = step;
            mockOperation = operation;
            mockOnError = undefined;
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            await renderWithStoreProvider(
                step === 'wrap' ? (
                    <YieldDepositWrapReviewScreen />
                ) : (
                    <YieldWithdrawUnwrapReviewScreen />
                ),
                {
                    services,
                    preloadedState: {
                        deviceAuthorization: deviceAuthorizationInitialState,
                        device: { selectedDevice: { connected: true } },
                    },
                },
            );

            expect(mockOnError).toBeDefined();
            await act(() => mockOnError?.(errorMessage));

            expect(services.analytics.report).toHaveBeenCalledTimes(1);
            expect(services.analytics.report).toHaveBeenCalledWith({
                type: event,
                payload: {
                    action: 'continue',
                    type: 'error',
                    errorMessage: `${step}-${errorMessage}`,
                    networkSymbol: 'eth',
                    vaultId: mockData.vault.id,
                    ...(step === 'unwrap' ? { operation } : {}),
                },
            });
        },
    );
});
