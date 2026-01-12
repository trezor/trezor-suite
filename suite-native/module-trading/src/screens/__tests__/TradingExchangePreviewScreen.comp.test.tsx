import { RouteProp } from '@react-navigation/native';
import type { ExchangeTrade } from 'invity-api';

import { GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import {
    PreloadedState,
    TestStore,
    initStore,
    renderWithStoreProviderAsync,
    userEvent,
    waitFor,
} from '@suite-native/test-utils';
import { exchangeQuotes, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';

import {
    TradingExchangePreviewScreen,
    TradingExchangePreviewScreenProps,
} from '../TradingExchangePreviewScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: {},
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingExchangePreview>,
}));

const mockConfirmTrade = jest.fn().mockResolvedValue(Promise.resolve());
const mockFetchFeesAndCompose = jest.fn();
const mockSignAndSendTransaction = jest.fn();
const mockResolveConsent = jest.fn();
let mockTxnErrorString: string | null = null;

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        confirmTrade: mockConfirmTrade,
        fetchFeesAndCompose: mockFetchFeesAndCompose,
        signAndSendTransaction: mockSignAndSendTransaction,
        isConsentRequested: false,
        resolveConsent: mockResolveConsent,
        get txnErrorString() {
            return mockTxnErrorString;
        },
    }),
}));

const mockShowAlert = jest.fn();
jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

const mockPopToTop = jest.fn();
const mockNavigate = jest.fn();

const createPreloadedState = (quote?: ExchangeTrade): PreloadedState => {
    const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
    preloadedState.wallet.trading.exchange = {
        ...preloadedState.wallet.trading.exchange,
        quotes: exchangeQuotes,
        tradingAccountKey: 'eth-account-1',
        receiveAccountKey: 'btc-account-1',
        receiveAddress: getBtcAccount().addresses?.used[0].address,
        selectedQuote: quote ?? exchangeQuotes[0],
    };
    preloadedState.wallet.send = {
        ...preloadedState.wallet.send,
        precomposedTx: {
            type: 'final',
            fee: '1000',
            feePerByte: '10',
            totalSpent: '100000',
            bytes: 100,
        } as GeneralPrecomposedTransactionFinal,
    };

    return preloadedState;
};

const createNavigationProps = () =>
    ({
        navigate: mockNavigate,
        popToTop: mockPopToTop,
    }) as unknown as TradingExchangePreviewScreenProps['navigation'];

const createRouteProps = (isApproved: boolean = false) =>
    ({ params: { isApproved } }) as TradingExchangePreviewScreenProps['route'];

