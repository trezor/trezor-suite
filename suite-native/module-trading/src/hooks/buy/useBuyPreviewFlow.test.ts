import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    getInitializedTradingState,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { useBuyPreviewFlow } from './useBuyPreviewFlow';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

const mockPopToTop = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ popToTop: mockPopToTop }),
}));

const mockOpenBrowserForFormData = jest.fn();

jest.mock('@suite-native/trading-browser-auth', () => ({
    ...jest.requireActual('@suite-native/trading-browser-auth'),
    useBrowserAuth: () => ({ openBrowserForFormData: mockOpenBrowserForFormData }),
}));

const mockConfirmTradeThunk = jest.fn();

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    buyThunks: {
        confirmTradeThunk: (payload: unknown) => {
            mockConfirmTradeThunk(payload);

            // Return a thunk so redux-thunk intercepts it before the serializable check middleware
            return () => Promise.resolve();
        },
    },
}));

const mockReport = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(mockReport),
};

describe('useBuyPreviewFlow', () => {
    const receiveAddress =
        btc1NormalAccount.addresses?.used?.[0]?.address ?? btc1NormalAccount.descriptor;

    beforeEach(() => {
        jest.clearAllMocks();
        mockOpenBrowserForFormData.mockResolvedValue(undefined);
    });

    const getInitializedStore = ({
        isLoading = false,
        withFullState = false,
    }: {
        isLoading?: boolean;
        withFullState?: boolean;
    } = {}) => {
        const baseBuyState = getInitializedTradingState().buy;

        return createTradingLightStore({
            tradeType: 'buy',
            overrides: {
                wallet: {
                    trading: {
                        ...getInitializedTradingState(),
                        buy: {
                            ...baseBuyState,
                            isLoading,
                            ...(withFullState && {
                                selectedQuote: mercuryoApplePayBuyQuote,
                                receiveAddress,
                                receiveAccountKey: btc1NormalAccount.key,
                            }),
                        },
                    },
                },
            },
        });
    };

    const renderHook = (store: ReturnType<typeof getInitializedStore>) =>
        renderHookWithStoreProvider(() => useBuyPreviewFlow(), { store, services });

    const getProcessResponseData = () => {
        const [payload] = mockConfirmTradeThunk.mock.calls[0] as [any];

        return payload.processResponseData as (response: unknown) => Promise<void>;
    };

    describe('canProceed', () => {
        it('is false when isLoading is true', () => {
            const store = getInitializedStore({ isLoading: true, withFullState: true });
            const { result } = renderHook(store);

            expect(result.current.canProceed).toBe(false);
        });

        it('is false when receive address or account key is missing', () => {
            const store = getInitializedStore({ withFullState: false });
            const { result } = renderHook(store);

            expect(result.current.canProceed).toBe(false);
        });

        it('is true when not loading and all required state is set', () => {
            const store = getInitializedStore({ withFullState: true });
            const { result } = renderHook(store);

            expect(result.current.canProceed).toBe(true);
        });
    });

    describe('confirmTrade', () => {
        it('dispatches confirmTradeThunk with correct address and account when canProceed is true', () => {
            const store = getInitializedStore({ withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            expect(mockConfirmTradeThunk).toHaveBeenCalledWith(
                expect.objectContaining({
                    address: receiveAddress,
                    account: expect.objectContaining({ key: btc1NormalAccount.key }),
                }),
            );
        });

        it('does not dispatch confirmTradeThunk when canProceed is false', () => {
            const store = getInitializedStore({ isLoading: true, withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            expect(mockConfirmTradeThunk).not.toHaveBeenCalled();
        });
    });

    describe('handleTradeResponse', () => {
        it('opens browser, pops to top, and clears Redux state when tradeForm is present', async () => {
            const store = getInitializedStore({ withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            await act(async () => {
                await getProcessResponseData()({
                    trade: { paymentId: 'pay-123', orderId: 'order-123' },
                    tradeForm: {
                        form: { action: 'https://example.com', body: {}, method: 'POST' },
                    },
                });
            });

            expect(mockOpenBrowserForFormData).toHaveBeenCalledTimes(1);
            expect(mockPopToTop).toHaveBeenCalledTimes(1);
            expect(store.getState().wallet.trading.buy.selectedQuote).toBeUndefined();
        });

        it('navigates to trading screen before clearing Redux state', async () => {
            const store = getInitializedStore({ withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            mockPopToTop.mockImplementationOnce(() => {
                expect(store.getState().wallet.trading.buy.selectedQuote).toBeDefined();
            });

            await act(async () => {
                await getProcessResponseData()({
                    trade: { orderId: 'order-123' },
                    tradeForm: {
                        form: { action: 'https://example.com', body: {}, method: 'POST' },
                    },
                });
            });

            expect(store.getState().wallet.trading.buy.selectedQuote).toBeUndefined();
        });

        it('does not open browser or navigate when tradeForm is absent', async () => {
            const store = getInitializedStore({ withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            await act(async () => {
                await getProcessResponseData()({
                    trade: { paymentId: 'pay-123', orderId: 'order-123' },
                });
            });

            expect(mockOpenBrowserForFormData).not.toHaveBeenCalled();
            expect(mockPopToTop).not.toHaveBeenCalled();
            expect(store.getState().wallet.trading.buy.selectedQuote).toStrictEqual(
                mercuryoApplePayBuyQuote,
            );
        });
    });

    describe('analytics', () => {
        it('reports buy-preview continue when confirmTrade is called and canProceed is true', () => {
            const store = getInitializedStore({ withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            expect(mockReport).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: events.tradingBuyEvent.name,
                    payload: expect.objectContaining({
                        step: 'buy-preview',
                        action: 'continue',
                        exchangeName: 'mercuryo',
                    }),
                }),
            );
        });

        it('does not report analytics when canProceed is false', () => {
            const store = getInitializedStore({ isLoading: true, withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            expect(mockReport).not.toHaveBeenCalled();
        });

        it('triggerAnalyticsTradeConfirmation reports tradingConfirmTradeEvent', () => {
            const store = getInitializedStore({ withFullState: true });
            const { result } = renderHook(store);

            act(() => {
                result.current.confirmTrade();
            });

            const [payload] = mockConfirmTradeThunk.mock.calls[0] as [any];
            payload.triggerAnalyticsTradeConfirmation();

            expect(mockReport).toHaveBeenCalledWith({
                type: events.tradingConfirmTradeEvent.name,
                payload: { type: 'buy' },
            });
        });
    });
});
