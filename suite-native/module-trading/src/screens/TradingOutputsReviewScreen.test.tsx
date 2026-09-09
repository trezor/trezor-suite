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

import {
    TradingExchangeOutputsReviewScreen,
    TradingSellOutputsReviewScreen,
} from './TradingOutputsReviewScreen';
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

const mockUseSellFlow = {
    signAndSendTransaction: mockSignAndSendTransaction,
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
const mockUseSellFlowFn = jest.fn(() => mockUseSellFlow);

jest.mock('../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => mockUseExchangeFlowFn(),
}));

jest.mock('../hooks/sell/useSellFlow', () => ({
    useSellFlow: () => mockUseSellFlowFn(),
}));

const mockUseTradingOutputsReviewScreenControls = jest.fn((_: any) => ({
    isTransactionAlreadySigned: false,
    isConsentRequested: false,
    resolveConsent: jest.fn(),
    confirmOnTrezorRef: { current: null },
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

// Helper function to create route params for sell
const createSellRouteParams = (tokenContract?: TokenAddress) => ({
    accountKey: TEST_ACCOUNT_KEY,
    tokenContract,
    orderId: TEST_ORDER_ID,
});

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

// Helper function to create route for sell
const createSellRoute = (params: ReturnType<typeof createSellRouteParams>) =>
    ({
        params,
    }) as RouteProp<RootStackParamList, RootStackRoutes.TradingSellOutputsReview>;

// Helper function to create route for exchange
const createExchangeRoute = (params: ReturnType<typeof createExchangeRouteParams>) =>
    ({
        params,
    }) as RouteProp<RootStackParamList, RootStackRoutes.TradingExchangeOutputsReview>;

describe('TradingSellOutputsReviewScreen', () => {
    let store: Store<State>;
    let unmount: (() => void) | undefined;

    afterEach(async () => {
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    describe('TradingSellOutputsReviewScreen', () => {
        const renderScreen = async (
            route: StackProps<
                RootStackParamList,
                RootStackRoutes.TradingSellOutputsReview
            >['route'],
        ) => {
            const result = await renderWithTradingProvider(
                <TradingSellOutputsReviewScreen route={route} navigation={mockNavigation} />,
                { services: { analytics: mockNativeAnalytics(), store } },
            );

            ({ unmount } = result);

            return result;
        };

        beforeEach(() => {
            jest.clearAllMocks();
            store = createTradingTestStore({ tradeType: 'sell' });
            mockNavigation.navigate.mockClear();
            mockNavigation.goBack.mockClear();
            mockNavigation.popToTop.mockClear();
        });

        it('should render TradingSellOutputsReviewScreen', async () => {
            const params = createSellRouteParams();
            const route = createSellRoute(params);

            const { toJSON } = await renderScreen(route);

            expect(toJSON()).not.toBeNull();
            expect(mockUseSellFlowFn).toHaveBeenCalled();
            expect(mockUseTradingOutputsReviewScreenControls).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderId: TEST_ORDER_ID,
                    accountKey: TEST_ACCOUNT_KEY,
                    reportToAnalytics: expect.any(Function),
                }),
            );
        });
    });

    describe('TradingExchangeOutputsReviewScreen', () => {
        const renderScreen = async (
            route: StackProps<
                RootStackParamList,
                RootStackRoutes.TradingExchangeOutputsReview
            >['route'],
        ) => {
            const result = await renderWithTradingProvider(
                <TradingExchangeOutputsReviewScreen route={route} navigation={mockNavigation} />,
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

        it('should render TradingExchangeOutputsReviewScreen', async () => {
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
