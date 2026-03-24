import { type RouteProp } from '@react-navigation/native';
import type { ExchangeTrade } from 'invity-api';

import {
    type AccountKey,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { getTranslation } from '@suite-native/intl';
import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    type TestStore,
    initStore,
    renderWithStoreProvider,
    userEvent,
    waitFor,
} from '@suite-native/test-utils';
import { exchangeQuotes, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';

import {
    TradingExchangePreviewScreen,
    type TradingExchangePreviewScreenProps,
} from '../TradingExchangePreviewScreen';

// useDebounce adds a 300ms real setTimeout before calling the function. Mocking it to be
// immediate makes tests deterministic and avoids flaky failures in slow CI environments.
jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useDebounce: () => (fn: () => unknown) => fn(),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: jest.fn(),
        setOptions: jest.fn(),
    }),
    useRoute: () =>
        ({
            params: {},
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingExchangePreview>,
}));

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

let mockIsDeviceConnected = true;
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockIsDeviceConnected,
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
        hideAlert: jest.fn(),
    }),
}));

const mockPopToTop = jest.fn();
const mockNavigate = jest.fn();

const createPreloadedState = (quote?: ExchangeTrade): PreloadedState => {
    const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
    preloadedState.wallet.trading.exchange = {
        ...preloadedState.wallet.trading.exchange,
        quotes: exchangeQuotes,
        tradingAccountKey: 'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        receiveAccountKey: 'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
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
    let consoleErrorSpy: jest.SpyInstance;
    let unmount: (() => void) | undefined;

    const renderTradingExchangePreviewScreen = (
        isApproved: boolean = false,
        customStore?: TestStore,
    ) => {
        const testStore = customStore ?? store;
        const reportMock = jest.fn();
        jest.clearAllMocks();
        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        const result = renderWithStoreProvider(
            <TradingExchangePreviewScreen
                navigation={createNavigationProps()}
                route={createRouteProps(isApproved)}
            />,
            { store: testStore },
        );

        ({ unmount } = result);

        return { result, reportMock };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockTxnErrorString = null;
        mockIsDeviceConnected = true;

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

    it('should display device guard when device is not connected', () => {
        mockIsDeviceConnected = false;
        const { result } = renderTradingExchangePreviewScreen();
        expect(
            result.getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });

    it('should render continue button', () => {
        const { result } = renderTradingExchangePreviewScreen();

        expect(result.getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();
    });

    it('should render screen title correctly', () => {
        const { result } = renderTradingExchangePreviewScreen();

        expect(
            result.getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.title')),
        ).toBeOnTheScreen();
    });

    it('should render from and to account labels', () => {
        const { result } = renderTradingExchangePreviewScreen();

        expect(
            result.getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fromAccount'),
            ),
        ).toBeOnTheScreen();
        expect(
            result.getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.toAccount'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render transaction details section', () => {
        const { result } = renderTradingExchangePreviewScreen();

        expect(
            result.getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.details')),
        ).toBeOnTheScreen();
        expect(
            result.getByText(
                getTranslation('transactionManagement.fees.description.title.ethereum'),
            ),
        ).toBeOnTheScreen();
    });

    describe('Error Alert Functionality', () => {
        it('should show error alert when trade confirmation errors', async () => {
            mockConfirmTrade.mockRejectedValueOnce(new Error('Trade confirmation failed'));

            renderTradingExchangePreviewScreen();

            await waitFor(
                () => {
                    expect(mockShowAlert).toHaveBeenCalledTimes(1);
                },
                { timeout: 30_000 },
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to confirm trade',
                new Error('Trade confirmation failed'),
            );
        });

        it('should retry trade confirmation when retry button is pressed', async () => {
            mockConfirmTrade
                .mockRejectedValueOnce(new Error('Trade confirmation failed'))
                .mockResolvedValueOnce(true);

            const { reportMock } = renderTradingExchangePreviewScreen();

            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalled();
            });

            const retryFunction = mockShowAlert.mock.calls[0][0].onPressPrimaryButton;
            reportMock.mockClear();

            await retryFunction();

            expect(mockConfirmTrade).toHaveBeenCalledTimes(2);
            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({
                    step: 'transaction-preview',
                    action: 'retry',
                }),
            });
        });

        it('should navigate to top when cancel button is pressed', async () => {
            mockConfirmTrade.mockRejectedValueOnce(new Error('Trade confirmation failed'));

            const { reportMock } = renderTradingExchangePreviewScreen();

            await waitFor(() => {
                expect(mockShowAlert).toHaveBeenCalled();
            });

            const cancelFunction = mockShowAlert.mock.calls[0][0].onPressSecondaryButton;
            reportMock.mockClear();

            cancelFunction();

            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingExchangeEvent.name,
                payload: expect.objectContaining({
                    step: 'transaction-preview',
                    action: 'cancel',
                }),
            });
        });

        it('should not show error alert when trade confirmation succeeds', async () => {
            mockConfirmTrade.mockResolvedValue(true);

            renderTradingExchangePreviewScreen();

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockShowAlert).not.toHaveBeenCalled();
        });
    });

    it('should report to analytics on mount', () => {
        const { reportMock } = renderTradingExchangePreviewScreen();

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'transaction-preview',
                action: 'visit',
            }),
        });
    });

    it('should report to analytics on Continue press', async () => {
        const { result, reportMock } = renderTradingExchangePreviewScreen();
        reportMock.mockClear();

        await userEvent.press(result.getByText('Continue'));

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'transaction-preview',
                action: 'continue',
            }),
        });
    });

    describe('Error String Fallback Logic', () => {
        it('should use txnErrorString when provided', () => {
            mockTxnErrorString = 'Transaction error occurred';

            const { result } = renderTradingExchangePreviewScreen();

            expect(result.getByText('Transaction error occurred')).toBeOnTheScreen();
        });

        it('should fall back to quote.error when txnErrorString is null', () => {
            mockTxnErrorString = null;

            const quoteWithError = {
                ...exchangeQuotes[0],
                error: 'Quote error message',
            };

            const preloadedState = createPreloadedState(quoteWithError);
            const testStore = initStore(preloadedState).store;
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Quote error message')).toBeOnTheScreen();
        });

        it('should not show error when both txnErrorString and quote.error are null', () => {
            mockTxnErrorString = null;

            const quoteWithoutError = {
                ...exchangeQuotes[0],
                error: undefined,
            };

            const preloadedState = createPreloadedState(quoteWithoutError);
            const testStore = initStore(preloadedState).store;
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.queryByText('Transaction error occurred')).toBeNull();
            expect(result.queryByText('Quote error message')).toBeNull();
        });

        it('should prioritize txnErrorString over quote.error', () => {
            mockTxnErrorString = 'Transaction error takes priority';

            const quoteWithError = {
                ...exchangeQuotes[0],
                error: 'Quote error message',
            };

            const preloadedState = createPreloadedState(quoteWithError);
            const testStore = initStore(preloadedState).store;
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Transaction error takes priority')).toBeOnTheScreen();
            expect(result.queryByText('Quote error message')).toBeNull();
        });
    });
});
