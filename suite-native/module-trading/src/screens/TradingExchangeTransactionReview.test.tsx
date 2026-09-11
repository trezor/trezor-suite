import { type RouteProp } from '@react-navigation/native';
import { type Store } from '@reduxjs/toolkit';

import { type TokenAddress } from '@suite-common/wallet-types';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import type {
    ExchangeFlowType,
    RootStackParamList,
    RootStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { type TradingRootState } from '@suite-native/trading-state';

import { TradingExchangeTransactionReviewScreen } from './TradingExchangeTransactionReviewScreen';
import { createTradingTestStore, renderWithTradingProvider } from '../test-utils/tradingTestUtils';

type State = TradingRootState;

const mockSignAndSendTransaction = jest.fn();
const mockSignDataAndConfirm = jest.fn();
const mockResolveTransactionSendConsent = jest.fn();
const mockUseExchangeFlow = {
    signAndSendTransaction: mockSignAndSendTransaction,
    signDataAndConfirm: mockSignDataAndConfirm,
    isTransactionSendConsentRequested: false,
    resolveTransactionSendConsent: mockResolveTransactionSendConsent,
};

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    popToTop: jest.fn(),
    setOptions: jest.fn(),
} as any;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useRoute: () => ({ name: 'TEST_ROUTE_NAME' }),
    usePreventRemove: jest.fn(),
}));

jest.mock('@suite-native/confirm-on-trezor', () => ({
    ...jest.requireActual('@suite-native/confirm-on-trezor'),
    useConfirmOnTrezorController: () => ({
        confirmOnTrezorRef: { current: null },
        closeSheet: jest.fn(),
    }),
    ConfirmOnTrezorWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseExchangeFlowFn = jest.fn(() => mockUseExchangeFlow);

jest.mock('../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => mockUseExchangeFlowFn(),
}));

const mockUseTradingOutputsReviewScreenControls = jest.fn((_: any) => ({
    isTransactionAlreadySigned: false,
    isConsentRequested: false,
    resolveConsent: jest.fn(),
    confirmOnTrezorRef: { current: null },
    closeSheet: jest.fn(),
    revealConfirmOnTrezorSheet: jest.fn(),
    showTimer: false,
    secondsLeft: 0,
    isPastDeadline: false,
    isBroadcasting: false,
    onRetry: jest.fn(),
    isRetryDisabled: false,
    handleSendTransaction: jest.fn(),
}));

jest.mock('../hooks/reviewOutputs/useTradingOutputsReviewScreenControls', () => ({
    useTradingOutputsReviewScreenControls: (args: any) =>
        mockUseTradingOutputsReviewScreenControls(args),
}));

jest.mock('../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag', () => ({
    useDelayedReviewOutputListDisplayFlag: () => false,
}));

// Test constants
const TEST_ACCOUNT_KEY = 'btc-account-1';
const TEST_ORDER_ID = 'test-order-id';

// Helper function to create route params for exchange
const createExchangeRouteParams = (
    tokenContract?: TokenAddress,
    flowType: ExchangeFlowType = 'swap',
) => ({
    accountKey: TEST_ACCOUNT_KEY,
    tokenContract,
    orderId: TEST_ORDER_ID,
    flowType,
});

// Helper function to create route for exchange
const createExchangeRoute = (params: ReturnType<typeof createExchangeRouteParams>) =>
    ({
        params,
    }) as RouteProp<RootStackParamList, RootStackRoutes.TradingExchangeTransactionReview>;

describe('TradingExchangeTransactionReviewScreenTest', () => {
    let store: Store<State>;
    let unmount: (() => void) | undefined;

    afterEach(async () => {
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    describe('TradingExchangeTransactionReviewScreen', () => {
        const renderScreen = async (
            route: StackProps<
                RootStackParamList,
                RootStackRoutes.TradingExchangeTransactionReview
            >['route'],
        ) => {
            const result = await renderWithTradingProvider(
                <TradingExchangeTransactionReviewScreen
                    route={route}
                    navigation={mockNavigation}
                />,
                { services: { analytics: mockNativeAnalytics(), store } },
            );

            ({ unmount } = result);

            return result;
        };

        beforeEach(() => {
            jest.clearAllMocks();
            store = createTradingTestStore({ tradeType: 'exchange' });
            mockNavigation.navigate.mockClear();
            mockNavigation.goBack.mockClear();
            mockNavigation.popToTop.mockClear();
        });

        it('should render TradingExchangeTransactionReviewScreen', async () => {
            const params = createExchangeRouteParams();
            const route = createExchangeRoute(params);

            const { toJSON } = await renderScreen(route);

            expect(toJSON()).not.toBeNull();
            expect(mockUseExchangeFlowFn).toHaveBeenCalled();
            expect(mockUseTradingOutputsReviewScreenControls).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderId: TEST_ORDER_ID,
                    accountKey: TEST_ACCOUNT_KEY,
                    reportToAnalytics: expect.any(Function),
                }),
            );
        });

        it('should pass signDataAndConfirm when flowType is sign-data', async () => {
            const params = createExchangeRouteParams(undefined, 'sign-data');
            const route = createExchangeRoute(params);

            await renderScreen(route);

            expect(mockUseTradingOutputsReviewScreenControls).toHaveBeenCalledWith(
                expect.objectContaining({
                    signAndSendTransaction: mockSignDataAndConfirm,
                }),
            );
        });

        it('should pass signAndSendTransaction when flowType is swap', async () => {
            const params = createExchangeRouteParams(undefined, 'swap');
            const route = createExchangeRoute(params);

            await renderScreen(route);

            expect(mockUseTradingOutputsReviewScreenControls).toHaveBeenCalledWith(
                expect.objectContaining({
                    signAndSendTransaction: mockSignAndSendTransaction,
                }),
            );
        });
    });
});
