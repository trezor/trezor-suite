import { TradingTransaction, TradingType } from '@suite-common/trading';
import { EventType } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getWalletState } from '@suite-native/trading-fixtures';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';

import { TradingWebViewScreen } from '../TradingWebViewScreen';

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

let mockRouteParams: {
    closeCallbackUrl: string;
    source?: { uri?: string; html?: string };
    orderId?: string;
    tradingType: TradingType;
} = { closeCallbackUrl: '', tradingType: 'buy' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingWebViewScreen', params: { ...mockRouteParams } }),
    useNavigation: () => ({
        goBack: jest.fn(),
    }),
}));

jest.mock('@suite-common/trading', () => {
    const actualImplementation = jest.requireActual('@suite-common/trading');

    return {
        ...actualImplementation,
        tradingThunks: {
            ...actualImplementation.tradingThunks,
            watchTradeThunk: () => ({ type: 'mocked-action' }),
        },
    };
});

describe('TradingWebViewScreen', () => {
    let unmount: (() => void) | undefined;

    const renderScreen = async (store?: TestStore) => {
        const reportMock = jest.fn();
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
        const result = await renderWithStoreProviderAsync(<TradingWebViewScreen />, { store });

        ({ unmount } = result);

        return { result, reportMock };
    };

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render header', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            source: { uri: 'SOURCE_URI', html: undefined },
            tradingType: 'buy',
        };
        const { result } = await renderScreen();

        expect(result.getByTestId('@screen/sub-header/icon-left')).toBeTruthy();
    });

    it('should render error when no source is set', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            tradingType: 'buy',
        };
        const { result } = await renderScreen();

        expect(result.getByText('Something went wrong')).toBeTruthy();
    });

    it('should render error when sources are undefined', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            source: { uri: undefined, html: undefined },
            tradingType: 'buy',
        };
        const { result } = await renderScreen();

        expect(result.getByText('Something went wrong')).toBeTruthy();
    });

    describe('analytics', () => {
        beforeEach(() => {
            mockRouteParams = {
                closeCallbackUrl: 'CALLBACK_URL',
                orderId: 'orderId',
                tradingType: 'buy',
            };
        });

        it('should report nothing on mount for buy', async () => {
            const preloadedState = { wallet: getWalletState({ tradeType: 'buy' }) };
            preloadedState.wallet.trading.trades = [
                {
                    tradeType: 'buy',
                    data: {
                        orderId: 'orderId',
                    },
                } as unknown as TradingTransaction,
            ];

            const { reportMock } = await renderScreen();

            expect(reportMock).not.toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
            expect(reportMock).not.toHaveBeenCalledWith({
                type: EventType.TradingSell,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
        });

        it('should report on mount for exchange', async () => {
            mockRouteParams.tradingType = 'exchange';
            const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
            preloadedState.wallet.trading.trades = [
                {
                    tradeType: 'exchange',
                    data: {
                        orderId: 'orderId',
                    },
                } as unknown as TradingTransaction,
            ];
            const { store } = initStore(preloadedState);

            const { reportMock } = await renderScreen(store);

            expect(reportMock).toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
        });

        it('should report on mount for sell', async () => {
            mockRouteParams.tradingType = 'sell';
            const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
            preloadedState.wallet.trading.trades = [
                {
                    tradeType: 'sell',
                    data: {
                        orderId: 'orderId',
                    },
                } as unknown as TradingTransaction,
            ];
            const { store } = initStore(preloadedState);

            const { reportMock } = await renderScreen(store);

            expect(reportMock).toHaveBeenCalledWith({
                type: EventType.TradingSell,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
        });

        it.each<TradingType>(['exchange', 'buy'])(
            'should not change providerConfirmationStatus for [%s]',
            async tradeType => {
                mockRouteParams.tradingType = tradeType;
                const preloadedState = { wallet: getWalletState({ tradeType }) };
                preloadedState.wallet.trading.trades = [
                    {
                        tradeType,
                        data: {
                            orderId: 'orderId',
                        },
                    } as unknown as TradingTransaction,
                ];
                const { store } = initStore(preloadedState);

                await renderScreen(store);

                expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
            },
        );

        it('should not change providerConfirmationStatus for [sell]', async () => {
            mockRouteParams.tradingType = 'sell';
            const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
            preloadedState.wallet.trading.trades = [
                {
                    tradeType: 'sell',
                    data: {
                        orderId: 'orderId',
                    },
                } as unknown as TradingTransaction,
            ];
            const { store } = initStore(preloadedState);

            await renderScreen(store);

            expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
        });
    });
});
