import { RouteProp } from '@react-navigation/native';

import { TokenAddress } from '@suite-common/wallet-types';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getWalletState } from '@suite-native/trading-fixtures';

import { TradingOutputsReviewScreen } from '../TradingOutputsReviewScreen';

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

const mockUseRoute = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => mockUseRoute(),
}));

jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    useConfirmOnTrezorController: () => ({
        confirmOnTrezorRef: { current: null },
        closeSheet: jest.fn(),
    }),
    ConfirmOnTrezorWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseExchangeFlowFn = jest.fn(() => mockUseExchangeFlow);
const mockUseSellFlowFn = jest.fn(() => mockUseSellFlow);

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    popToTop: jest.fn(),
} as any;

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => mockUseExchangeFlowFn(),
}));

jest.mock('../../hooks/sell/useSellFlow', () => ({
    useSellFlow: () => mockUseSellFlowFn(),
}));

jest.mock('../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls', () => ({
    useTradingOutputsReviewScreenControls: jest.fn(() => ({
        isTransactionAlreadySigned: false,
        isConsentRequested: false,
        resolveConsent: jest.fn(),
        confirmOnTrezorRef: { current: null },
    })),
}));

jest.mock('../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag', () => ({
    useDelayedReviewOutputListDisplayFlag: () => false,
}));

// Test constants
const TEST_ACCOUNT_KEY = 'btc-account-1';
const TEST_ORDER_ID = 'test-order-id';

// Helper function to create route params
const createRouteParams = (
    tradingType: 'exchange' | 'sell' | 'buy',
    tokenContract?: TokenAddress,
) => ({
    tradingType,
    accountKey: TEST_ACCOUNT_KEY,
    tokenContract,
    orderId: TEST_ORDER_ID,
});

// Helper function to create route
const createRoute = (params: ReturnType<typeof createRouteParams>) =>
    ({
        params,
    }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingOutputsReview>;

describe('TradingOutputsReviewScreen', () => {
    let store: TestStore;

    beforeEach(async () => {
        jest.clearAllMocks();
        store = await initStore({ wallet: getWalletState({ tradeType: 'exchange' }) });
        mockUseRoute.mockReturnValue({
            params: createRouteParams('exchange'),
        });
        // Reset navigation mocks
        mockNavigation.navigate.mockClear();
        mockNavigation.goBack.mockClear();
        mockNavigation.popToTop.mockClear();
    });

    describe('TradingOutputsReviewScreen routing', () => {
        it('should render TradingExchangeOutputsReviewScreen for exchange trading type', async () => {
            const params = createRouteParams('exchange');
            mockUseRoute.mockReturnValueOnce({ params });

            const route = createRoute(params);

            const { toJSON } = await renderWithStoreProviderAsync(
                <TradingOutputsReviewScreen route={route} navigation={mockNavigation} />,
                { store },
            );

            // Verify that TradingExchangeOutputsReviewScreen is rendered
            expect(toJSON()).not.toBeNull();
        });

        it('should render TradingSellOutputsReviewScreen for sell trading type', async () => {
            const params = createRouteParams('sell');
            mockUseRoute.mockReturnValueOnce({ params });

            const route = createRoute(params);

            const { toJSON } = await renderWithStoreProviderAsync(
                <TradingOutputsReviewScreen route={route} navigation={mockNavigation} />,
                { store },
            );

            // Verify that TradingSellOutputsReviewScreen is rendered
            expect(toJSON()).not.toBeNull();
        });

        it('should return null for unknown trading type', async () => {
            const params = createRouteParams('buy' as any);
            mockUseRoute.mockReturnValueOnce({ params });

            const route = createRoute(params);

            // TradingOutputsReviewScreen returns null for unknown trading type
            const { toJSON } = await renderWithStoreProviderAsync(
                <TradingOutputsReviewScreen route={route} navigation={mockNavigation} />,
                { store },
            );

            expect(toJSON()).toBeNull();
        });
    });
});
