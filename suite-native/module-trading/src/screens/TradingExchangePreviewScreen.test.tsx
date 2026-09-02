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
    mercuryoDexQuote,
    mercuryoFixedWorstQuote,
    oneInchFusionPlusWithEip712SignDataQuote,
} from '@suite-native/trading-fixtures';

import {
    TradingExchangePreviewScreen,
    type TradingExchangePreviewScreenProps,
} from './TradingExchangePreviewScreen';
import { useDexExchangeTxSimulation } from '../hooks/exchange/useDexExchangeTxSimulation';
import { useExchangeIssue } from '../hooks/exchange/useExchangeIssue';
import { createTradingLightStore } from '../test-utils/tradingTestUtils';

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
        popToTop: jest.fn(),
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
const mockComposeTradingTransaction = jest.fn();
const mockSignAndSendTransaction = jest.fn();
const mockResolveConsent = jest.fn();
const mockAbortConfirmTrade = jest.fn();
let mockTxnErrorString: string | null = null;

jest.mock('../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        abortConfirmTrade: mockAbortConfirmTrade,
        confirmTrade: mockConfirmTrade,
        composeTradingTransaction: mockComposeTradingTransaction,
        signAndSendTransaction: mockSignAndSendTransaction,
        signDataAndConfirm: jest.fn(),
        isConsentRequested: false,
        resolveConsent: mockResolveConsent,
        get txnErrorString() {
            return mockTxnErrorString;
        },
    }),
}));

jest.mock('../hooks/exchange/useExchangeIssue', () => ({
    useExchangeIssue: jest.fn(),
}));
jest.mock('../hooks/exchange/useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

const mockUseExchangeIssue = jest.mocked(useExchangeIssue);
const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);
type SimulationResult = NonNullable<ReturnType<typeof useDexExchangeTxSimulation>['data']>;

