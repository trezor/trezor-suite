import { tradingExchangeActions, useAllowanceTxTracking } from '@suite-common/trading';
import type { TransactionStatus } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { type TestStore, renderWithStoreProvider } from '@suite-native/test-utils-store';
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

const mockUseTransactionDetails = useTransactionDetails as jest.Mock;

const testQuote = exchangeQuotes[0];

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    popToTop: jest.fn(),
    setOptions: jest.fn(),
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

    it('should call navigation.popToTop when transaction is confirmed', () => {
        mockUseAllowanceTxTracking.mockReturnValue({
            status: { isConfirmed: true, isFailed: false, isPending: false } as TransactionStatus,
            approvalTxid: 'some-txid',
            setApprovalTxid: jest.fn(),
        });

        renderScreen();

        expect(mockNavigation.popToTop).toHaveBeenCalled();
    });

    it('should not call navigation.popToTop when transaction is not confirmed', () => {
        renderScreen();

        expect(mockNavigation.popToTop).not.toHaveBeenCalled();
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
});
