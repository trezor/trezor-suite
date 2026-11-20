import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { useYieldSession } from './useYieldSession';
import { useYieldWrappedNativeStep } from './useYieldWrappedNativeStep';
import { mockYieldPendingTransactionResult } from '../../../mocks/mockYieldPendingTransactionResult';
import { mockYieldWrappedNativeStepResult } from '../../../mocks/mockYieldWrappedNativeStepResult';
import { YieldFlowExitAnalyticsProvider } from '../../components/yield/YieldFlowExitAnalyticsProvider';

type RemoveEvent = { data: { action: { type: string } } };
const mockParentNavigation = {
    addListener: mock<(name: string, listener: (event: RemoveEvent) => void) => () => void>(),
};
const mockNavigation = {
    addListener: mockParentNavigation.addListener,
    getParent: () => mockParentNavigation,
    isFocused: () => true,
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => true,
    useNavigation: () => mockNavigation,
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigateToInitialScreen: () => mock(),
}));
jest.mock('./useYieldSession');
jest.mock('./useYieldPendingTransaction', () => ({
    useYieldPendingTransaction: () => mockYieldPendingTransactionResult(),
}));
jest.mock('./useShowYieldTransactionFailureAlert', () => ({
    useShowYieldTransactionFailureAlert: () => undefined,
}));
jest.mock('./useYieldPendingTransactionTracking', () => ({
    useYieldPendingTransactionTracking: () => undefined,
}));
jest.mock('../earn/useWrappedNativeTokenFees', () => ({
    useWrappedNativeTokenFees: () => mockYieldWrappedNativeStepResult().fees,
}));
jest.mock('../earn/useWrappedNativeTxSimulation', () => ({
    useWrappedNativeTxSimulation: () => mockYieldWrappedNativeStepResult().simulation,
}));

describe('wrapped-native Yield flow exit analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockParentNavigation.addListener.mockReturnValue(() => undefined);
    });

    it.each([
        { flowType: 'deposit', step: 'wrap', expectedCancels: 1 },
        { flowType: 'withdraw', step: 'unwrap', expectedCancels: 0 },
        { flowType: 'redeem', step: 'unwrap', expectedCancels: 0 },
    ] as const)(
        'reports $expectedCancels form cancellations when leaving $flowType at $step',
        async ({ flowType, step, expectedCancels }) => {
            const flowData = mockResolvedYieldFlowData({ isWrappedNativeVault: true });
            jest.mocked(useYieldSession).mockReturnValue(
                mockYieldSessionState({
                    step,
                    result: { completedAmount: step === 'unwrap' ? '1' : undefined },
                }),
            );
            const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
            await renderHookWithStoreProvider(useYieldWrappedNativeStep, {
                services,
                wrapper: YieldFlowExitAnalyticsProvider,
                initialProps: {
                    account: flowData.account,
                    availableBalance: '1',
                    decimals: 18,
                    flowKey: flowData.flowKey,
                    flowType,
                    isDisabled: false,
                    isWrappedNativeVault: true,
                    onNavigateToReview: mock(),
                    onSkipAnalytics: mock(),
                    onSubmitAnalytics: mock(),
                    onComposeError: mock(),
                    step,
                    tokenSymbol: 'WETH',
                    vault: flowData.vault,
                },
            });

            const listener = mockParentNavigation.addListener.mock.calls.at(-1)?.[1];
            if (!listener) throw new Error('Missing flow exit listener');
            await act(() => listener({ data: { action: { type: 'GO_BACK' } } }));

            expect(services.analytics.report).toHaveBeenCalledTimes(expectedCancels);
            if (expectedCancels) {
                expect(services.analytics.report).toHaveBeenCalledWith({
                    type: 'yield/navigate',
                    payload: {
                        action: 'cancel',
                        from: 'deposit-form',
                        to: 'earn-dashboard',
                        networkSymbol: flowData.account.symbol,
                        vaultId: flowData.vault.id,
                    },
                });
            }
        },
    );
});
