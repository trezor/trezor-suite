import { type RouteProp } from '@react-navigation/native';
import type { ExchangeTrade } from 'invity-api';

import { asAccountDescriptor } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { type RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import {
    type TestStore,
    renderWithStoreProvider,
    userEvent,
    waitFor,
} from '@suite-native/test-utils-store';
import {
    createPrecomposedTxFinal,
    exchangeQuotes,
    getBtcAccount,
    getEthAccount,
    mercuryoFixedWorstQuote,
    oneInchFusionPlusWithEip712SignDataQuote,
} from '@suite-native/trading-fixtures';

import { createTradingLightStore } from '../../__tests__/tradingTestUtils';
import {
    TradingExchangePreviewScreen,
    type TradingExchangePreviewScreenProps,
} from '../TradingExchangePreviewScreen';

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const eth1Account = getEthAccount({ descriptor: asAccountDescriptor('eth1normal') });

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
        }) as RouteProp<RootStackParamList, RootStackRoutes.TradingExchangePreview>,
}));

let mockIsDeviceConnected = true;
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockIsDeviceConnected,
}));

const mockConfirmTrade = jest.fn().mockResolvedValue(Promise.resolve());
const mockFetchFeesAndCompose = jest.fn();
const mockSignAndSendTransaction = jest.fn();
const mockResolveConsent = jest.fn();
const mockAbortConfirmTrade = jest.fn();
let mockTxnErrorString: string | null = null;

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        abortConfirmTrade: mockAbortConfirmTrade,
        confirmTrade: mockConfirmTrade,
        fetchFeesAndCompose: mockFetchFeesAndCompose,
        signAndSendTransaction: mockSignAndSendTransaction,
        signDataAndConfirm: jest.fn(),
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

const createStore = (quote?: ExchangeTrade) =>
    createTradingLightStore({
        tradeType: 'exchange',
        overrides: {
            wallet: {
                trading: {
                    exchange: {
                        quotes: exchangeQuotes,
                        tradingAccountKey: eth1Account.key,
                        receiveAccountKey: btc1Account.key,
                        receiveAddress: btc1Account.addresses?.used[0]?.address,
                        selectedQuote: quote ?? mercuryoFixedWorstQuote,
                    },
                },
                send: {
                    precomposedTx: createPrecomposedTxFinal({
                        fee: '1000',
                        feePerByte: '10',
                        totalSpent: '100000',
                        bytes: 100,
                    }),
                },
            },
        },
    });

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
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(reportMock),
        };
        jest.clearAllMocks();

        const result = renderWithStoreProvider(
            <TradingExchangePreviewScreen
                navigation={createNavigationProps()}
                route={createRouteProps(isApproved)}
            />,
            { services, store: testStore },
        );

        ({ unmount } = result);

        return { result, reportMock };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockTxnErrorString = null;
        mockIsDeviceConnected = true;

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        store = createStore();
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

    it('should abort confirm trade on unmount', () => {
        const { result } = renderTradingExchangePreviewScreen();

        expect(mockAbortConfirmTrade).not.toHaveBeenCalled();

        result.unmount();
        unmount = undefined;

        expect(mockAbortConfirmTrade).toHaveBeenCalledTimes(1);
    });

    it('should clear trading state on unmount', () => {
        const { result } = renderTradingExchangePreviewScreen();

        expect(store.getState().wallet.trading.exchange.selectedQuote).toBeDefined();

        result.unmount();
        unmount = undefined;

        expect(store.getState().wallet.trading.exchange.selectedQuote).toBeUndefined();
        expect(store.getState().wallet.trading.sell.selectedQuote).toBeUndefined();
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

    describe('Approval Required Redirect', () => {
        it('redirects to TradingExchangeApproval when selectedQuote.status is APPROVAL_REQ', async () => {
            const approvalReqQuote: ExchangeTrade = {
                ...mercuryoFixedWorstQuote,
                status: 'APPROVAL_REQ',
            };
            const testStore = createStore(approvalReqQuote);

            renderTradingExchangePreviewScreen(false, testStore);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledTimes(1);
            });
            expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.TradingExchangeApproval, {});
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
                ...mercuryoFixedWorstQuote,
                error: 'Quote error message',
            };

            const testStore = createStore(quoteWithError);
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Quote error message')).toBeOnTheScreen();
        });

        it('should not show error when both txnErrorString and quote.error are null', () => {
            mockTxnErrorString = null;

            const quoteWithoutError = {
                ...mercuryoFixedWorstQuote,
                error: undefined,
            };

            const testStore = createStore(quoteWithoutError);
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.queryByText('Transaction error occurred')).toBeNull();
            expect(result.queryByText('Quote error message')).toBeNull();
        });

        it('should prioritize txnErrorString over quote.error', () => {
            mockTxnErrorString = 'Transaction error takes priority';

            const quoteWithError = {
                ...mercuryoFixedWorstQuote,
                error: 'Quote error message',
            };

            const testStore = createStore(quoteWithError);
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Transaction error takes priority')).toBeOnTheScreen();
            expect(result.queryByText('Quote error message')).toBeNull();
        });

        it('should not show errors for quote with SIGN_DATA status and EIP-712 data', () => {
            mockTxnErrorString = 'Transaction error occurred';

            const quoteWithEip712SignData = {
                ...oneInchFusionPlusWithEip712SignDataQuote,
                error: 'Quote error message',
            };

            const testStore = createStore(quoteWithEip712SignData);
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.queryByText('Transaction error occurred')).toBeNull();
            expect(result.queryByText('Quote error message')).toBeNull();
        });

        it('should show errors for quote with SIGN_DATA status and non-EIP-712 data', () => {
            mockTxnErrorString = 'Transaction error occurred';

            const quoteWithNonEip712SignData = {
                ...mercuryoFixedWorstQuote,
                error: 'Quote error message',
                status: 'SIGN_DATA' as const,
                signData: {
                    type: 'slip24',
                    data: {},
                } as any,
            };

            const testStore = createStore(quoteWithNonEip712SignData);
            const { result } = renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Transaction error occurred')).toBeOnTheScreen();
            expect(result.queryByText('Quote error message')).toBeNull();
        });
    });
});
