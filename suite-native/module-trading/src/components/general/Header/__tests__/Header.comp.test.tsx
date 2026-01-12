import { EventType, analytics } from '@suite-native/analytics';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import {
    PreloadedState,
    TestStore,
    fireEvent,
    initStore,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { TradingRootState } from '@suite-native/trading-state';

import { Header } from '../Header';

describe('Header', () => {
    const getFFPreloadedState = ({
        buyEnabled = false,
        sellEnabled = false,
        exchangeEnabled = false,
        areTradingExchangeDexesEnabled = true,
    }: {
        buyEnabled?: boolean;
        sellEnabled?: boolean;
        exchangeEnabled?: boolean;
        areTradingExchangeDexesEnabled?: boolean;
    }) => ({
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingBuyEnabled]: buyEnabled,
            [FeatureFlag.IsTradingExchangeEnabled]: exchangeEnabled,
            [FeatureFlag.IsTradingSellEnabled]: sellEnabled,
            [FeatureFlag.AreTradingExchangeDexesEnabled]: areTradingExchangeDexesEnabled,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    });

    const renderHeader = ({
        buyEnabled = false,
        sellEnabled = false,
        exchangeEnabled = false,
        areTradingExchangeDexesEnabled = true,
        tradingPreloadedState = undefined,
    }: {
        buyEnabled?: boolean;
        sellEnabled?: boolean;
        exchangeEnabled?: boolean;
        areTradingExchangeDexesEnabled?: boolean;
        tradingPreloadedState?: TradingRootState | undefined;
    }) => {
        const preloadedState: PreloadedState = {
            ...getFFPreloadedState({
                buyEnabled,
                sellEnabled,
                exchangeEnabled,
                areTradingExchangeDexesEnabled,
            }),

            messageSystem: {
                validMessages: {
                    banner: [],
                    context: [],
                    modal: [],
                    feature: ['actionId'],
                },
                dismissedMessages: [] as any,
                config: {
                    actions: [
                        {
                            message: {
                                id: 'actionId',
                                category: ['feature'],
                                feature: [
                                    {
                                        domain: 'trading.buy',
                                        flag: buyEnabled,
                                    },
                                    {
                                        domain: 'trading.exchange',
                                        flag: exchangeEnabled,
                                    },
                                    {
                                        domain: 'trading.sell',
                                        flag: sellEnabled,
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            ...tradingPreloadedState,
        } as unknown as PreloadedState;

        return renderWithStoreProviderAsync(<Header />, { preloadedState });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        {
            buyEnabled: true,
            sellEnabled: true,
            exchangeEnabled: true,
        },
        {
            buyEnabled: true,
            sellEnabled: false,
            exchangeEnabled: false,
        },
        {
            buyEnabled: false,
            sellEnabled: true,
            exchangeEnabled: false,
        },
        {
            buyEnabled: true,
            sellEnabled: true,
            exchangeEnabled: false,
        },
        {
            buyEnabled: false,
            sellEnabled: false,
            exchangeEnabled: true,
        },
    ])('should display Header tabs with Buy, Swap and Sell tabs, case %#', async config => {
        const { getByText } = await renderHeader(config);

        expect(getByText('Buy')).toBeOnTheScreen();
        expect(getByText('Swap')).toBeOnTheScreen();
        expect(getByText('Sell')).toBeOnTheScreen();
    });

    it('should display nothing when isAmountInputActive is true', async () => {
        const { toJSON } = await renderHeader({
            buyEnabled: true,
            tradingPreloadedState: {
                wallet: {
                    trading: {
                        isAmountInputActive: true,
                    } as any,
                },
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('should set state on tab button press', async () => {
        const { store } = initStore(
            getFFPreloadedState({
                buyEnabled: true,
                exchangeEnabled: true,
            }),
        );
        const { getByText } = await renderWithStoreProviderAsync(<Header />, { store });

        fireEvent.press(getByText('Swap'));

        expect(store.getState().wallet.trading.activeTradingType).toBe('exchange');
    });

    it('should display trade settings button', async () => {
        const { getByLabelText } = await renderHeader({
            buyEnabled: true,
            exchangeEnabled: true,
        });

        expect(getByLabelText('Advanced settings')).toBeOnTheScreen();
    });

    it('should not display settings wheel when AreTradingExchangeDexesEnabled is disabled', async () => {
        const { queryByLabelText } = await renderHeader({
            buyEnabled: true,
            exchangeEnabled: true,
            areTradingExchangeDexesEnabled: false,
        });

        expect(queryByLabelText('Advanced settings')).toBeNull();
    });

    describe('analytics', () => {
        let store: TestStore;

        beforeEach(() => {
            store = initStore(
                getFFPreloadedState({
                    buyEnabled: true,
                    exchangeEnabled: true,
                    sellEnabled: true,
                }),
            ).store;
        });

        it('should report TradingNavigate event on tab change', async () => {
            const { getByText } = await renderWithStoreProviderAsync(<Header />, { store });
            const reportSpy = jest.spyOn(analytics, 'report');

            fireEvent.press(getByText('Swap'));

            expect(reportSpy).toHaveBeenCalledWith({
                type: EventType.TradingNavigate,
                payload: {
                    action: 'navigate',
                    type: 'exchange',
                    from: 'trade/buy',
                },
            });
        });

        it('should not report TradingNavigate event when tab was not changed', async () => {
            const { getByText } = await renderWithStoreProviderAsync(<Header />, { store });
            const reportSpy = jest.spyOn(analytics, 'report');
            fireEvent.press(getByText('Swap'));
            reportSpy.mockClear();

            fireEvent.press(getByText('Swap'));

            expect(reportSpy).not.toHaveBeenCalled();
        });

        it('should report TradingNavigate event when tab was changed to buy', async () => {
            const { getByText } = await renderWithStoreProviderAsync(<Header />, { store });
            const reportSpy = jest.spyOn(analytics, 'report');
            fireEvent.press(getByText('Swap'));
            reportSpy.mockClear();

            fireEvent.press(getByText('Buy'));

            expect(reportSpy).toHaveBeenCalledWith({
                type: EventType.TradingNavigate,
                payload: {
                    action: 'navigate',
                    type: 'buy',
                    from: 'trade/exchange',
                },
            });
        });
    });
});
