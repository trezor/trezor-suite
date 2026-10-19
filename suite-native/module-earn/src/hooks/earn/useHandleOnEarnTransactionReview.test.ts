import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { createDeferred } from '@trezor/utils';

import { useHandleOnEarnTransactionReview } from './useHandleOnEarnTransactionReview';

const mockAnalytics = mockNativeAnalytics();
const mockDispatch = jest.fn();
const mockForm = { outputs: [], options: [], selectedFee: 'normal' };
const mockPrecomposed = { type: 'final', outputs: [] };
const mockHandleReviewError = jest.fn();

jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ analytics: mockAnalytics, dispatch: mockDispatch }),
}));
jest.mock('@suite-common/mev', () => ({ selectIsMevProtectionFeatureEnabled: () => false }));
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({}),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountNetworkSymbol: () => 'eth',
    selectFormDraft: () => mockForm,
    pushStakeTransactionThunk: () => ({ type: 'test/push' }),
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

it.each(['fulfilled', 'rejected'] as const)(
    'reports confirmation before a %s broadcast result, once per send attempt',
    async requestStatus => {
        const broadcast = createDeferred<unknown>();
        mockDispatch.mockReturnValue(broadcast.promise);
        const { result } = await renderHookWithStoreProvider(() =>
            useHandleOnEarnTransactionReview({ accountKey: mockAccountKey(), stakeType: 'stake' }),
        );
        let send: Promise<string | undefined> | undefined;
        await act(() => {
            send = result.current.handlePush();
        });
        const confirmations = () =>
            mockAnalytics.report.mock.calls.filter(([event]) => event.type === 'staking/confirm');
        expect(confirmations()).toHaveLength(1);
        expect(confirmations()[0]?.[0]).toEqual({
            type: 'staking/confirm',
            payload: { action: 'stake', networkSymbol: 'eth' },
        });
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
    },
);
