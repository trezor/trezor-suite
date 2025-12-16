import { TradingTransaction } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getWalletState } from '@suite-native/trading-fixtures';

import { TradingWebViewScreen } from '../TradingWebViewScreen';

let mockRouteParams: {
    closeCallbackUrl: string;
    source?: { uri?: string; html?: string };
    orderId?: string;
} = { closeCallbackUrl: '' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingWebViewScreen', params: { ...mockRouteParams } }),
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
    it('should render header', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            source: { uri: 'SOURCE_URI', html: undefined },
        };
        const { getByTestId } = await renderWithStoreProviderAsync(<TradingWebViewScreen />);

        expect(getByTestId('@screen/sub-header/icon-left')).toBeTruthy();
    });

    it('should render error when no source is set', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
        };
        const { getByText } = await renderWithStoreProviderAsync(<TradingWebViewScreen />);

        expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('should render error when sources are undefined', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            source: { uri: undefined, html: undefined },
        };
        const { getByText } = await renderWithStoreProviderAsync(<TradingWebViewScreen />);

        expect(getByText('Something went wrong')).toBeTruthy();
    });

    describe('analytics', () => {
        let analyticsSpy: jest.SpyInstance;

        beforeEach(() => {
            jest.clearAllMocks();
            analyticsSpy = jest.spyOn(analytics, 'report');

            mockRouteParams = {
                closeCallbackUrl: 'CALLBACK_URL',
                orderId: 'orderId',
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

            await renderWithStoreProviderAsync(<TradingWebViewScreen />, {
                preloadedState,
            });

            expect(analyticsSpy).not.toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
            expect(analyticsSpy).not.toHaveBeenCalledWith({
                type: EventType.TradingSell,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
        });

        it('should report on mount for exchange', async () => {
            const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
            preloadedState.wallet.trading.trades = [
                {
                    tradeType: 'exchange',
                    data: {
                        orderId: 'orderId',
                    },
                } as unknown as TradingTransaction,
            ];

            await renderWithStoreProviderAsync(<TradingWebViewScreen />, {
                preloadedState,
            });

            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingExchange,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
        });

        it('should report on mount for sell', async () => {
            const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
            preloadedState.wallet.trading.trades = [
                {
                    tradeType: 'sell',
                    data: {
                        orderId: 'orderId',
                    },
                } as unknown as TradingTransaction,
            ];

            await renderWithStoreProviderAsync(<TradingWebViewScreen />, {
                preloadedState,
            });

            expect(analyticsSpy).toHaveBeenCalledWith({
                type: EventType.TradingSell,
                payload: expect.objectContaining({
                    step: 'webview',
                    action: 'visit',
                }),
            });
        });
    });
});
