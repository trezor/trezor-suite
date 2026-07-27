import { type NavigationAction, type RouteProp } from '@react-navigation/native';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    useNavigationRemoveActionInterceptor,
} from '@suite-native/navigation';
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
const mockNavigationDispatch = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);

const triggerPreventNavigationRemove = (action: NavigationAction = { type: 'GO_BACK' }) => {
    const params = mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

    params?.onInterceptedAction?.(action);
};

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
            key: RootStackRoutes.TradingExchangeApproval,
            name: RootStackRoutes.TradingExchangeApproval,
            params: {},
        }) as RouteProp<RootStackParamList, RootStackRoutes.TradingExchangeApproval>,
    useNavigation: () => ({
        setOptions: jest.fn(),
    }),
}));

const mockAnalyticsReport = jest.fn();
jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useExchangeAnalyticsStepReport:
        (action: unknown) =>
        (...args: unknown[]) =>
            mockAnalyticsReport(action, ...args),
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
                navigation={{ dispatch: mockNavigationDispatch } as any}
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
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
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

        const pressableElement = await findByText(
            getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel'),
        );

        fireEvent.press(pressableElement);
        expect(mockShowSheet).toHaveBeenCalledTimes(1);
    });

    it('should render continue button', () => {
        const { getByText } = renderScreen();

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();
    });

    it('should render alert when no quote is provided', () => {
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

        const backAction: NavigationAction = { type: 'GO_BACK' };

        triggerPreventNavigationRemove(backAction);

        const selectedQuote = selectTradingExchangeSelectedQuote(store.getState());
        expect(selectedQuote).toBeUndefined();
        expect(mockNavigationDispatch).toHaveBeenCalledWith(backAction);
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

    describe('analytics', () => {
        it('should report approval-preview visit ', () => {
            renderScreen();

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-preview', 'visit');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        });

        it('should report approval-preview cancel on back navigation', () => {
            store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
            renderScreen();

            triggerPreventNavigationRemove({ type: 'GO_BACK' });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('approval-preview', 'cancel');
        });
    });
});
