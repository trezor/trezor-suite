import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type SendRootState,
    type WalletSettingsRootState,
    type YieldFlowResolvedData,
    type YieldRootState,
    initialStablecoinYieldState,
    initialWalletSettingsState,
    transactionsActions,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { useYieldApprovalReview } from './useYieldApprovalReview';

const analyticsServices: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
const mockPush = jest.fn();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const flowData = { account, vault: { id: 'local-vault' } } as YieldFlowResolvedData;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({}),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    pushSendFormTransactionThunk: (params: unknown) => () => mockPush(params),
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

beforeEach(() => jest.clearAllMocks());

it.each(
    (['approve', 'revoke'] as const).flatMap(transactionType =>
        [true, false].map(success => ({ transactionType, success })),
    ),
)(
    'reports $transactionType in the caller (success=$success)',
    async ({ transactionType, success }) => {
        const store = createStoreFromPreloadedState<
            MessageSystemRootState & SendRootState & WalletSettingsRootState & YieldRootState
        >({
            messageSystem: messageSystemInitialState,
            wallet: {
                send: { drafts: {}, serializedTx: { tx: '00', symbol: account.symbol } },
                settings: { ...initialWalletSettingsState, mevProtection: false },
                stablecoinYield: initialStablecoinYieldState,
            },
        });
        const { actions, dispatch } = createMockDispatch({ getState: store.getState });
        mockPush.mockResolvedValue({
            type: success ? 'test/push/fulfilled' : 'test/push/rejected',
            payload: success
                ? { success: true, payload: { txid: 'local-sent' } }
                : { error: 'push-transaction-failed' },
            meta: {
                requestStatus: success ? 'fulfilled' : 'rejected',
                requestId: 'local-push',
            },
        });
        const { result } = await renderHookWithStoreProvider(
            () => useYieldApprovalReview({ flowData, flowKey: 'local-flow', transactionType }),
            { services: { ...analyticsServices, store: { ...store, dispatch } } },
        );
        await act(() => result.current.submitApproval());
        expect(mockPush).toHaveBeenCalledWith({
            selectedAccount: account,
            isMevProtectionEnabled: false,
        });
        const outcomes = actions.filter(transactionsActions.transactionBroadcastStatus.match);
        expect(outcomes.map(action => action.payload)).toEqual([
            {
                account,
                flow: transactionType,
                ...(success ? { status: 'success', txid: 'local-sent' } : { status: 'error' }),
            },
        ]);
    },
);
