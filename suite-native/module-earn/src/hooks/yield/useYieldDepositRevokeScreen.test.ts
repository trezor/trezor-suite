import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldAllowanceFees } from './useYieldAllowanceFees';
import { useYieldDepositRevokeScreen } from './useYieldDepositRevokeScreen';
import { useYieldFlowData } from './useYieldFlowData';
import { useYieldPendingTransaction } from './useYieldPendingTransaction';
import { useYieldSession } from './useYieldSession';
import { mockYieldPendingTransactionResult } from '../../../mocks/mockYieldPendingTransactionResult';
import { updateYieldAllowanceSelectedFeeLevelThunk } from '../../thunks/yield/yieldApprovalThunks';

const resolvedFlow = mockResolvedYieldFlowData();
const mockNavigation = { navigate: jest.fn() };
const mockPrepareReview = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useIsFocused: () => true,
    useRoute: () => ({ params: { accountKey: 'account-key', tokenContract: 'token-contract' } }),
}));
jest.mock('./useYieldFlowData');
jest.mock('./useYieldSession');
jest.mock('./useYieldAllowanceFees');
jest.mock('./useYieldPendingTransaction');
jest.mock('./useShowYieldAlert', () => ({ useShowYieldAlert: () => jest.fn() }));
jest.mock('./useShowYieldTransactionFailureAlert', () => ({
    useShowYieldTransactionFailureAlert: jest.fn(),
}));
jest.mock('./useYieldPendingTransactionTracking', () => ({
    useYieldPendingTransactionTracking: jest.fn(),
}));
jest.mock('./useRefreshYieldDepositAllowanceOnIdle', () => ({
    useRefreshYieldDepositAllowanceOnIdle: jest.fn(),
}));
jest.mock('../../thunks/yield/yieldApprovalThunks', () => ({
    ...jest.requireActual('../../thunks/yield/yieldApprovalThunks'),
    prepareYieldAllowanceReviewTransactionThunk: () => mockPrepareReview,
}));

const renderRevoke = async (connected = true) => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
    const view = await renderHookWithStoreProvider(useYieldDepositRevokeScreen, {
        services,
        preloadedState: {
            deviceAuthorization: deviceAuthorizationInitialState,
            device: { selectedDevice: { connected } },
        },
    });

    return { ...view, analytics: services.analytics };
};

describe('revoke submit analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useYieldFlowData).mockReturnValue(resolvedFlow);
        jest.mocked(useYieldSession).mockReturnValue(
            mockYieldSessionState({
                approval: {
                    allowanceAmount: '10',
                    allowanceStatus: 'loaded',
                    modalState: {
                        amount: '0',
                        contractAddress: '0x0000000000000000000000000000000000000001',
                        spender: '0x0000000000000000000000000000000000000003',
                        txType: 'revoke',
                    },
                },
            }),
        );
        jest.mocked(useYieldPendingTransaction).mockReturnValue(
            mockYieldPendingTransactionResult(),
        );
        jest.mocked(useYieldAllowanceFees).mockReturnValue({
            formDraft: undefined,
            formDraftKey: '',
            hasFeeEstimationError: false,
            retryFeeEstimation: jest.fn(),
            isAllowanceFeeReady: true,
            isComposingAllowanceFee: false,
            isFeeUnavailable: false,
            selectedFee: 'normal',
            updateFeeLevelThunk: updateYieldAllowanceSelectedFeeLevelThunk,
        });
        mockPrepareReview.mockResolvedValue({
            type: 'test/prepare/fulfilled',
            meta: { requestStatus: 'fulfilled', requestId: 'test-prepare' },
        });
    });

    it.each([true, false])('reports once at Continue (connected=%s)', async connected => {
        const { result, analytics } = await renderRevoke(connected);

        if (!result.current) throw new Error('Revoke form is not ready');
        expect(analytics.report).not.toHaveBeenCalled();
        await act(() => result.current?.handleReviewAndSign());

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/deposit',
            payload: {
                action: 'continue',
                type: 'revoke',
                networkSymbol: resolvedFlow.account.symbol,
                vaultId: resolvedFlow.vault.id,
                deviceStatus: connected ? 'connected' : 'disconnected',
            },
        });
        expect(mockPrepareReview).toHaveBeenCalledTimes(1);
    });

    it('does not report a disabled Continue', async () => {
        jest.mocked(useYieldAllowanceFees).mockReturnValue({
            formDraft: undefined,
            formDraftKey: '',
            hasFeeEstimationError: false,
            retryFeeEstimation: jest.fn(),
            isAllowanceFeeReady: false,
            isComposingAllowanceFee: false,
            isFeeUnavailable: true,
            selectedFee: 'normal',
            updateFeeLevelThunk: updateYieldAllowanceSelectedFeeLevelThunk,
        });
        const { result, analytics } = await renderRevoke();

        if (!result.current) throw new Error('Revoke form is not ready');
        await act(() => result.current?.handleReviewAndSign());

        expect(analytics.report).not.toHaveBeenCalled();
        expect(mockPrepareReview).not.toHaveBeenCalled();
    });
});
