import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useEarnReviewBackNavigation } from './useEarnReviewBackNavigation';
import { useYieldActionReviewBackNavigation } from '../yield/useYieldActionReviewBackNavigation';
import { useYieldApprovalReviewNavigation } from '../yield/useYieldApprovalReviewNavigation';

type RemoveEvent = { data: { action: { type: string } }; preventDefault: () => void };
const mockNavigation = {
    addListener: jest.fn<() => void, [string, (event: RemoveEvent) => void]>(),
    isFocused: jest.fn(() => true),
    dispatch: jest.fn(),
    goBack: jest.fn(),
};
const mockShowCancellationAlert = jest.fn();
const mockAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const mockSerializedTx = { tx: 'test-signed-transaction' };
let mockIsSigned = true;
let mockIsPushing = false;
let mockApprovalType: 'approve' | 'revoke' = 'approve';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useDisableIOSGesture: () => undefined,
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountByKey: () => mockAccount,
    selectSendSerializedTx: () => (mockIsSigned ? mockSerializedTx : undefined),
    cancelSignSendFormTransactionThunk: () => ({ type: 'test/cancel-signing' }),
}));
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    selectIsTransactionReviewInProgress: () => true,
    useShowReviewCancellationAlert: () => mockShowCancellationAlert,
}));
jest.mock('../yield/useShowYieldReviewCancellationAlert', () => ({
    useShowYieldReviewCancellationAlert: () => mockShowCancellationAlert,
}));

const useStakingReviewNavigation = () =>
    useEarnReviewBackNavigation({
        formType: 'stake',
        accountKey: mockAccount.key,
        isPushing: mockIsPushing,
    });
const useYieldReviewNavigation = () => {
    let reviewStatus: 'sending' | 'signed' | 'idle' = 'idle';
    if (mockIsPushing) reviewStatus = 'sending';
    else if (mockIsSigned) reviewStatus = 'signed';

    return useYieldActionReviewBackNavigation({
        networkSymbol: mockAccount.symbol,
        reviewStatus,
    });
};
const useApprovalReviewNavigation = () =>
    useYieldApprovalReviewNavigation({
        flowKey: 'test-flow',
        networkSymbol: mockAccount.symbol,
        isSigned: mockIsSigned && !mockIsPushing,
        shouldConfirmCancellation: true,
        transactionType: mockApprovalType,
    });

const renderCancellation = async (flow: 'stake' | 'yield' | 'approve' | 'revoke') => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
    mockApprovalType = flow === 'revoke' ? 'revoke' : 'approve';
    let useReviewNavigation: () => { markReviewNavigationSuccess: () => void } =
        useApprovalReviewNavigation;
    if (flow === 'stake') useReviewNavigation = useStakingReviewNavigation;
    else if (flow === 'yield') useReviewNavigation = useYieldReviewNavigation;
    const view = await renderHookWithStoreProvider(() => useReviewNavigation(), { services });
    const listener = mockNavigation.addListener.mock.calls.at(-1)?.[1];
    if (!listener) throw new Error('Missing review removal listener');

    const remove = async (type = 'GO_BACK') => {
        await act(() => {
            listener({ data: { action: { type } }, preventDefault: jest.fn() });
        });
    };

    return { ...view, analytics: services.analytics, remove };
};

describe.each(['stake', 'yield', 'approve', 'revoke'] as const)(
    '%s signed review cancellation analytics',
    flow => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockIsSigned = true;
            mockIsPushing = false;
            mockNavigation.isFocused.mockReturnValue(true);
            mockNavigation.addListener.mockReturnValue(jest.fn());
            mockShowCancellationAlert.mockResolvedValue({ wasReviewCanceled: true });
        });

        it('reports a confirmed signed review cancellation exactly once', async () => {
            const { analytics, remove } = await renderCancellation(flow);
            await remove();
            await remove();

            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith({
                type: 'transaction/cancel',
                payload: {
                    txType: flow === 'stake' ? 'stake' : 'yield',
                    networkSymbol: 'eth',
                    stage: 'review',
                },
            });
        });

        it('does not report cancellation when the user keeps editing', async () => {
            mockShowCancellationAlert.mockResolvedValue({ wasReviewCanceled: false });
            const { analytics, remove } = await renderCancellation(flow);
            await remove();

            expect(analytics.report).not.toHaveBeenCalled();
        });

        it('does not report a successful review exit as cancellation', async () => {
            const { analytics, remove, result } = await renderCancellation(flow);
            await act(() => result.current.markReviewNavigationSuccess());
            await remove();

            expect(analytics.report).not.toHaveBeenCalled();
        });

        it('does not report an unsigned review as a signed review cancellation', async () => {
            mockIsSigned = false;
            const { analytics, remove } = await renderCancellation(flow);
            await remove();

            expect(analytics.report).not.toHaveBeenCalled();
        });

        it('does not report a background screen removed from the stack', async () => {
            mockNavigation.isFocused.mockReturnValue(false);
            const { analytics, remove } = await renderCancellation(flow);
            await remove();

            expect(analytics.report).not.toHaveBeenCalled();
        });

        it('does not report cancellation after sending has started', async () => {
            mockIsPushing = true;
            const { analytics, remove } = await renderCancellation(flow);
            await remove();

            expect(analytics.report).not.toHaveBeenCalled();
        });

        it.each(['REPLACE', 'RESET', 'POP', 'POP_TO'])(
            'does not count a programmatic %s as user cancellation',
            async type => {
                const { analytics, remove } = await renderCancellation(flow);
                await remove(type);

                expect(analytics.report).not.toHaveBeenCalled();
            },
        );
    },
);
