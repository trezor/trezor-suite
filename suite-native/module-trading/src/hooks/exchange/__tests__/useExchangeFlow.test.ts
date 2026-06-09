import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { RootStackRoutes } from '@suite-native/navigation';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
    invityDexQuote,
} from '@suite-native/trading-fixtures';

import { createTradingTestStore } from '../../../__tests__/tradingTestUtils';
import { type UseExchangeFlowProps, useExchangeFlow } from '../useExchangeFlow';

const mockNavigate = jest.fn();
let mockConfirmTradeThunk: jest.Mock;
let mockSignDataAndConfirmThunk: jest.Mock;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (callback: () => void) => {
        require('react').useEffect(callback, []);
    },
}));

// Mock TrezorConnect to prevent errors during cleanup
jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    cancel: jest.fn(),
}));

// Mock the exchange thunks
jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        confirmTradeThunk: (payload: unknown) => mockConfirmTradeThunk(payload),
        signDataAndConfirmThunk: (payload: unknown) => mockSignDataAndConfirmThunk(payload),
    },
}));

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1') });
const btc2Account = getBtcAccount({ descriptor: asAccountDescriptor('btc2') });

describe('useExchangeFlow', () => {
    const getMockAccounts = () => [btc1Account, btc2Account];

    const getInitializedStore = ({
        maxSlippagePercentage,
        withDevice = false,
    }: { maxSlippagePercentage?: string; withDevice?: boolean } = {}) => {
        const tradingState = getInitializedTradingStateWithQuotes();
        tradingState.exchange.tradingAccountKey = btc1Account.key;
        tradingState.exchange.receiveAccountKey = btc2Account.key;
        tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];
        if (maxSlippagePercentage) {
            tradingState.settings.maxSlippagePercentage = maxSlippagePercentage;
        }

        return createTradingTestStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: tradingState,
                    accounts: getMockAccounts(),
                },
                ...(withDevice && {
                    device: {
                        selectedDevice: {
                            path: 'device-path',
                            instance: 1,
                            state: {
                                staticSessionId: '1@2:3',
                            },
                            useEmptyPassphrase: true,
                        } as any,
                    },
                }),
            },
        });
    };

    const renderUseExchangeFlow = ({
        store,
        flowType,
    }: {
        store: TestStore;
        flowType?: UseExchangeFlowProps['flowType'];
    }) => {
        const reportMock = jest.fn();
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(reportMock),
        };

        return {
            reportMock,
            result: renderHookWithStoreProvider(() => useExchangeFlow({ flowType }), {
                services,
                store,
            }).result,
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockConfirmTradeThunk = jest.fn((payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
            unwrap: () => Promise.resolve(true),
        }));
        mockSignDataAndConfirmThunk = jest.fn((payload: unknown) => ({
            type: 'signDataAndConfirmThunkMock',
            payload,
            unwrap: () => Promise.resolve(true),
        }));

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('confirmTrade', () => {
        it('should call confirmTradeThunk when confirmTrade is called', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();

            const { result } = renderUseExchangeFlow({ store });

            const mockTrade = {
                exchange: 'test-exchange',
                orderId: 'test-order',
            };

            await act(async () => {
                await result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: mockTrade,
                    approvalFlow: false,
                    nextStep: mockNextStep,
                });
            });

            expect(dispatchSpy).toHaveBeenCalledWith({
                type: 'confirmTradeThunkMock',
                payload: {
                    returnUrl: expect.any(String),
                    receiveAddress: 'test-address',
                    account: expect.objectContaining({
                        key: btc1Account.key,
                        symbol: 'btc',
                    }),
                    extraField: undefined,
                    trade: mockTrade,
                    approvalFlow: false,
                    triggerAnalyticsTradeConfirmation: expect.any(Function),
                    processResponseData: expect.any(Function),
                    nextStep: mockNextStep,
                },
                unwrap: expect.any(Function),
            });
        });

        it('should call confirmTradeThunk with maxSlippage value for dex trade', async () => {
            const store = getInitializedStore({ maxSlippagePercentage: '2.5' });
            const mockNextStep = jest.fn();

            const { result } = renderUseExchangeFlow({ store });

            await act(async () => {
                await result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: invityDexQuote,
                    approvalFlow: false,
                    nextStep: mockNextStep,
                });
            });

            expect(mockConfirmTradeThunk).toHaveBeenCalledWith(
                expect.objectContaining({
                    trade: expect.objectContaining({
                        quoteId: invityDexQuote.quoteId,
                        swapSlippage: '2.5',
                    }),
                }),
            );
        });

        it('should return false when confirmTradeThunk returns false', async () => {
            const store = getInitializedStore();

            mockConfirmTradeThunk.mockImplementation(() => ({
                type: 'confirmTradeThunkMock',
                payload: undefined,
                unwrap: () => Promise.resolve(false),
            }));

            const { result } = renderUseExchangeFlow({ store });

            const confirmResult = await act(() =>
                result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: {
                        exchange: 'test-exchange',
                        orderId: 'test-order',
                    },
                    approvalFlow: false,
                    nextStep: jest.fn(),
                }),
            );

            expect(confirmResult).toBe(false);
        });

        it('should return false when trade is missing', async () => {
            const store = getInitializedStore();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});

            const { result } = renderUseExchangeFlow({ store });

            const confirmResult = await act(() =>
                result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: undefined,
                    approvalFlow: false,
                    nextStep: jest.fn(),
                }),
            );

            expect(confirmResult).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Trade, send account and common functions are required to confirm trade',
            );
        });

        it('should return false when sendAccount is missing', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});

            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.exchange.tradingAccountKey = mockAccountKey({
                symbol: 'btc',
                descriptor: 'unknownAccount',
            });
            tradingState.exchange.receiveAccountKey = btc2Account.key;
            tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

            const store = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: tradingState,
                        accounts: getMockAccounts(),
                    },
                },
            });
            const { result } = renderUseExchangeFlow({ store });

            const confirmResult = await act(() =>
                result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: {
                        exchange: 'test-exchange',
                        orderId: 'test-order',
                    },
                    approvalFlow: false,
                    nextStep: jest.fn(),
                }),
            );

            expect(confirmResult).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Trade, send account and common functions are required to confirm trade',
            );
        });
    });

    describe('signDataAndConfirm', () => {
        it('should call signDataAndConfirmThunk when signDataAndConfirm is called', async () => {
            const store = getInitializedStore({ withDevice: true });
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderUseExchangeFlow({ store });

            const signResult = await act(() =>
                result.current.signDataAndConfirm({
                    nextStep: mockNextStep,
                    onError: mockOnError,
                }),
            );

            expect(signResult).toBe(true);
            expect(mockOnError).not.toHaveBeenCalled();
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'signDataAndConfirmThunkMock',
                    payload: {
                        account: expect.objectContaining({
                            key: btc1Account.key,
                            symbol: 'btc',
                        }),
                        device: expect.objectContaining({
                            path: 'device-path',
                        }),
                        returnUrl: expect.any(String),
                        triggerAnalyticsTradeConfirmation: expect.any(Function),
                        processResponseData: expect.any(Function),
                        nextStep: mockNextStep,
                    },
                }),
            );
        });

        it('should return false when device is missing', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementationOnce(() => {});
            const store = getInitializedStore();

            const { result } = renderUseExchangeFlow({ store });

            const signResult = await act(() =>
                result.current.signDataAndConfirm({
                    nextStep: jest.fn(),
                    onError: jest.fn(),
                }),
            );

            expect(signResult).toBe(false);
            expect(mockSignDataAndConfirmThunk).not.toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'signDataAndConfirm: missing account, device, or common functions',
            );
        });

        it('should call onError and return false when signDataAndConfirmThunk rejects', async () => {
            const store = getInitializedStore({ withDevice: true });
            const mockNextStep = jest.fn();
            const mockOnError = jest.fn();
            const error = {
                type: 'sign-tx-error',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            };

            mockSignDataAndConfirmThunk.mockImplementation(() => ({
                type: 'signDataAndConfirmThunkMock',
                payload: undefined,
                unwrap: () => Promise.reject(error),
            }));

            const { result } = renderUseExchangeFlow({ store });

            const signResult = await act(() =>
                result.current.signDataAndConfirm({
                    nextStep: mockNextStep,
                    onError: mockOnError,
                }),
            );

            expect(signResult).toBe(false);
            expect(mockNextStep).not.toHaveBeenCalled();
            expect(mockOnError).toHaveBeenCalledWith(error);
        });
    });

    describe('analytics', () => {
        it('should call analytics event when confirmTrade is called', async () => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();

            const { result, reportMock } = renderUseExchangeFlow({ store });

            const mockTrade = {
                exchange: 'test-exchange',
                orderId: 'test-order',
            };

            await act(async () => {
                await result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: mockTrade,
                    approvalFlow: false,
                    nextStep: mockNextStep,
                });
            });

            const { triggerAnalyticsTradeConfirmation } = (dispatchSpy.mock.lastCall![0] as any)
                .payload;

            triggerAnalyticsTradeConfirmation();

            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingConfirmTradeEvent.name,
                payload: {
                    type: 'exchange',
                },
            });
        });
    });

    describe('navigation', () => {
        it('should navigate to TradingConfirming with flowType approve when quoteStatus is APPROVAL_PENDING', () => {
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.exchange.tradingAccountKey = btc1Account.key;
            tradingState.exchange.receiveAccountKey = btc2Account.key;
            tradingState.exchange.selectedQuote = {
                ...tradingState.exchange.quotes[0],
                status: 'APPROVAL_PENDING',
            };

            const store = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: tradingState,
                        accounts: getMockAccounts(),
                    },
                },
            });

            renderUseExchangeFlow({ store });

            expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.TradingConfirming, {
                flowType: 'approve',
            });
        });

        it('should navigate with flowType revoke when quoteStatus is APPROVAL_PENDING and flowType is revoke', () => {
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.exchange.tradingAccountKey = btc1Account.key;
            tradingState.exchange.receiveAccountKey = btc2Account.key;
            tradingState.exchange.selectedQuote = {
                ...tradingState.exchange.quotes[0],
                status: 'APPROVAL_PENDING',
            };

            const store = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: tradingState,
                        accounts: getMockAccounts(),
                    },
                },
            });

            renderUseExchangeFlow({ store, flowType: 'revoke' });

            expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.TradingConfirming, {
                flowType: 'revoke',
            });
        });

        it('should navigate with flowType revoke-and-approve when quoteStatus is APPROVAL_PENDING and flowType is revoke-and-approve', () => {
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.exchange.tradingAccountKey = btc1Account.key;
            tradingState.exchange.receiveAccountKey = btc2Account.key;
            tradingState.exchange.selectedQuote = {
                ...tradingState.exchange.quotes[0],
                status: 'APPROVAL_PENDING',
            };

            const store = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: tradingState,
                        accounts: getMockAccounts(),
                    },
                },
            });

            renderUseExchangeFlow({ store, flowType: 'revoke-and-approve' });

            expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.TradingConfirming, {
                flowType: 'revoke-and-approve',
            });
        });

        it('should not navigate to TradingConfirming when quoteStatus is not APPROVAL_PENDING', () => {
            const store = getInitializedStore();

            renderUseExchangeFlow({ store });

            expect(mockNavigate).not.toHaveBeenCalledWith(
                RootStackRoutes.TradingConfirming,
                expect.anything(),
            );
        });
    });
});
