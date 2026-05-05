import {
    selectTradingExchangePreselectedQuote,
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useAllowanceTxTracking,
} from '@suite-common/trading';
import type { TransactionStatus } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { type TestStore, act, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';
import { exchangeQuotes } from '@suite-native/trading-fixtures';
import { useTransactionDetails } from '@suite-native/transaction-management';

import { createTradingLightStore } from '../../__tests__/tradingTestUtils';
import { TradingConfirmingScreen } from '../TradingConfirmingScreen';

const mockOpenInBlockchain = jest.fn();

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useTransactionDetails: jest.fn(),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => true,
}));

const mockConfirmApproval = jest.fn().mockResolvedValue({});

jest.mock('../../hooks/exchange/Approval/useApprovalFlow', () => ({
    useApprovalFlow: () => ({
        confirmApproval: mockConfirmApproval,
    }),
}));

const mockUseTransactionDetails = useTransactionDetails as jest.Mock;

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

const mockAllowanceTxStatus: TransactionStatus = {
    isConfirmed: false,
    isFailed: false,
    isPending: false,
};

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useAllowanceTxTracking: jest.fn(),
}));

const mockUseAllowanceTxTracking = useAllowanceTxTracking as jest.Mock;

describe('TradingConfirmingScreen', () => {
    let store: TestStore;

    const renderScreen = (
        routeProps: Partial<TradingStackParamList[TradingStackRoutes.TradingConfirming]> = {},
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
        expect(mockNavigation.push).toHaveBeenCalledWith(
            TradingStackRoutes.TradingExchangePreview,
            {
                isApproved: true,
            },
        );
    });

    it('approve: saves quote with CONFIRM status when confirmApproval returns APPROVAL_PENDING', async () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);
        mockConfirmApproval.mockResolvedValue({ ...testQuote, status: 'APPROVAL_PENDING' });

        renderScreen({ flowType: 'approve' });

        await act(async () => {
            await Promise.resolve();
        });

        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual(
            expect.objectContaining({ status: 'CONFIRM' }),
        );
        expect(mockNavigation.popToTop).toHaveBeenCalled();
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

    it('revoke-and-approve: navigates to TradingExchangeApproval and clears selectedQuote', () => {
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        renderScreen({ flowType: 'revoke-and-approve' });

        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).toHaveBeenCalledWith(
            TradingStackRoutes.TradingExchangeApproval,
            { isRevoked: true },
        );
        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });

    it('revoke: pops to top and clears selectedQuote and preselectedQuote', () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(testQuote));
        mockUseAllowanceTxTracking.mockReturnValue(confirmedStatus);

        renderScreen({ flowType: 'revoke' });

        expect(mockNavigation.popToTop).toHaveBeenCalled();
        expect(mockNavigation.push).not.toHaveBeenCalled();
        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
        expect(selectTradingExchangePreselectedQuote(store.getState())).toBeUndefined();
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

        expect(getByText('Date')).toBeOnTheScreen();
    });

    it('should clear selected quote on back navigation', () => {
        renderScreen();

        const [, listener] =
            mockAddListener.mock.calls.find(([event]) => event === 'beforeRemove') ?? [];
        listener?.({ data: { action: { type: 'GO_BACK' } } });

        expect(selectTradingExchangeSelectedQuote(store.getState())).toBeUndefined();
    });

    it('should not clear selected quote on programmatic popToTop (POP with count > 1)', () => {
        renderScreen();

        const [, listener] =
            mockAddListener.mock.calls.find(([event]) => event === 'beforeRemove') ?? [];
        listener?.({ data: { action: { type: 'POP', payload: { count: 3 } } } });

        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual(testQuote);
    });
});
