import { type RouteProp } from '@react-navigation/native';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import { type TestStore, fireEvent } from '@suite-native/test-utils-store';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import {
    createTradingLightStore,
    renderWithTradingProvider,
} from '../../__tests__/tradingTestUtils';
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

const mockAddListener = jest.fn(
    (
        _event: string,
        _listener: (e: {
            data: { action: { type: string; payload?: { count?: number } } };
        }) => void,
    ) => jest.fn(),
);

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            key: RootStackRoutes.TradingExchangeApproval,
            name: RootStackRoutes.TradingExchangeApproval,
            params: {},
        }) as RouteProp<RootStackParamList, RootStackRoutes.TradingExchangeApproval>,
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

const testQuote = mercuryoFixedWorstQuote;

describe('TradingExchangeApprovalScreen', () => {
    let store: TestStore;
    let unmount: (() => void) | undefined;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const renderScreen = (params: Record<string, unknown> = {}) => {
        const result = renderWithTradingProvider(
            <TradingExchangeApprovalScreen
                route={{ params } as any}
                navigation={{ addListener: mockAddListener } as any}
            />,
            { store, tradeType: 'exchange' },
        );

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockIsDeviceConnected = true;

        store = createTradingLightStore({ tradeType: 'exchange' });
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

    it('should clear selected quote on back navigation', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        renderScreen();

        // Simulate the beforeRemove event with a GO_BACK action (back button / swipe back).
        const [, listener] =
            mockAddListener.mock.calls.find(([event]) => event === 'beforeRemove') ?? [];
        listener?.({ data: { action: { type: 'GO_BACK' } } });

        const selectedQuote = selectTradingExchangeSelectedQuote(store.getState());
        expect(selectedQuote).toBeUndefined();
    });

    it('should not clear selected quote on programmatic popToTop (POP with count > 1)', () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        renderScreen();

        const [, listener] =
            mockAddListener.mock.calls.find(([event]) => event === 'beforeRemove') ?? [];
        listener?.({ data: { action: { type: 'POP', payload: { count: 3 } } } });

        const selectedQuote = selectTradingExchangeSelectedQuote(store.getState());
        expect(selectedQuote).toEqual({ ...testQuote, approvalType: 'MINIMAL' });
    });

    it('should render revoke success alert when isRevoked is true', () => {
        const { getByText } = renderScreen({ isRevoked: true });

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.revokeSuccessAlert'),
            ),
        ).toBeOnTheScreen();
    });

    it('should display device guard when device is not connected', () => {
        mockIsDeviceConnected = false;

        const { getByText } = renderScreen();

        expect(
            getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });
});
