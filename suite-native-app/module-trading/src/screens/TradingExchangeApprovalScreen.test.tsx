import { type NavigationAction, type RouteProp } from '@react-navigation/native';
import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import {
    type TradingStackParamList,
    TradingStackRoutes,
    useOnNavigationRemove,
} from '@suite-native/navigation';
import { fireEvent, within } from '@suite-native/test-utils-store';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { TradingExchangeApprovalScreen } from './TradingExchangeApprovalScreen';
import { APPROVAL_CONTINUE_BUTTON_TEST_ID } from '../components/exchange/Approval/ApprovalButton';
import { type useEvmApprovalFees } from '../hooks/exchange/Approval/useEvmApprovalFees';
import { createTradingTestStore, renderWithTradingProvider } from '../test-utils/tradingTestUtils';

type State = TradingRootState;

const mockShowSheet = jest.fn();
const mockHideSheet = jest.fn();
const mockConfirmApproval = jest.fn().mockResolvedValue({});
const mockOnApprovalTypeChange = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useOnNavigationRemove: jest.fn(),
}));

const mockedUseOnNavigationRemove = jest.mocked(useOnNavigationRemove);

const triggerRemovalAttempt = (action: NavigationAction = { type: 'GO_BACK' }) => {
    const params = mockedUseOnNavigationRemove.mock.calls.at(-1)?.[0];

    params?.onRemoveAttempt?.(action);
};

jest.mock('../hooks/exchange/Approval/useApprovalFlow', () => ({
    useApprovalFlow: () => ({
        quote: undefined,
        isReady: true,
        isConfirming: false,
        error: null,
        confirmApproval: mockConfirmApproval,
        onApprovalTypeChange: mockOnApprovalTypeChange,
    }),
}));

let mockEvmApprovalFees: Pick<
    ReturnType<typeof useEvmApprovalFees>,
    'fee' | 'isLoading' | 'error' | 'isFeeUnavailable'
>;

jest.mock('../hooks/exchange/Approval/useEvmApprovalFees', () => ({
    useEvmApprovalFees: () => ({ ...mockEvmApprovalFees, composeFees: jest.fn() }),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            key: TradingStackRoutes.TradingExchangeApproval,
            name: TradingStackRoutes.TradingExchangeApproval,
            params: {},
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingExchangeApproval>,
    useNavigation: () => ({
        setOptions: jest.fn(),
    }),
}));

const mockAnalyticsReport = jest.fn();
jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetControls: () => ({
        isSheetVisible: false,
        showSheet: mockShowSheet,
        hideSheet: mockHideSheet,
    }),
}));

const testQuote = mercuryoFixedWorstQuote;

const APPROVE_TITLE = getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.title');
const INCREASE_TITLE = getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.title');

