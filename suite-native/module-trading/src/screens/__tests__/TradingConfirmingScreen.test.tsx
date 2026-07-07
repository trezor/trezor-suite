import type { TransactionStatus } from '@suite-common/trading';
import {
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useAllowanceTxTracking,
} from '@suite-common/trading';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import { getTranslation } from '@suite-native/intl';
import { type RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import { type TestStore, act, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';
import { exchangeQuotes } from '@suite-native/trading-fixtures';
import {
    useNavigationRemoveInterceptorAlert,
    useTransactionDetails,
} from '@suite-native/transaction-management';

import { createTradingLightStore } from '../../__tests__/tradingTestUtils';
import {
    APPROVAL_STATUS_POLL_INTERVAL_MS,
    APPROVAL_STATUS_POLL_MAX_ATTEMPTS,
    TradingConfirmingScreen,
} from '../TradingConfirmingScreen';

const testSpender = '0x1234567890123456789012345678901234567890';
const approveCalldata = buildApprovalTransactionData({ spender: testSpender, amount: '1000000' });
const revokeCalldata = buildApprovalTransactionData({ spender: testSpender, amount: '0' });

const mockOpenInBlockchain = jest.fn();

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useNavigationRemoveInterceptorAlert: jest.fn(),
    useTransactionDetails: jest.fn(),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => true,
}));

const mockConfirmApproval = jest.fn().mockResolvedValue({});
const mockAbortConfirmApproval = jest.fn();

jest.mock('../../hooks/exchange/Approval/useApprovalFlow', () => ({
    useApprovalFlow: () => ({
        confirmApproval: mockConfirmApproval,
        abortConfirmApproval: mockAbortConfirmApproval,
    }),
}));

const mockUseTransactionDetails = useTransactionDetails as jest.Mock;
const mockUseNavigationRemoveInterceptorAlert = jest.mocked(useNavigationRemoveInterceptorAlert);

const testQuote = exchangeQuotes[0];

const mockAddListener = jest.fn(
    (
        _event: string,
        _listener: (e: {
            data: { action: { type: string; payload?: { count?: number } } };
        }) => void,
    ) => jest.fn(),
);

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    popToTop: jest.fn(),
    push: jest.fn(),
    setOptions: jest.fn(),
    addListener: mockAddListener,
    canGoBack: jest.fn(() => true),
    isFocused: jest.fn(() => true),
    getState: jest.fn(() => ({ routes: [{ key: 'root' }, { key: 'confirming' }] })),
} as any;

let routeParams: RootStackParamList[RootStackRoutes.TradingConfirming] = {
    flowType: 'approve',
};

const mockUseRoute = () => ({
    key: 'route-key',
    name: RootStackRoutes.TradingConfirming as const,
    params: routeParams,
});

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => mockUseRoute(),
    useFocusEffect: (callback: () => void) => {
        require('react').useEffect(callback, []);
    },
}));

const mockAllowanceTxStatus: TransactionStatus = {
    isConfirmed: false,
    isFailed: false,
    isPending: false,
};

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useAllowanceTxTracking: jest.fn(),
}));

const mockAnalyticsReport = jest.fn();
jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useExchangeAnalyticsStepReport:
        (action: unknown) =>
        (...args: unknown[]) =>
            mockAnalyticsReport(action, ...args),
}));

const mockUseAllowanceTxTracking = useAllowanceTxTracking as jest.Mock;

