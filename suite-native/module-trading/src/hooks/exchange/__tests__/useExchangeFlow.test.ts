import { type AccountKey } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { TradingStackRoutes } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';

import { createTradingTestStore } from '../../../__tests__/tradingTestUtils';
import { type UseExchangeFlowProps, useExchangeFlow } from '../useExchangeFlow';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (callback: () => void) => {
        require('react').useEffect(callback, []);
    },
}));

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

// Mock TrezorConnect to prevent errors during cleanup
jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    cancel: jest.fn(),
}));

// Mock the exchange thunks
jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        confirmTradeThunk: (payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
            unwrap: () => Promise.resolve(true),
        }),
    },
}));

const btc1AccountKey = 'btc1' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc2AccountKey = 'btc2' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useExchangeFlow', () => {
    const getMockAccounts = () => [getBtcAccount(btc1AccountKey), getBtcAccount(btc2AccountKey)];

    const getInitializedStore = () => {
        const tradingState = getInitializedTradingStateWithQuotes();
        tradingState.exchange.tradingAccountKey = btc1AccountKey;
        tradingState.exchange.receiveAccountKey = btc2AccountKey;
        tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

        return createTradingTestStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: tradingState,
                    accounts: getMockAccounts(),
                },
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

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        return {
            reportMock,
            result: renderHookWithStoreProvider(() => useExchangeFlow({ flowType }), { store })
                .result,
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'error').mockImplementation(() => {});
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
                        key: 'btc1',
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

        it('should return false when confirmTradeThunk returns false', async () => {
            const store = getInitializedStore();

            const originalConfirmTradeThunk =
                require('@suite-common/trading').exchangeThunks.confirmTradeThunk;
            require('@suite-common/trading').exchangeThunks.confirmTradeThunk = () => ({
                type: 'confirmTradeThunkMock',
                unwrap: () => Promise.resolve(false),
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

            require('@suite-common/trading').exchangeThunks.confirmTradeThunk =
                originalConfirmTradeThunk;
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
            tradingState.exchange.tradingAccountKey = 'invalid-account-key' as AccountKey; // Todo: create properly via `createAccountKey()`
            tradingState.exchange.receiveAccountKey = btc2AccountKey;
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
            tradingState.exchange.tradingAccountKey = btc1AccountKey;
            tradingState.exchange.receiveAccountKey = btc2AccountKey;
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

            expect(mockNavigate).toHaveBeenCalledWith(TradingStackRoutes.TradingConfirming, {
                flowType: 'approve',
            });
        });

        it('should navigate with flowType revoke when quoteStatus is APPROVAL_PENDING and flowType is revoke', () => {
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.exchange.tradingAccountKey = btc1AccountKey;
            tradingState.exchange.receiveAccountKey = btc2AccountKey;
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

            expect(mockNavigate).toHaveBeenCalledWith(TradingStackRoutes.TradingConfirming, {
                flowType: 'revoke',
            });
        });

        it('should navigate with flowType revoke-and-approve when quoteStatus is APPROVAL_PENDING and flowType is revoke-and-approve', () => {
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.exchange.tradingAccountKey = btc1AccountKey;
            tradingState.exchange.receiveAccountKey = btc2AccountKey;
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

            expect(mockNavigate).toHaveBeenCalledWith(TradingStackRoutes.TradingConfirming, {
                flowType: 'revoke-and-approve',
            });
        });

        it('should not navigate to TradingConfirming when quoteStatus is not APPROVAL_PENDING', () => {
            const store = getInitializedStore();

            renderUseExchangeFlow({ store });

            expect(mockNavigate).not.toHaveBeenCalledWith(
                TradingStackRoutes.TradingConfirming,
                expect.anything(),
            );
        });
    });
});
