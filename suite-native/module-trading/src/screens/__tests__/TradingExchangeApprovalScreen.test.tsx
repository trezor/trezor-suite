import { type RouteProp } from '@react-navigation/native';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import {
    type TestStore,
    fireEvent,
    initStore,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import { eth1NormalAccount, exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { TradingExchangeApprovalScreen } from '../TradingExchangeApprovalScreen';

const mockShowSheet = jest.fn();
const mockHideSheet = jest.fn();
const mockConfirmApproval = jest.fn().mockResolvedValue({});
const mockOnApprovalTypeChange = jest.fn();

jest.mock('../../hooks/exchange/Approval/useApprovalFlow', () => ({
    useApprovalFlow: () => ({
        quote: undefined,
        isReady: true,
        isConfirming: false,
        error: null,
        confirmApproval: mockConfirmApproval,
        onApprovalTypeChange: mockOnApprovalTypeChange,
    }),
}));

jest.mock('../../hooks/exchange/Approval/useEvmApprovalFees', () => ({
    useEvmApprovalFees: () => ({
        fee: '100000',
        isLoading: false,
        error: null,
        composeFees: jest.fn(),
    }),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
    useNavigation: () => ({
        setOptions: jest.fn(),
    }),
}));

jest.mock('@suite-native/trading-atoms', () => ({
    ...jest.requireActual('@suite-native/trading-atoms'),
    useBottomSheetControls: () => ({
        isSheetVisible: false,
        showSheet: mockShowSheet,
        hideSheet: mockHideSheet,
    }),
}));

let mockIsDeviceConnected = true;
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockIsDeviceConnected,
}));

const testQuote = exchangeQuotes[0];

describe('TradingExchangeApprovalScreen', () => {
    let store: TestStore;
    let unmount: (() => void) | undefined;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const renderScreen = () => {
        const result = renderWithStoreProvider(
            <TradingExchangeApprovalScreen route={{ params: {} } as any} navigation={{} as any} />,
            { store },
        );

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockIsDeviceConnected = true;

        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        store = initStore(preloadedState).store;
        store.dispatch(tradingExchangeActions.savePreselectedQuote(testQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should confirm approval on mount', () => {
        renderScreen();

        expect(mockConfirmApproval).toHaveBeenCalledTimes(1);
        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('should render the approval screen with quote details', () => {
        const { getByText } = renderScreen();

        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should display provider information correctly', () => {
        const { getByText } = renderScreen();

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should open bottom sheet when limit row is pressed', async () => {
        const { findByText } = renderScreen();

        const pressableElement = await findByText('Limit');

        fireEvent.press(pressableElement);
        expect(mockShowSheet).toHaveBeenCalledTimes(1);
    });

    it('should render continue button', () => {
        const { getByText } = renderScreen();

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();
    });

    it('should render alert when no quote is provided', () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { getByText, queryByText } = renderScreen();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert'),
            ),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('generic.buttons.continue'))).toBeNull();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith('No quote to confirm approval');
    });

    it('should clear selected quote on unmount', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        const { unmount: localUnmount } = renderScreen();

        localUnmount();
        unmount = undefined;

        const selectedQuote = selectTradingExchangeSelectedQuote(store.getState());
        expect(selectedQuote).toBeUndefined();
    });

    it('should display device guard when device is not connected', () => {
        mockIsDeviceConnected = false;

        const { getByText } = renderScreen();

        expect(
            getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });
});
