import { RouteProp } from '@react-navigation/native';

import { TokenAddress } from '@suite-common/wallet-types';
import type {
    StackProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState } from '@suite-native/trading-fixtures';

import {
    TradingExchangeOutputsReviewScreen,
    TradingSellOutputsReviewScreen,
} from '../TradingOutputsReviewScreen';

const mockSignAndSendTransaction = jest.fn();
const mockResolveTransactionSendConsent = jest.fn();
const mockUseExchangeFlow = {
    signAndSendTransaction: mockSignAndSendTransaction,
    isTransactionSendConsentRequested: false,
    resolveTransactionSendConsent: mockResolveTransactionSendConsent,
};

const mockUseSellFlow = {
    signAndSendTransaction: mockSignAndSendTransaction,
    isTransactionSendConsentRequested: false,
    resolveTransactionSendConsent: mockResolveTransactionSendConsent,
};

const mockReportToAnalyticsExchange = jest.fn();
const mockReportToAnalyticsSell = jest.fn();

jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useExchangeAnalyticReportCallback: () => mockReportToAnalyticsExchange,
    useSellAnalyticReportCallback: () => mockReportToAnalyticsSell,
}));

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

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => mockUseExchangeFlowFn(),
}));

jest.mock('../../hooks/sell/useSellFlow', () => ({
    useSellFlow: () => mockUseSellFlowFn(),
}));

const mockUseTradingOutputsReviewScreenControls = jest.fn((_: any) => ({
    isTransactionAlreadySigned: false,
    isConsentRequested: false,
    resolveConsent: jest.fn(),
    confirmOnTrezorRef: { current: null },
}));

jest.mock('../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls', () => ({
    useTradingOutputsReviewScreenControls: (args: any) =>
        mockUseTradingOutputsReviewScreenControls(args),
}));

jest.mock('../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag', () => ({
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
const createExchangeRouteParams = (tokenContract?: TokenAddress) => ({
    accountKey: TEST_ACCOUNT_KEY,
    tokenContract,
    orderId: TEST_ORDER_ID,
});

// Helper function to create route for sell
const createSellRoute = (params: ReturnType<typeof createSellRouteParams>) =>
    ({
        params,
    }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingSellOutputsReview>;

// Helper function to create route for exchange
const createExchangeRoute = (params: ReturnType<typeof createExchangeRouteParams>) =>
    ({
        params,
    }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingExchangeOutputsReview>;

describe('TradingSellOutputsReviewScreen', () => {
    let store: TestStore;
    let unmount: (() => void) | undefined;

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    describe('TradingSellOutputsReviewScreen', () => {
        const renderScreen = async (
            route: StackProps<
                TradingStackParamList,
                TradingStackRoutes.TradingSellOutputsReview
            >['route'],
        ) => {
            const result = await renderWithStoreProviderAsync(
                <TradingSellOutputsReviewScreen route={route} navigation={mockNavigation} />,
                { store },
            );

            ({ unmount } = result);

            return result;
        };

        beforeEach(() => {
            jest.clearAllMocks();
            store = initStore({ wallet: getWalletState({ tradeType: 'sell' }) }).store;
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
                    reportToAnalytics: mockReportToAnalyticsSell,
                }),
            );
        });
    });

    describe('TradingExchangeOutputsReviewScreen', () => {
        const renderScreen = async (
            route: StackProps<
                TradingStackParamList,
                TradingStackRoutes.TradingExchangeOutputsReview
            >['route'],
        ) => {
            const result = await renderWithStoreProviderAsync(
                <TradingExchangeOutputsReviewScreen route={route} navigation={mockNavigation} />,
                { store },
            );

            ({ unmount } = result);

            return result;
        };

        beforeEach(() => {
            jest.clearAllMocks();
            store = initStore({ wallet: getWalletState({ tradeType: 'exchange' }) }).store;
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
                    reportToAnalytics: mockReportToAnalyticsExchange,
                }),
            );
        });
    });
});