describe('TradingExchangeApprovalScreen', () => {
    let store: Store<State>;
    let unmount: (() => void) | undefined;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const renderScreen = async (params: Record<string, unknown> = {}) => {
        const result = await renderWithTradingProvider(
            <TradingExchangeApprovalScreen route={{ params } as any} navigation={{} as any} />,
            {
                services: {
                    analytics: mockNativeAnalytics(mockAnalyticsReport),
                    store,
                    networks: mockNetworksServices(),
                },
                tradeType: 'exchange',
            },
        );

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockEvmApprovalFees = {
            fee: '100000',
            isLoading: false,
            error: null,
            isFeeUnavailable: false,
        };

        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    afterEach(async () => {
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    it('should confirm approval on mount', async () => {
        await renderScreen();

        expect(mockConfirmApproval).toHaveBeenCalledTimes(1);
        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('should render the approval as the first step with the swap as the next step', async () => {
        const { getByText, getByTestId, queryByText, queryByTestId } = await renderScreen();

        expect(getByText(APPROVE_TITLE)).toBeOnTheScreen();
        expect(queryByText(INCREASE_TITLE)).toBeNull();
        expect(queryByText('ETH Account #1')).toBeNull();
        expect(queryByText('Mercuryo')).toBeNull();
        expect(queryByTestId('@step-cards/finished')).toBeNull();
        expect(getByTestId('@step-cards/current')).toHaveTextContent(
            getTranslation('stepCards.stepper', { stepNumber: 1, stepCount: 2 }),
            { exact: false },
        );
        expect(
            within(getByTestId('@step-cards/next')).getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.swapStep.nextStepTitle'),
            ),
        ).toBeOnTheScreen();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should render the increase step when shouldIncreaseLimit is true', async () => {
        const { getByText, queryByText, queryByTestId } = await renderScreen({
            shouldIncreaseLimit: true,
        });

        expect(getByText(INCREASE_TITLE)).toBeOnTheScreen();
        expect(queryByText(APPROVE_TITLE)).toBeNull();
        expect(queryByTestId('@step-cards/finished')).toBeNull();
    });

    it('should open bottom sheet when limit row is pressed', async () => {
        const { findByText } = await renderScreen();

        const pressableElement = await findByText(
            getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel'),
        );

        await fireEvent.press(pressableElement);
        expect(mockShowSheet).toHaveBeenCalledTimes(1);
    });

    it('should render continue button', async () => {
        const { getByText } = await renderScreen();

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();
    });

    it('should disable the continue button without a loader when the fee is unavailable', async () => {
        mockEvmApprovalFees = {
            fee: undefined,
            isLoading: false,
            error: null,
            isFeeUnavailable: true,
        };

        const { getByText, queryByTestId } = await renderScreen();

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeDisabled();
        expect(queryByTestId(`${APPROVAL_CONTINUE_BUTTON_TEST_ID}/loading`)).toBeNull();
    });

    it('should render alert when no quote is provided', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { getByText, queryByText } = await renderScreen();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert'),
            ),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('generic.buttons.continue'))).toBeNull();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith('No quote to confirm approval');
    });

    it.each(['GO_BACK', 'POP'])('should clear selected quote on %s', async actionType => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        await renderScreen();

        const backAction: NavigationAction = { type: actionType };

        triggerRemovalAttempt(backAction);

        const selectedQuote = selectTradingExchangeSelectedQuote(store.getState());
        expect(selectedQuote).toBeUndefined();
        expect(mockedUseOnNavigationRemove.mock.calls.at(-1)?.[0].actionTypes).toEqual([
            'GO_BACK',
            'POP',
        ]);
    });

    it('should render the revoke as the finished step when isRevoked is true', async () => {
        const { getByText, getByTestId } = await renderScreen({ isRevoked: true });

        expect(getByText(APPROVE_TITLE)).toBeOnTheScreen();
        expect(
            within(getByTestId('@step-cards/finished')).getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.revokeStep.nextStepTitle'),
            ),
        ).toBeOnTheScreen();
        expect(getByTestId('@step-cards/current')).toHaveTextContent(
            getTranslation('stepCards.stepper', { stepNumber: 2, stepCount: 3 }),
            { exact: false },
        );
    });

    it('should render alert when no account is selected', async () => {
        store.dispatch(tradingExchangeActions.setTradingAccountKey(undefined));

        const { getByText, queryByTestId } = await renderScreen();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert'),
            ),
        ).toBeOnTheScreen();
        expect(queryByTestId('@step-cards/current')).toBeNull();
        expect(errorSpy).toHaveBeenCalledWith('No account selected for exchange approval details');
    });

    describe('analytics', () => {
        it('should report approval-preview visit ', async () => {
            await renderScreen();

            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({ step: 'approval-preview', action: 'visit' }),
            });
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        });

        it('should report approval-preview cancel on back navigation', async () => {
            store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
            await renderScreen();

            triggerRemovalAttempt({ type: 'GO_BACK' });

            expect(mockAnalyticsReport).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({ step: 'approval-preview', action: 'cancel' }),
            });
        });
    });
});
