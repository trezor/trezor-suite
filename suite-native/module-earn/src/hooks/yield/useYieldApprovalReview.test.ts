import { type UnknownAction } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowResolvedData, transactionsActions } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldApprovalReview } from './useYieldApprovalReview';

const mockAnalytics = mockNativeAnalytics();
const mockDispatch = jest.fn();
const mockPush = jest.fn();
const mockSession = { approval: { isSubmitting: false } };
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const flowData = { account, vault: { id: 'local-vault' } } as YieldFlowResolvedData;
let mockPushSuccess = true;

jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ analytics: mockAnalytics, dispatch: mockDispatch }),
}));
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({}),
}));
jest.mock('@suite-common/mev', () => ({ selectIsMevProtectionFeatureEnabled: () => false }));
jest.mock('@suite-native/transaction-management', () => ({
    selectIsTransactionAlreadySigned: () => true,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectYieldSession: () => mockSession,
    selectIsMevProtectionEnabled: () => false,
    pushSendFormTransactionThunk: (params: unknown) => {
        mockPush(params);

        return { type: 'test/push' };
    },
}));
jest.mock('./useYieldApprovalReviewTransaction', () => ({
    useYieldApprovalReviewTransaction: () => null,
}));
jest.mock('./useYieldApprovalReviewNavigation', () => ({
    useYieldApprovalReviewNavigation: () => ({
        leaveReviewFromDeviceCancel: jest.fn(),
        markReviewNavigationSuccess: jest.fn(),
        wasReviewCancelledByUser: () => false,
    }),
}));
jest.mock('../earn/useHandleEarnReviewError', () => ({
    useHandleEarnReviewError: () => jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockImplementation((action: UnknownAction) =>
        action.type === 'test/push'
            ? Promise.resolve({
                  type: `test/push/${mockPushSuccess ? 'fulfilled' : 'rejected'}`,
                  payload: mockPushSuccess
                      ? { success: true, payload: { txid: 'local-sent' } }
                      : { error: 'push-transaction-failed' },
                  meta: {
                      requestStatus: mockPushSuccess ? 'fulfilled' : 'rejected',
                      requestId: 'local-push',
                  },
              })
            : action,
    );
});

it.each(
    (['approve', 'revoke'] as const).flatMap(transactionType =>
        [true, false].map(success => ({ transactionType, success })),
    ),
)(
    'reports $transactionType in the caller (success=$success)',
    async ({ transactionType, success }) => {
        mockPushSuccess = success;
        const { result } = await renderHookWithStoreProvider(() =>
            useYieldApprovalReview({ flowData, flowKey: 'local-flow', transactionType }),
        );
        await act(() => result.current.submitApproval());
        expect(mockPush).toHaveBeenCalledWith({
            selectedAccount: account,
            isMevProtectionEnabled: false,
        });
        const outcomes = mockDispatch.mock.calls
            .map(([action]) => action)
            .filter(transactionsActions.transactionBroadcastStatus.match);
        expect(outcomes.map(action => action.payload)).toEqual([
            {
                account,
                flow: transactionType,
                ...(success ? { status: 'success', txid: 'local-sent' } : { status: 'error' }),
            },
        ]);
    },
);
