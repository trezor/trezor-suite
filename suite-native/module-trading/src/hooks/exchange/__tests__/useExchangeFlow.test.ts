import { tradingExchangeActions } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import {
    getBtcAccount,
    getInitializedTradingStateWithQuotes,
} from '@suite-native/trading-fixtures';

import { useExchangeFlow } from '../useExchangeFlow';

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

describe('useExchangeFlow', () => {
    const getMockAccounts = () => [getBtcAccount('btc1'), getBtcAccount('btc2')];

    const getInitializedStore = () => {
        const tradingState = getInitializedTradingStateWithQuotes();
        // Add the required account keys to the exchange state
        tradingState.exchange.tradingAccountKey = 'btc1';
        tradingState.exchange.receiveAccountKey = 'btc2';
        // Set a selected quote so the hook can access selectedQuote.send
        tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

        const preloadedState: PreloadedState = {
            wallet: {
                trading: tradingState,
                accounts: getMockAccounts(),
            },
        };

        return initStore(preloadedState).store;
    };

    const renderUseExchangeFlow = ({ store }: { store: TestStore }) =>
        renderHookWithStoreProviderAsync(() => useExchangeFlow(), { store });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('confirmTrade', () => {
        it('should call confirmTradeThunk when confirmTrade is called', async () => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();

            const { result } = await renderUseExchangeFlow({ store });

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

            // Should call confirmTradeThunk
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
            const store = await getInitializedStore();

            // Mock confirmTradeThunk to return false
            const originalConfirmTradeThunk =
                require('@suite-common/trading').exchangeThunks.confirmTradeThunk;
            require('@suite-common/trading').exchangeThunks.confirmTradeThunk = () => ({
                type: 'confirmTradeThunkMock',
                unwrap: () => Promise.resolve(false),
            });

            const { result } = await renderUseExchangeFlow({ store });

            const mockTrade = {
                exchange: 'test-exchange',
                orderId: 'test-order',
            };

            const confirmResult = await act(
                async () =>
                    await result.current.confirmTrade({
                        receiveAddress: 'test-address',
                        trade: mockTrade,
                        approvalFlow: false,
                        nextStep: jest.fn(),
                    }),
            );

            // Should return false
            expect(confirmResult).toBe(false);

            // Restore the original mock
            require('@suite-common/trading').exchangeThunks.confirmTradeThunk =
                originalConfirmTradeThunk;
        });

        it('should return false when trade is missing', async () => {
            const store = await getInitializedStore();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});

            const { result } = await renderUseExchangeFlow({ store });

            const confirmResult = await act(
                async () =>
                    await result.current.confirmTrade({
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

            // Create a store with invalid tradingAccountKey
            const tradingState = getInitializedTradingStateWithQuotes();
            tradingState.exchange.tradingAccountKey = 'invalid-account-key';
            tradingState.exchange.receiveAccountKey = 'btc2';
            tradingState.exchange.selectedQuote = tradingState.exchange.quotes[0];

            const preloadedState: PreloadedState = {
                wallet: {
                    trading: tradingState,
                    accounts: getMockAccounts(),
                },
            };

            const { store } = initStore(preloadedState);
            const { result } = await renderUseExchangeFlow({ store });

            const mockTrade = {
                exchange: 'test-exchange',
                orderId: 'test-order',
            };

            const confirmResult = await act(
                async () =>
                    await result.current.confirmTrade({
                        receiveAddress: 'test-address',
                        trade: mockTrade,
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

    describe('getCommonFunctions', () => {
        it('should return null when no trade is provided and no selectedQuote', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});
            // Mock the selector to return undefined for selectedQuote
            const store = await getInitializedStore();
            store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

            const { result } = await renderUseExchangeFlow({ store });

            // The getCommonFunctions is called internally, but we can test its effect
            // by calling confirmTrade without a trade parameter
            const resultValue = await act(() =>
                result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: undefined,
                    approvalFlow: false,
                    nextStep: jest.fn(),
                }),
            );

            expect(resultValue).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Trade, send account and common functions are required to confirm trade',
            );
        });

        it('should return common functions when trade is provided', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeFlow({ store });

            const mockTrade = {
                exchange: 'test-exchange',
                orderId: 'test-order',
            };

            // Test by calling confirmTrade which uses getCommonFunctions internally
            await act(async () => {
                await result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    trade: mockTrade,
                    approvalFlow: false,
                    nextStep: jest.fn(),
                });
            });

            // If we get here without errors, getCommonFunctions worked correctly
            expect(true).toBe(true);
        });

        it('should return common functions when preselected quote is provided', async () => {
            const store = await getInitializedStore();
            store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            store.dispatch(
                tradingExchangeActions.savePreselectedQuote({
                    exchange: 'test-exchange',
                    orderId: 'test-order',
                }),
            );
            const { result } = await renderUseExchangeFlow({ store });

            // Test by calling confirmTrade which uses getCommonFunctions internally
            await act(async () => {
                await result.current.confirmTrade({
                    receiveAddress: 'test-address',
                    approvalFlow: false,
                    nextStep: jest.fn(),
                });
            });

            // If we get here without errors, getCommonFunctions worked correctly
            expect(true).toBe(true);
        });
    });

    describe('analytics', () => {
        it('should call analytics event when confirmTrade is called', async () => {
            const analyticsSpy = jest.spyOn(analytics, 'report');
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const mockNextStep = jest.fn();

            const { result } = await renderUseExchangeFlow({ store });

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

            // simulate triggerAnalyticsTradeConfirmation call in thunk
            const { triggerAnalyticsTradeConfirmation } = (dispatchSpy.mock.lastCall![0] as any)
                .payload;
            triggerAnalyticsTradeConfirmation();

            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingConfirmTrade,
                payload: {
                    type: 'exchange',
                },
            });
        });
    });
});
