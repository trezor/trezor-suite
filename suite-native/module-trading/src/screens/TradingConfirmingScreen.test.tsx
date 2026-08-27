import type { TransactionStatus } from '@suite-common/trading';
import {
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useAllowanceTxTracking,
} from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import { type TestStore, act, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';
import { exchangeQuotes } from '@suite-native/trading-fixtures';
import {
    useNavigationRemoveInterceptorAlert,
    useTransactionDetails,
} from '@suite-native/transaction-management';

import { TradingConfirmingScreen } from './TradingConfirmingScreen';
import { createTradingLightStore } from '../test-utils/tradingTestUtils';

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

    const renderScreen = async (
        routeProps: Partial<RootStackParamList[RootStackRoutes.TradingConfirming]> = {},
    ) => {
        routeParams = {
            flowType: 'approve',
            ...routeProps,
        };

        return await renderWithStoreProvider(
            <TradingConfirmingScreen navigation={mockNavigation} route={mockUseRoute()} />,
            { store },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
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

    it('should render approve header when variant is approve', async () => {
        const { getByTestId } = await renderScreen({ flowType: 'approve' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.approveHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should render revoke header when variant is revoke', async () => {
        const { getByTestId } = await renderScreen({ flowType: 'revoke' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingConfirmationScreen.revokeHeaderTitle', {
                symbol: 'USDC',
            }),
        );
    });

    it('should not navigate when transaction is not confirmed', async () => {
        await renderScreen();

        expect(mockNavigation.popToTop).not.toHaveBeenCalled();
        expect(mockNavigation.push).not.toHaveBeenCalled();
    });

    it('approve: navigates to TradingExchangePreview when the quote status becomes CONFIRM', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        await renderScreen({ flowType: 'approve' });

        expect(mockNavigation.push).not.toHaveBeenCalled();

        // Simulate the backend advancing the status (what the watch poll saves).
        await act(() => {
            store.dispatch(
                tradingExchangeActions.saveSelectedQuote({ ...testQuote, status: 'CONFIRM' }),
            );
        });

        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangePreview, {
            isApproved: true,
        });
    });

    it('approve: does not navigate while status stays APPROVAL_PENDING', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        store.dispatch(
            tradingExchangeActions.saveSelectedQuote({ ...testQuote, status: 'APPROVAL_PENDING' }),
        );

        await renderScreen({ flowType: 'approve' });

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

        await renderScreen({ flowType: 'revoke-and-approve' });

        expect(mockNavigation.push).not.toHaveBeenCalled();

        // Simulate the backend reporting the follow-up approval is required.
        await act(() => {
            store.dispatch(
                tradingExchangeActions.saveSelectedQuote({
                    ...testQuote,
                    approvalType: 'ZERO',
                    approvalSendTxHash: 'revoke-txid',
                    status: 'APPROVAL_REQ',
                }),
            );
        });

        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).toHaveBeenCalledWith(RootStackRoutes.TradingExchangeApproval, {
            isRevoked: true,
        });
        const persisted = selectTradingExchangeSelectedQuote(store.getState());
        expect(persisted).toBeDefined();
        expect(persisted?.approvalSendTxHash).toBeUndefined();
        expect(persisted?.approvalType).toBeUndefined();
        expect(persisted?.status).toBe('APPROVAL_REQ');
    });

    it('revoke: pops to top and clears selectedQuote', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        await renderScreen({ flowType: 'revoke' });

        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).not.toHaveBeenCalled();
        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });

    it('should render the explore in blockchain button', async () => {
        const { getByText } = await renderScreen();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingConfirmationScreen.exploreInBlockchain'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render date when transaction has blockTime', async () => {
        mockUseTransactionDetails.mockReturnValue({
            transaction: mockTransaction,
            openInBlockchain: mockOpenInBlockchain,
            isPending: false,
            tokenTransfer: undefined,
            explorerUrl: 'https://etherscan.io/tx/test-txid',
        });

        const { getByText } = await renderScreen();

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.date')),
        ).toBeOnTheScreen();
    });

    it('should clear selected quote on back navigation', async () => {
        await renderScreen();

        const interceptorOptions = mockUseNavigationRemoveInterceptorAlert.mock.calls.at(-1)?.[0];

        if (!interceptorOptions) {
            throw new Error('Expected useNavigationRemoveInterceptor to be called');
        }

        const { onRemoveConfirmed } = interceptorOptions;

        await act(() => {
            onRemoveConfirmed();
        });

        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should allow leaving without confirmation when approval transaction fails', async () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: { isConfirmed: false, isFailed: true, isPending: false } as TransactionStatus,
            approvalTxid: 'some-txid',
            setApprovalTxid: jest.fn(),
        });

        await renderScreen();

        expect(mockUseNavigationRemoveInterceptorAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                shouldPrevent: false,
            }),
        );
    });

    it('surfaces a backend error status and allows leaving without confirmation', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        store.dispatch(tradingExchangeActions.saveSelectedQuote({ ...testQuote, status: 'ERROR' }));

        await renderScreen({ flowType: 'approve' });

        expect(mockUseNavigationRemoveInterceptorAlert).toHaveBeenCalledWith(
            expect.objectContaining({ shouldPrevent: false }),
        );
        expect(mockNavigation.push).not.toHaveBeenCalled();
    });

    describe('analytics', () => {
        it('should report approval-confirming visit ', async () => {
            await renderScreen();

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-confirming', 'visit');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        });

        it('should report approval-confirming cancel on back navigation', async () => {
            store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
            await renderScreen();

            const interceptorOptions =
                mockUseNavigationRemoveInterceptorAlert.mock.calls.at(-1)?.[0];

            if (!interceptorOptions) {
                throw new Error('Expected useNavigationRemoveInterceptor to be called');
            }

            const { onRemoveConfirmed } = interceptorOptions;

            await act(() => {
                onRemoveConfirmed();
            });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-confirming', 'cancel');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(2);
        });

        it('should report revoke-confirming visit for revoke', async () => {
            await renderScreen({ flowType: 'revoke' });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('revoke-confirming', 'visit');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        });

        it('should report continue when on navigation to next screen', async () => {
            mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

            await renderScreen({ flowType: 'approve' });

            await act(() => {
                store.dispatch(
                    tradingExchangeActions.saveSelectedQuote({ ...testQuote, status: 'CONFIRM' }),
                );
            });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-confirming', 'continue');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(2);
        });
    });
});