describe('TradingConfirmingScreen', () => {
    let store: TestStore;

    const renderScreen = (
        routeProps: Partial<RootStackParamList[RootStackRoutes.TradingConfirming]> = {},
    ) => {
        routeParams = {
            flowType: 'approve',
            ...routeProps,
        };

        return renderWithStoreProvider(
            <TradingConfirmingScreen navigation={mockNavigation} route={mockUseRoute()} />,
            { store },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockConfirmApproval.mockResolvedValue({});
        store = createTradingLightStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        mockUseAllowanceTxTracking.mockReturnValue({
            status: mockAllowanceTxStatus,
            approvalTxid: null,
            setApprovalTxid: jest.fn(),
        });
        mockUseTransactionDetails.mockReturnValue({
            transaction: null,
            openInBlockchain: mockOpenInBlockchain,
            isPending: false,
            tokenTransfer: undefined,
            explorerUrl: null,
        });
    });

    const confirmedStatus = {
        status: { isConfirmed: true, isFailed: false, isPending: false } as TransactionStatus,
        approvalTxid: 'some-txid',
        setApprovalTxid: jest.fn(),
    };

    it('should render approve header when variant is approve', () => {
        const { getByTestId } = renderScreen({ flowType: 'approve' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.approveHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should render revoke header when variant is revoke', () => {
        const { getByTestId } = renderScreen({ flowType: 'revoke' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.revokeHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should not navigate when transaction is not confirmed', () => {
        renderScreen();

        expect(mockNavigation.popToTop).not.toHaveBeenCalled();
        expect(mockNavigation.push).not.toHaveBeenCalled();
    });

    it('approve: navigates to TradingExchangePreview after confirmApproval succeeds', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        renderScreen({ flowType: 'approve' });

        await act(async () => {
            await Promise.resolve(); // flush confirmApproval promise
        });

        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangePreview, {
            isApproved: true,
        });
    });

    it('approve: polls confirmApproval while API returns APPROVAL_PENDING and navigates only on CONFIRM', async () => {
        jest.useFakeTimers();
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        mockConfirmApproval
            .mockResolvedValueOnce({ ...testQuote, status: 'APPROVAL_PENDING' })
            .mockResolvedValueOnce({ ...testQuote, status: 'CONFIRM' });

        renderScreen({ flowType: 'approve' });

        await act(async () => {
            await jest.advanceTimersByTimeAsync(0);
        });

        // The swap transaction is not ready yet — no fabricated CONFIRM, no navigation.
        expect(selectTradingExchangeSelectedQuote(store.getState())?.status).not.toBe('CONFIRM');
        expect(mockNavigation.popToTop).not.toHaveBeenCalled();

        await act(async () => {
            await jest.advanceTimersByTimeAsync(APPROVAL_STATUS_POLL_INTERVAL_MS);
        });

        expect(mockConfirmApproval).toHaveBeenCalledTimes(2);
        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangePreview, {
            isApproved: true,
        });

        jest.useRealTimers();
    });

    it('approve: keeps polling while CONFIRM still carries the approval calldata', async () => {
        jest.useFakeTimers();
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        mockConfirmApproval
            .mockResolvedValueOnce({
                ...testQuote,
                status: 'CONFIRM',
                dexTx: { data: approveCalldata },
            })
            .mockResolvedValueOnce({
                ...testQuote,
                status: 'CONFIRM',
                dexTx: { data: '0xdeadbeef' },
            });

        renderScreen({ flowType: 'approve' });

        await act(async () => {
            await jest.advanceTimersByTimeAsync(0);
        });

        // CONFIRM but still approval calldata — must keep polling, not navigate.
        expect(mockNavigation.popToTop).not.toHaveBeenCalled();

        await act(async () => {
            await jest.advanceTimersByTimeAsync(APPROVAL_STATUS_POLL_INTERVAL_MS);
        });

        expect(mockConfirmApproval).toHaveBeenCalledTimes(2);
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangePreview, {
            isApproved: true,
        });

        jest.useRealTimers();
    });

    it('approve: stops polling and stays on screen after max attempts', async () => {
        jest.useFakeTimers();
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        mockConfirmApproval.mockResolvedValue({ ...testQuote, status: 'APPROVAL_PENDING' });

        renderScreen({ flowType: 'approve' });

        await act(async () => {
            await jest.advanceTimersByTimeAsync(
                APPROVAL_STATUS_POLL_INTERVAL_MS * (APPROVAL_STATUS_POLL_MAX_ATTEMPTS + 1),
            );
        });

        // Initial call + one per attempt, then it gives up without navigating.
        expect(mockConfirmApproval).toHaveBeenCalledTimes(APPROVAL_STATUS_POLL_MAX_ATTEMPTS + 1);
        expect(mockNavigation.push).not.toHaveBeenCalled();

        jest.useRealTimers();
    });

    it('approve: does not navigate when confirmApproval fails', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        mockConfirmApproval.mockResolvedValue(undefined);

        renderScreen({ flowType: 'approve' });

        await act(async () => {
            await Promise.resolve();
        });

        expect(mockNavigation.popToTop).not.toHaveBeenCalled();
        expect(mockNavigation.push).not.toHaveBeenCalled();
    });

    it('revoke-and-approve: navigates to TradingExchangeApproval and strips revoke-tx artifacts from selectedQuote', async () => {
        // Seed selectedQuote with revoke artifacts that the post-revoke confirmExchangeTradeThunk would have written.
        store.dispatch(
            tradingExchangeActions.saveSelectedQuote({
                ...testQuote,
                approvalType: 'ZERO',
                approvalSendTxHash: 'revoke-txid',
                status: 'APPROVAL_PENDING',
            }),
        );
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderScreen({ flowType: 'revoke-and-approve' });

        await act(async () => {
            await Promise.resolve();
        });

        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({
                approvalSendTxHash: undefined,
                approvalType: 'MINIMAL',
                status: 'APPROVAL_REQ',
            }),
        );
        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangeApproval, {
            isRevoked: true,
        });
        const dispatchedActions = dispatchSpy.mock.calls.map(([action]) => action);
        // savePreselectedQuote action no longer exists; assert against the action-type string.
        expect(
            dispatchedActions.find(
                (action: any) => action?.type === '@trading-exchange/savePreselectedQuote',
            ),
        ).toBeUndefined();
        const persisted = selectTradingExchangeSelectedQuote(store.getState());
        expect(persisted).toBeDefined();
        expect(persisted?.approvalSendTxHash).toBeUndefined();
        expect(persisted?.approvalType).toBe('MINIMAL');
        expect(persisted?.status).toBe('APPROVAL_REQ');

        dispatchSpy.mockRestore();
    });

    it('revoke-and-approve: polls confirmApproval while API still returns the revoke dexTx', async () => {
        jest.useFakeTimers();
        store.dispatch(
            tradingExchangeActions.saveSelectedQuote({
                ...testQuote,
                approvalType: 'ZERO',
                approvalSendTxHash: 'revoke-txid',
                status: 'APPROVAL_PENDING',
            }),
        );
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        mockConfirmApproval
            .mockResolvedValueOnce({
                ...testQuote,
                status: 'APPROVAL_REQ',
                dexTx: { data: revokeCalldata },
            })
            .mockResolvedValueOnce({
                ...testQuote,
                status: 'APPROVAL_REQ',
                dexTx: { data: approveCalldata },
            });

        renderScreen({ flowType: 'revoke-and-approve' });

        await act(async () => {
            await jest.advanceTimersByTimeAsync(0);
        });

        // The API still returns the revoke dexTx — no navigation yet.
        expect(mockNavigation.popToTop).not.toHaveBeenCalled();

        await act(async () => {
            await jest.advanceTimersByTimeAsync(APPROVAL_STATUS_POLL_INTERVAL_MS);
        });

        expect(mockConfirmApproval).toHaveBeenCalledTimes(2);
        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangeApproval, {
            isRevoked: true,
        });

        jest.useRealTimers();
    });

    it('revoke: pops to top and clears selectedQuote', () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        renderScreen({ flowType: 'revoke' });

        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).not.toHaveBeenCalled();
        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });

    it('should render the explore in blockchain button', () => {
        const { getByText } = renderScreen();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingConfirmationScreen.exploreInBlockchain'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render date when transaction has blockTime', () => {
        mockUseTransactionDetails.mockReturnValue({
            transaction: mockTransaction,
            openInBlockchain: mockOpenInBlockchain,
            isPending: false,
            tokenTransfer: undefined,
            explorerUrl: 'https://etherscan.io/tx/test-txid',
        });

        const { getByText } = renderScreen();

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.date')),
        ).toBeOnTheScreen();
    });

    it('should clear selected quote on back navigation', () => {
        renderScreen();

        const interceptorOptions = mockUseNavigationRemoveInterceptorAlert.mock.calls.at(-1)?.[0];

        if (!interceptorOptions) {
            throw new Error('Expected useNavigationRemoveInterceptor to be called');
        }

        const { onRemoveConfirmed } = interceptorOptions;

        act(() => {
            onRemoveConfirmed();
        });

        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should allow leaving without confirmation when approval transaction fails', () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: { isConfirmed: false, isFailed: true, isPending: false } as TransactionStatus,
            approvalTxid: 'some-txid',
            setApprovalTxid: jest.fn(),
        });

        renderScreen();

        expect(mockUseNavigationRemoveInterceptorAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                shouldPrevent: false,
            }),
        );
    });

    describe('analytics', () => {
        it('should report approval-confirming visit ', () => {
            renderScreen();

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-confirming', 'visit');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        });

        it('should report approval-confirming cancel on back navigation', () => {
            store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
            renderScreen();

            const interceptorOptions =
                mockUseNavigationRemoveInterceptorAlert.mock.calls.at(-1)?.[0];

            if (!interceptorOptions) {
                throw new Error('Expected useNavigationRemoveInterceptor to be called');
            }

            const { onRemoveConfirmed } = interceptorOptions;

            act(() => {
                onRemoveConfirmed();
            });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-confirming', 'cancel');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(2);
        });

        it('should report revoke-confirming visit for revoke', () => {
            renderScreen({ flowType: 'revoke' });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('revoke-confirming', 'visit');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        });

        it('should report continue when on navigation to next screen', async () => {
            mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
            mockConfirmApproval.mockResolvedValue({ ...testQuote, status: 'CONFIRM' });

            renderScreen({ flowType: 'approve' });

            await act(async () => {
                await Promise.resolve();
            });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-confirming', 'continue');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(2);
        });
    });
});
