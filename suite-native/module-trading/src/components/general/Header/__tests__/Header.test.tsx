import { events } from '@suite-native/analytics';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    type TestStore,
    fireEvent,
    initStore,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import { type TradingRootState } from '@suite-native/trading-state';

import { Header } from '../Header';

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

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

    const renderWithStoreProviderWithReportMock = (
        ...args: Parameters<typeof renderWithStoreProvider>
    ) => {
        const reportMock = jest.fn();
        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        return {
            renderer: renderWithStoreProvider(...args),
            reportMock,
        };
    };

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

        return renderWithStoreProviderWithReportMock(<Header />, { preloadedState });
    };

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
    ])('should display Header tabs with Buy, Swap and Sell tabs, case %#', config => {
        const { renderer } = renderHeader(config);

        expect(renderer.getByText('Buy')).toBeOnTheScreen();
        expect(renderer.getByText('Swap')).toBeOnTheScreen();
        expect(renderer.getByText('Sell')).toBeOnTheScreen();
    });

    it('should display nothing when isAmountInputActive is true', () => {
        const { renderer } = renderHeader({
            buyEnabled: true,
            tradingPreloadedState: {
                wallet: {
                    trading: {
                        isAmountInputActive: true,
                    } as any,
                },
            },
        });

        expect(renderer.toJSON()).toBeNull();
    });

    it('should set state on tab button press', () => {
        const { store } = initStore(
            getFFPreloadedState({
                buyEnabled: true,
                exchangeEnabled: true,
            }),
        );
        const { renderer } = renderWithStoreProviderWithReportMock(<Header />, {
            store,
        });

        fireEvent.press(renderer.getByText('Swap'));

        expect(store.getState().wallet.trading.activeTradingType).toBe('exchange');
    });

    it('should display trade settings button', () => {
        const { renderer } = renderHeader({
            buyEnabled: true,
            exchangeEnabled: true,
        });

        expect(renderer.getByLabelText('Advanced settings')).toBeOnTheScreen();
    });

    it('should not display settings wheel when AreTradingExchangeDexesEnabled is disabled', () => {
        const { renderer } = renderHeader({
            buyEnabled: true,
            exchangeEnabled: true,
            areTradingExchangeDexesEnabled: false,
        });

        expect(renderer.queryByLabelText('Advanced settings')).toBeNull();
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

        it('should report TradingNavigate event on tab change', () => {
            const { renderer, reportMock } = renderWithStoreProviderWithReportMock(<Header />, {
                store,
            });

            fireEvent.press(renderer.getByText('Swap'));

            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    type: 'exchange',
                    from: 'trade/buy',
                },
            });
        });

        it('should not report TradingNavigate event when tab was not changed', () => {
            const { renderer, reportMock } = renderWithStoreProviderWithReportMock(<Header />, {
                store,
            });

            fireEvent.press(renderer.getByText('Swap'));
            reportMock.mockClear();

            fireEvent.press(renderer.getByText('Swap'));

            expect(reportMock).not.toHaveBeenCalled();
        });

        it('should report TradingNavigate event when tab was changed to buy', () => {
            const { renderer, reportMock } = renderWithStoreProviderWithReportMock(<Header />, {
                store,
            });

            fireEvent.press(renderer.getByText('Swap'));
            reportMock.mockClear();

            fireEvent.press(renderer.getByText('Buy'));

            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    type: 'buy',
                    from: 'trade/exchange',
                },
            });
        });
    });
});
