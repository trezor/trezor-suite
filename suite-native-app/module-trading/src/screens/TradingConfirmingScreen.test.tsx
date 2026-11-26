import { StackActions } from '@react-navigation/native';
import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import {
    type AccountsRootState,
    type AllowanceTransactionStatus,
    useAllowanceTxTracking,
} from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { type TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { act, renderWithStoreProvider, userEvent, within } from '@suite-native/test-utils-store';
import { eth1NormalAccount, exchangeQuotes } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';
import {
    useNavigationRemoveInterceptorAlert,
    useTransactionDetails,
} from '@suite-native/transaction-management';

import { TradingConfirmingScreen } from './TradingConfirmingScreen';
import { EXCHANGE_CONFIRMATION_BUTTON_TEST_ID } from '../components/exchange/Confirmation/ExchangeConfirmationFooter';
import { EXCHANGE_CONFIRMATION_TRANSACTION_ID_ROW_TEST_ID } from '../components/exchange/Confirmation/ExchangeConfirmationTransactionIdRow';
import { createTradingTestStore } from '../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState;

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
const TXID = '0xapprovaltxid';

const mockAddListener = jest.fn(
    (
        _event: string,
        _listener: (e: {
            data: { action: { type: string; payload?: { count?: number } } };
        }) => void,
    ) => jest.fn(),
);

const mockParentNavigation = {
    dispatch: jest.fn(),
    getState: () => ({ key: 'root-stack' }),
};
const closeTradingFlowAction = { ...StackActions.popToTop(), target: 'root-stack' };

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    addListener: mockAddListener,
    getParent: () => mockParentNavigation,
} as any;

let routeParams: TradingStackParamList[TradingStackRoutes.TradingConfirming] = {
    flowType: 'approve',
};

const mockUseRoute = () => ({
    key: 'route-key',
    name: TradingStackRoutes.TradingConfirming as const,
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

const mockAllowanceTxStatus: AllowanceTransactionStatus = {
    isConfirmed: false,
    isFailed: false,
    isPending: false,
};

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useAllowanceTxTracking: jest.fn(),
}));

const mockAnalyticsReport = jest.fn();
const mockUseAllowanceTxTracking = useAllowanceTxTracking as jest.Mock;