describe('TradingExchangePreviewScreen', () => {
    let store: TestStore;
    const analyticsSpy = jest.spyOn(analytics, 'report');
    let consoleErrorSpy: jest.SpyInstance;
    let unmount: (() => void) | undefined;

    const renderTradingExchangePreviewScreen = async (
        isApproved: boolean = false,
        customStore?: TestStore,
    ) => {
        const testStore = customStore ?? store;

        const result = await renderWithStoreProviderAsync(
            <TradingExchangePreviewScreen
                navigation={createNavigationProps()}
                route={createRouteProps(isApproved)}
            />,
            { store: testStore },
        );

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockTxnErrorString = null;
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const preloadedState = createPreloadedState();
        store = initStore(preloadedState).store;
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render continue button', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should render screen title correctly', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('Swap')).toBeOnTheScreen();
    });

    it('should render from and to account labels', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
    });

    it('should render transaction details section', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();

        expect(getByText('Transaction details')).toBeOnTheScreen();
        expect(getByText('Fee')).toBeOnTheScreen();
    });

    describe('Error Alert Functionality', () => {
        it('should show error alert when trade confirmation errors', async () => {
            mockConfirmTrade.mockRejectedValueOnce(new Error('Trade confirmation failed'));

            await renderTradingExchangePreviewScreen();

            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalledTimes(1);
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to confirm trade',
                new Error('Trade confirmation failed'),
            );
        });

        it('should retry trade confirmation when retry button is pressed', async () => {
            mockConfirmTrade
                .mockRejectedValueOnce(new Error('Trade confirmation failed'))
                .mockResolvedValueOnce(true);

            await renderTradingExchangePreviewScreen();

            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalled();
            });

            const retryFunction = mockShowAlert.mock.calls[0][0].onPressPrimaryButton;
            analyticsSpy.mockClear();

            await retryFunction();

            expect(mockConfirmTrade).toHaveBeenCalledTimes(2);
            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'transaction-preview',
                    action: 'retry',
                }),
            });
        });

        it('should navigate to top when cancel button is pressed', async () => {
            mockConfirmTrade.mockRejectedValueOnce(new Error('Trade confirmation failed'));

            await renderTradingExchangePreviewScreen();

            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalled();
            });

            const cancelFunction = mockShowAlert.mock.calls[0][0].onPressSecondaryButton;
            analyticsSpy.mockClear();

            cancelFunction();

            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'transaction-preview',
                    action: 'cancel',
                }),
            });
        });

        it('should not show error alert when trade confirmation succeeds', async () => {
            mockConfirmTrade.mockResolvedValue(true);

            await renderTradingExchangePreviewScreen();

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockShowAlert).not.toHaveBeenCalled();
        });
    });

    it('should report to analytics on mount', async () => {
        await renderTradingExchangePreviewScreen();

        expect(analyticsSpy).toHaveBeenCalledTimes(1);
        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: expect.objectContaining({
                step: 'transaction-preview',
                action: 'visit',
            }),
        });
    });

    it('should report to analytics on Continue press', async () => {
        const { getByText } = await renderTradingExchangePreviewScreen();
        analyticsSpy.mockClear();

        await userEvent.press(getByText('Continue'));

        expect(analyticsSpy).toHaveBeenCalledTimes(1);
        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: expect.objectContaining({
                step: 'transaction-preview',
                action: 'continue',
            }),
        });
    });

    describe('Error String Fallback Logic', () => {
        it('should use txnErrorString when provided', async () => {
            mockTxnErrorString = 'Transaction error occurred';

            const { getByText } = await renderTradingExchangePreviewScreen();

            expect(getByText('Transaction error occurred')).toBeOnTheScreen();
        });

        it('should fall back to quote.error when txnErrorString is null', async () => {
            mockTxnErrorString = null;

            const quoteWithError = {
                ...exchangeQuotes[0],
                error: 'Quote error message',
            };

            const preloadedState = createPreloadedState(quoteWithError);
            const testStore = initStore(preloadedState).store;
            const { getByText } = await renderTradingExchangePreviewScreen(false, testStore);

            expect(getByText('Quote error message')).toBeOnTheScreen();
        });

        it('should not show error when both txnErrorString and quote.error are null', async () => {
            mockTxnErrorString = null;

            const quoteWithoutError = {
                ...exchangeQuotes[0],
                error: undefined,
            };

            const preloadedState = createPreloadedState(quoteWithoutError);
            const testStore = initStore(preloadedState).store;
            const { queryByText } = await renderTradingExchangePreviewScreen(false, testStore);

            expect(queryByText('Transaction error occurred')).toBeNull();
            expect(queryByText('Quote error message')).toBeNull();
        });

        it('should prioritize txnErrorString over quote.error', async () => {
            mockTxnErrorString = 'Transaction error takes priority';

            const quoteWithError = {
                ...exchangeQuotes[0],
                error: 'Quote error message',
            };

            const preloadedState = createPreloadedState(quoteWithError);
            const testStore = initStore(preloadedState).store;
            const { getByText, queryByText } = await renderTradingExchangePreviewScreen(
                false,
                testStore,
            );

            expect(getByText('Transaction error takes priority')).toBeOnTheScreen();
            expect(queryByText('Quote error message')).toBeNull();
        });
    });
});
