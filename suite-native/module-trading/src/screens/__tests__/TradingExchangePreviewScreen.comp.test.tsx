import { RouteProp } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import {
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

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        confirmTrade: mockConfirmTrade,
        fetchFeesAndCompose: mockFetchFeesAndCompose,
        signAndSendTransaction: mockSignAndSendTransaction,
        isConsentRequested: false,
        resolveConsent: mockResolveConsent,
        txnErrorString: null,
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

describe('TradingExchangePreviewScreen', () => {
    let store: TestStore;
    const analyticsSpy = jest.spyOn(analytics, 'report');

    const renderTradingExchangePreviewScreen = (isApproved: boolean = false) =>
        renderWithStoreProviderAsync(
            <TradingExchangePreviewScreen
                navigation={
                    {
                        navigate: mockNavigate,
                        popToTop: mockPopToTop,
                    } as unknown as TradingExchangePreviewScreenProps['navigation']
                }
                route={{ params: { isApproved } } as TradingExchangePreviewScreenProps['route']}
            />,
            { store },
        );

    beforeEach(async () => {
        jest.clearAllMocks();

        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        preloadedState.wallet.trading.exchange = {
            ...preloadedState.wallet.trading.exchange,
            quotes: exchangeQuotes,
            tradingAccountKey: 'eth-account-1',
            receiveAccountKey: 'btc-account-1',
            receiveAddress: getBtcAccount().addresses?.used[0].address,
            selectedQuote: exchangeQuotes[0],
        };

        // Add precomposed transaction to show the Continue button
        preloadedState.wallet = {
            ...preloadedState.wallet,
            send: {
                ...preloadedState.wallet.send,
                precomposedTx: {
                    type: 'final',
                    fee: '1000',
                    feePerByte: '10',
                    totalSpent: '100000',
                    bytes: 100,
                } as any,
            },
        };

        store = await initStore(preloadedState);
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
        it('should show error alert when trade confirmation fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            // Mock confirmTrade to throw an error
            mockConfirmTrade.mockRejectedValueOnce(new Error('Trade confirmation failed'));

            await renderTradingExchangePreviewScreen();

            // Wait for the error to be processed
            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalledTimes(1);
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to confirm trade',
                new Error('Trade confirmation failed'),
            );
        });

        it('should retry trade confirmation when retry button is pressed', async () => {
            // Mock confirmTrade to throw an error first, then succeed
            mockConfirmTrade
                .mockRejectedValueOnce(new Error('Trade confirmation failed'))
                .mockResolvedValueOnce(true);

            await renderTradingExchangePreviewScreen();

            // Wait for the error alert to be shown
            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalled();
            });

            // Get the retry function from the alert call
            const alertCall = mockShowAlert.mock.calls[0][0];
            const retryFunction = alertCall.onPressPrimaryButton;
            analyticsSpy.mockClear();

            // Call the retry function
            await retryFunction();

            // Verify confirmTrade was called again
            expect(mockConfirmTrade).toHaveBeenCalledTimes(2);

            expect(analyticsSpy).toHaveBeenCalledTimes(1);
            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'transaction-preview',
                    action: 'retry',
                }),
            });
        });

        it('should navigate to top when cancel button is pressed', async () => {
            // Mock confirmTrade to throw an error
            mockConfirmTrade.mockRejectedValueOnce(new Error('Trade confirmation failed'));

            await renderTradingExchangePreviewScreen();

            // Wait for the error alert to be shown
            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalled();
            });

            // Get the cancel function from the alert call
            const alertCall = mockShowAlert.mock.calls[0][0];
            const cancelFunction = alertCall.onPressSecondaryButton;

            analyticsSpy.mockClear();

            // Call the cancel function
            cancelFunction();

            // Verify navigation.popToTop was called
            expect(mockPopToTop).toHaveBeenCalledTimes(1);

            expect(analyticsSpy).toHaveBeenCalledTimes(1);
            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'transaction-preview',
                    action: 'cancel',
                }),
            });
        });

        it('should not show error alert when trade confirmation succeeds', async () => {
            // Mock confirmTrade to succeed
            mockConfirmTrade.mockResolvedValue(true);

            await renderTradingExchangePreviewScreen();

            // Wait a bit to ensure no error alert is shown
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify no error alert was shown
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
});