describe('TradingConfirmingScreen', () => {
    let store: Store<State>;

    const renderScreen = (
        routeProps: Partial<TradingStackParamList[TradingStackRoutes.TradingConfirming]> = {},
    ) => {
        routeParams = {
            flowType: 'approve',
            ...routeProps,
        };

        return renderWithStoreProvider(
            <TradingConfirmingScreen navigation={mockNavigation} route={mockUseRoute()} />,
            {
                services: {
                    analytics: mockNativeAnalytics(mockAnalyticsReport),
                    store,
                    networks: mockNetworksServices(),
                },
            },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        store = createTradingTestStore({ tradeType: 'exchange' });
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
        status: {
            isConfirmed: true,
            isFailed: false,
            isPending: false,
        } as AllowanceTransactionStatus,
        approvalTxid: 'some-txid',
        setApprovalTxid: jest.fn(),
    };

    it('should render the trade header when variant is approve', async () => {
        const { getByTestId } = await renderScreen({ flowType: 'approve' });

        expect(getByTestId('@screen/sub-header/title')).toHaveTextContent(
            getTranslation('moduleTrading.tradingExchangeFlowScreen.screenTitle'),
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

        expect(mockParentNavigation.dispatch).not.toHaveBeenCalled();
        expect(mockNavigation.reset).not.toHaveBeenCalled();
    });

    it('approve: navigates to TradingExchangePreview when the quote status becomes CONFIRM', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        await renderScreen({ flowType: 'approve' });

        expect(mockNavigation.reset).not.toHaveBeenCalled();

        // Simulate the backend advancing the status (what the watch poll saves).
        await act(() => {
            store.dispatch(
                tradingExchangeActions.saveSelectedQuote({ ...testQuote, status: 'CONFIRM' }),
            );
        });

        expect(mockNavigation.reset).toHaveBeenCalledWith({
            index: 0,
            routes: [
                {
                    name: TradingStackRoutes.TradingExchangePreview,
                    params: { isApproved: true },
                },
            ],
        });
    });

    it('approve: does not navigate while status stays APPROVAL_PENDING', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        store.dispatch(
            tradingExchangeActions.saveSelectedQuote({ ...testQuote, status: 'APPROVAL_PENDING' }),
        );

        await renderScreen({ flowType: 'approve' });

        expect(mockParentNavigation.dispatch).not.toHaveBeenCalled();
        expect(mockNavigation.reset).not.toHaveBeenCalled();
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

        expect(mockNavigation.reset).not.toHaveBeenCalled();

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

        expect(mockNavigation.reset).toHaveBeenCalledWith({
            index: 0,
            routes: [
                {
                    name: TradingStackRoutes.TradingExchangeApproval,
                    params: { isRevoked: true },
                },
            ],
        });
        const persisted = selectTradingExchangeSelectedQuote(store.getState());
        expect(persisted).toBeDefined();
        expect(persisted?.approvalSendTxHash).toBeUndefined();
        expect(persisted?.approvalType).toBeUndefined();
        expect(persisted?.status).toBe('APPROVAL_REQ');
    });

    it('revoke: closes the trading flow and clears selectedQuote', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        await renderScreen({ flowType: 'revoke' });

        expect(mockParentNavigation.dispatch).toHaveBeenCalledWith(closeTradingFlowAction);
        expect(mockNavigation.reset).not.toHaveBeenCalled();
        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });

    it('approve: renders the approve step with the transaction ID row and no explore button', async () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: mockAllowanceTxStatus,
            approvalTxid: TXID,
            setApprovalTxid: jest.fn(),
        });

        const { getByTestId, getByText, queryByText } = await renderScreen({
            flowType: 'approve',
        });

        expect(getByTestId('@step-cards/current')).toHaveTextContent(
            getTranslation('stepCards.stepper', { stepNumber: 1, stepCount: 2 }) +
                getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.title'),
            { exact: false },
        );
        expect(within(getByTestId('@step-cards/current')).getByText(TXID)).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.transactionId')),
        ).toBeOnTheScreen();
        expect(
            queryByText(
                getTranslation('moduleTrading.tradingConfirmationScreen.exploreInBlockchain'),
            ),
        ).toBeNull();
    });

    it('approve: renders the increase step when the quote has a preapproved limit', async () => {
        store.dispatch(
            tradingExchangeActions.saveSelectedQuote({
                ...testQuote,
                preapprovedStringAmount: '10',
            }),
        );

        const { getByTestId } = await renderScreen({ flowType: 'approve' });

        expect(getByTestId('@step-cards/current')).toHaveTextContent(
            getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.title'),
            { exact: false },
        );
    });

    it('revoke-and-approve: renders the revoke step as the first of three steps', async () => {
        const { getByTestId, getAllByTestId } = await renderScreen({
            flowType: 'revoke-and-approve',
        });

        expect(getByTestId('@step-cards/current')).toHaveTextContent(
            getTranslation('stepCards.stepper', { stepNumber: 1, stepCount: 3 }) +
                getTranslation('moduleTrading.tradingExchangeFlowScreen.revokeStep.title'),
            { exact: false },
        );
        expect(getAllByTestId('@step-cards/next')).toHaveLength(2);
    });

    it('revoke: renders the transaction ID row without the step cards', async () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: mockAllowanceTxStatus,
            approvalTxid: TXID,
            setApprovalTxid: jest.fn(),
        });

        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));

        const { getByText, queryByTestId } = await renderScreen({ flowType: 'revoke' });

        expect(getByText(TXID)).toBeOnTheScreen();
        expect(queryByTestId('@step-cards/current')).toBeNull();
    });

    it('opens the transaction on blockchain when the transaction ID row is pressed', async () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: mockAllowanceTxStatus,
            approvalTxid: TXID,
            setApprovalTxid: jest.fn(),
        });

        const { getByTestId } = await renderScreen();

        await userEvent.press(getByTestId(EXCHANGE_CONFIRMATION_TRANSACTION_ID_ROW_TEST_ID));

        expect(mockOpenInBlockchain).toHaveBeenCalledTimes(1);
    });

    it('renders the confirming footer while the transaction is not failed', async () => {
        const { getByTestId, getByText } = await renderScreen({ flowType: 'approve' });

        expect(getByTestId(`${EXCHANGE_CONFIRMATION_BUTTON_TEST_ID}/loading`)).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.approveHint')),
        ).toBeOnTheScreen();
    });

    it('renders the error banner instead of the footer when the transaction fails', async () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: { isConfirmed: false, isFailed: true, isPending: false },
            approvalTxid: TXID,
            setApprovalTxid: jest.fn(),
        });

        const { getByText, queryByTestId } = await renderScreen({ flowType: 'approve' });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.error')),
        ).toBeOnTheScreen();
        expect(queryByTestId(EXCHANGE_CONFIRMATION_BUTTON_TEST_ID)).toBeNull();
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
        expect(mockParentNavigation.dispatch).toHaveBeenCalledWith(closeTradingFlowAction);
    });

    it('should allow leaving without confirmation when approval transaction fails', async () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: {
                isConfirmed: false,
                isFailed: true,
                isPending: false,
            } as AllowanceTransactionStatus,
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
        expect(mockNavigation.reset).not.toHaveBeenCalled();
    });

    describe('analytics', () => {
        it('should report approval-confirming visit ', async () => {
            await renderScreen();

            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({ step: 'approval-confirming', action: 'visit' }),
            });
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

            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({ step: 'approval-confirming', action: 'cancel' }),
            });
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(2);
        });

        it('should report revoke-confirming visit for revoke', async () => {
            await renderScreen({ flowType: 'revoke' });

            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({ step: 'revoke-confirming', action: 'visit' }),
            });
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

            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({
                    step: 'approval-confirming',
                    action: 'continue',
                }),
            });
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(2);
        });
    });
});
