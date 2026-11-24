import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, type FormDraftRootState } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { createDeferred } from '@trezor/utils';

import { useHandleOnEarnTransactionReview } from './useHandleOnEarnTransactionReview';

const mockAnalytics = mockNativeAnalytics();
const mockBroadcast = jest.fn();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const analyticsServices: NativeAnalyticsDep = { analytics: mockAnalytics };
const mockPrecomposed = { type: 'final', outputs: [] };
const mockHandleReviewError = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({}),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    pushStakeTransactionThunk: () => () => mockBroadcast(),
}));
jest.mock('./useEarnReviewBackNavigation', () => ({
    useEarnReviewBackNavigation: () => ({
        closeReview: jest.fn(),
        markReviewNavigationSuccess: jest.fn(),
    }),
}));
jest.mock('./useEarnSelectedPrecomposedTransaction', () => ({
    useEarnSelectedPrecomposedTransaction: () => mockPrecomposed,
}));
jest.mock('./useHandleEarnReviewError', () => ({
    useHandleEarnReviewError: () => mockHandleReviewError,
}));

beforeEach(() => jest.clearAllMocks());

it.each([
    [true, 'fulfilled'],
    [false, 'rejected'],
] as const)(
    'reports confirmation with draft=%s before a %s broadcast result, once per send attempt',
    async (hasDraft, requestStatus) => {
        const broadcast = createDeferred<unknown>();
        mockBroadcast.mockReturnValue(broadcast.promise);
        const formDraftKey = getFormDraftKey('stake', account.key);
        const store = createStoreFromPreloadedState<
            AccountsRootState & FormDraftRootState & MessageSystemRootState
        >({
            messageSystem: messageSystemInitialState,
            wallet: {
                accounts: [account],
                formDrafts: hasDraft
                    ? { [formDraftKey]: { options: ['ethereumNonce'], selectedFee: 'custom' } }
                    : {},
            },
        });
        const { result } = await renderHookWithStoreProvider(
            () =>
                useHandleOnEarnTransactionReview({
                    accountKey: account.key,
                    stakeType: 'stake',
                    isPushing: false,
                }),
            { services: { ...analyticsServices, store } },
        );
        let send: Promise<string | undefined> | undefined;
        await act(() => {
            send = result.current.handlePush();
        });
        const confirmations = () =>
            mockAnalytics.report.mock.calls.filter(
                ([event]) => event.type === 'transaction-created',
            );
        expect(confirmations()).toHaveLength(1);
        expect(confirmations()[0]?.[0]).toMatchObject({
            type: 'transaction-created',
            payload: {
                action: 'sent',
                txType: 'stake',
                symbol: 'eth',
                ethereumNonce: hasDraft,
                transactionData: false,
                bitcoinLocktime: false,
                destinationTag: false,
                selectedFee: hasDraft ? 'custom' : 'normal',
            },
        });
        expect(mockAnalytics.report).toHaveBeenCalledTimes(1);
        await act(async () => {
            broadcast.resolve({
                type: `push/${requestStatus}`,
                meta: { requestId: 'request', requestStatus },
                payload:
                    requestStatus === 'fulfilled'
                        ? { txid: 'fixture-txid' }
                        : { error: 'push-transaction-failed' },
            });
            await send;
        });
        expect(confirmations()).toHaveLength(1);
        expect(mockAnalytics.report).toHaveBeenCalledTimes(1);
    },
);