const createSimulationResult = (): SimulationResult => ({
    method: 'ethereumSignTransaction',
    payload: {
        block: '123',
        chain: 'ethereum',
        needsDisclaimer: false,
    },
});

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

    const renderTradingExchangePreviewScreen = async (
        isApproved: boolean = false,
        customStore?: TestStore,
    ) => {
        const testStore = customStore ?? store;
        const reportMock = jest.fn();
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(reportMock),
        };
        jest.clearAllMocks();

        const result = await renderWithStoreProvider(
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
        mockUseExchangeIssue.mockReturnValue({
            isSimulationEnabled: false,
            isSimulationLoading: false,
            isSimulation: false,
            issue: null,
        });
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: false,
            isLoading: false,
            error: null,
            data: undefined,
        });

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        store = createStore();
    });

    afterEach(async () => {
        consoleErrorSpy.mockRestore();
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    it('should display device guard when device is not connected', async () => {
        mockIsDeviceConnected = false;
        const { result } = await renderTradingExchangePreviewScreen();
        expect(
            result.getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });

    it('should render continue button', async () => {
        const { result } = await renderTradingExchangePreviewScreen();

        expect(result.getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();
    });

    it('should render screen title correctly', async () => {
        const { result } = await renderTradingExchangePreviewScreen();

        expect(
            result.getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.title')),
        ).toBeOnTheScreen();
    });

    it('should render from and to account labels', async () => {
        const { result } = await renderTradingExchangePreviewScreen();

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

    it('should render transaction details section', async () => {
        const {
            result: { getByText },
        } = await renderTradingExchangePreviewScreen();

        // 1st line of trade info is provider
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });

    describe('Error Alert Functionality', () => {
        it('should show error alert when trade confirmation errors', async () => {
            mockConfirmTrade.mockRejectedValueOnce(new Error('Trade confirmation failed'));

            await renderTradingExchangePreviewScreen();

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

            const { reportMock } = await renderTradingExchangePreviewScreen();

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

            const { reportMock } = await renderTradingExchangePreviewScreen();

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

            await renderTradingExchangePreviewScreen();

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockShowAlert).not.toHaveBeenCalled();
        });
    });

    it('should report to analytics on mount', async () => {
        const { reportMock } = await renderTradingExchangePreviewScreen();

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'transaction-preview',
                action: 'visit',
            }),
        });
    });

    it('reports a validation risk as a high-risk issue', async () => {
        mockUseExchangeIssue.mockReturnValue({
            isSimulationEnabled: true,
            isSimulationLoading: false,
            isSimulation: true,
            issue: {
                type: 'high-risk',
                severity: 'critical',
                validation: {
                    riskLevel: 'Warning',
                    description: 'Risk detected',
                    features: [],
                },
            },
        });

        const { reportMock } = await renderTradingExchangePreviewScreen();

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeIssueEvent.name,
            payload: {
                issue: 'high-risk',
                isSimulation: true,
            },
        });
    });

    it('reports a returned simulation failure as a slippage-too-low issue', async () => {
        mockUseExchangeIssue.mockReturnValue({
            isSimulationEnabled: true,
            isSimulationLoading: false,
            isSimulation: true,
            issue: {
                type: 'slippage-too-low',
                severity: 'warning',
            },
        });

        const { reportMock } = await renderTradingExchangePreviewScreen();

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeIssueEvent.name,
            payload: {
                issue: 'slippage-too-low',
                isSimulation: true,
            },
        });
    });

    it.each([
        [0.15, 'price-impact-warning', false],
        [0.2, 'price-impact-critical', true],
    ] as const)(
        'reports deviation %s as %s with isSimulation=%s',
        async (deviation, issue, isSimulation) => {
            mockUseExchangeIssue.mockReturnValue({
                isSimulationEnabled: true,
                isSimulationLoading: false,
                isSimulation,
                issue: {
                    type: 'price-impact',
                    severity: deviation >= 0.2 ? 'critical' : 'warning',
                    deviation,
                },
            });
            mockUseDexExchangeTxSimulation.mockReturnValue({
                isEnabled: true,
                isLoading: false,
                error: null,
                data: isSimulation ? createSimulationResult() : undefined,
            });

            const { reportMock } = await renderTradingExchangePreviewScreen();

            expect(reportMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: events.tradingExchangeIssueEvent.name,
                    payload: expect.objectContaining({ issue, isSimulation }),
                }),
            );
        },
    );

    it('does not report an equivalent exchange issue twice', async () => {
        const firstIssue = {
            type: 'slippage-too-low' as const,
            severity: 'warning' as const,
        };
        mockUseExchangeIssue.mockReturnValue({
            isSimulationEnabled: true,
            isSimulationLoading: false,
            isSimulation: true,
            issue: firstIssue,
        });

        const { result, reportMock } = await renderTradingExchangePreviewScreen();
        const countIssueEvents = () =>
            reportMock.mock.calls.filter(
                ([event]) => event.type === events.tradingExchangeIssueEvent.name,
            ).length;

        expect(countIssueEvents()).toBe(1);

        await result.rerender(
            <TradingExchangePreviewScreen
                navigation={createNavigationProps()}
                route={createRouteProps()}
            />,
        );
        expect(countIssueEvents()).toBe(1);

        mockUseExchangeIssue.mockReturnValue({
            isSimulationEnabled: true,
            isSimulationLoading: false,
            isSimulation: true,
            issue: { ...firstIssue },
        });
        await result.rerender(
            <TradingExchangePreviewScreen
                navigation={createNavigationProps()}
                route={createRouteProps()}
            />,
        );

        expect(countIssueEvents()).toBe(1);
    });

    it('should abort confirm trade on unmount', async () => {
        const { result } = await renderTradingExchangePreviewScreen();

        expect(mockAbortConfirmTrade).not.toHaveBeenCalled();

        await result.unmount();
        unmount = undefined;

        expect(mockAbortConfirmTrade).toHaveBeenCalledTimes(1);
    });

    it('should clear trading state on unmount', async () => {
        const { result } = await renderTradingExchangePreviewScreen();

        expect(store.getState().wallet.trading.exchange.selectedQuote).toBeDefined();

        await result.unmount();
        unmount = undefined;

        expect(store.getState().wallet.trading.exchange.selectedQuote).toBeUndefined();
        expect(store.getState().wallet.trading.sell.selectedQuote).toBeUndefined();
    });

    it('should report to analytics on Continue press', async () => {
        const { result, reportMock } = await renderTradingExchangePreviewScreen();
        reportMock.mockClear();

        await userEvent.press(
            result.getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

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

            await renderTradingExchangePreviewScreen(false, testStore);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledTimes(1);
            });
            expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.TradingExchangeApproval, {});
        });
    });

    describe('Error String Fallback Logic', () => {
        it('should use txnErrorString when provided', async () => {
            mockTxnErrorString = 'Transaction error occurred';

            const { result } = await renderTradingExchangePreviewScreen();

            expect(result.getByText('Transaction error occurred')).toBeOnTheScreen();
        });

        it('should fall back to quote.error when txnErrorString is null', async () => {
            mockTxnErrorString = null;

            const quoteWithError = {
                ...mercuryoFixedWorstQuote,
                error: 'Quote error message',
            };

            const testStore = createStore(quoteWithError);
            const { result } = await renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Quote error message')).toBeOnTheScreen();
        });

        it('should not show error when both txnErrorString and quote.error are null', async () => {
            mockTxnErrorString = null;

            const quoteWithoutError = {
                ...mercuryoFixedWorstQuote,
                error: undefined,
            };

            const testStore = createStore(quoteWithoutError);
            const { result } = await renderTradingExchangePreviewScreen(false, testStore);

            expect(result.queryByText('Transaction error occurred')).toBeNull();
            expect(result.queryByText('Quote error message')).toBeNull();
        });

        it('should prioritize txnErrorString over quote.error', async () => {
            mockTxnErrorString = 'Transaction error takes priority';

            const quoteWithError = {
                ...mercuryoFixedWorstQuote,
                error: 'Quote error message',
            };

            const testStore = createStore(quoteWithError);
            const { result } = await renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Transaction error takes priority')).toBeOnTheScreen();
            expect(result.queryByText('Quote error message')).toBeNull();
        });

        it('should not show errors for quote with SIGN_DATA status and EIP-712 data', async () => {
            mockTxnErrorString = 'Transaction error occurred';

            const quoteWithEip712SignData = {
                ...oneInchFusionPlusWithEip712SignDataQuote,
                error: 'Quote error message',
            };

            const testStore = createStore(quoteWithEip712SignData);
            const { result } = await renderTradingExchangePreviewScreen(false, testStore);

            expect(result.queryByText('Transaction error occurred')).toBeNull();
            expect(result.queryByText('Quote error message')).toBeNull();
        });

        it('should show errors for quote with SIGN_DATA status and non-EIP-712 data', async () => {
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
            const { result } = await renderTradingExchangePreviewScreen(false, testStore);

            expect(result.getByText('Transaction error occurred')).toBeOnTheScreen();
            expect(result.queryByText('Quote error message')).toBeNull();
        });
    });

    it('should preserve quote slippage when confirming a DEX quote', async () => {
        const testStore = createStore({ ...mercuryoDexQuote, swapSlippage: '0.5' });

        await renderTradingExchangePreviewScreen(false, testStore);

        await waitFor(() => {
            expect(mockConfirmTrade).toHaveBeenCalledTimes(1);
        });

        expect(mockConfirmTrade).toHaveBeenCalledWith(
            expect.objectContaining({
                trade: expect.objectContaining({
                    swapSlippage: '0.5',
                }),
            }),
        );
    });

    it('should confirm the trade again with user-confirmed slippage', async () => {
        const testStore = createStore(mercuryoDexQuote);
        const { result } = await renderTradingExchangePreviewScreen(false, testStore);

        await waitFor(() => {
            expect(mockConfirmTrade).toHaveBeenCalledTimes(1);
        });

        await userEvent.press(result.getByText('3%'));
        await userEvent.press(result.getByText(getTranslation('generic.buttons.confirm')));

        await waitFor(() => {
            expect(mockConfirmTrade).toHaveBeenCalledTimes(2);
        });
        expect(mockConfirmTrade).toHaveBeenLastCalledWith(
            expect.objectContaining({
                trade: expect.objectContaining({
                    swapSlippage: '3',
                }),
            }),
        );
    });
});
