import { TradingTransaction, TradingType } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getWalletState } from '@suite-native/trading-fixtures';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';

import { TradingWebViewScreen } from '../TradingWebViewScreen';

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
        const result = await renderWithStoreProviderAsync(<TradingWebViewScreen />, { store });

        ({ unmount } = result);

        return result;
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
        const { getByTestId } = await renderScreen();

        expect(getByTestId('@screen/sub-header/icon-left')).toBeTruthy();
    });

    it('should render error when no source is set', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            tradingType: 'buy',
        };
        const { getByText } = await renderScreen();

        expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('should render error when sources are undefined', async () => {
        mockRouteParams = {
            closeCallbackUrl: 'CALLBACK_URL',
            source: { uri: undefined, html: undefined },
            tradingType: 'buy',
        };
        const { getByText } = await renderScreen();

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

            await renderScreen();

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

            await renderScreen(store);

            expect(analyticsSpy).toHaveBeenCalledWith({
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

            await renderScreen(store);

            expect(analyticsSpy).toHaveBeenCalledWith({
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
