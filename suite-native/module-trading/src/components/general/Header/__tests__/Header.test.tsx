import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { events } from '@suite-native/analytics';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { useAnalytics } from '@suite-native/services';
import { type TestStore, fireEvent } from '@suite-native/test-utils-store';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingLightStore,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { Header } from '../Header';

describe('Header', () => {
    const getFFOverrides = ({
        areTradingExchangeDexesEnabled = true,
    }: {
        areTradingExchangeDexesEnabled?: boolean;
    } = {}): PreloadedStatePartial<TradingTestPreloadedState> => ({
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.AreTradingExchangeDexesEnabled]: areTradingExchangeDexesEnabled,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    });

    const setupReportMock = () => {
        const reportMock = jest.fn();
        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        return reportMock;
    };

    const renderHeader = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = getFFOverrides(),
    ) => {
        const reportMock = setupReportMock();

        return {
            renderer: renderWithTradingProvider(<Header />, { overrides }),
            reportMock,
        };
    };

    const createTestStore = () => createTradingLightStore({ overrides: getFFOverrides() });

    const renderHeaderWithStore = (store: TestStore) => {
        const reportMock = setupReportMock();

        return {
            renderer: renderWithTradingProvider(<Header />, { store }),
            reportMock,
        };
    };

    it.each([
        { buy: true, exchange: true, sell: true },
        { buy: true, exchange: false, sell: false },
        { buy: false, exchange: true, sell: false },
        { buy: false, exchange: false, sell: true },
        { buy: false, exchange: false, sell: false },
    ])('should display Buy, Swap and Sell tabs regardless of enabled flags (%o)', config => {
        const { renderer } = renderHeader({
            ...getFFOverrides(),
            featureFlags: {
                ...featureFlagsInitialState,
                [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
                [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
                [FeatureFlag.IsTradingBuyEnabled]: config.buy,
                [FeatureFlag.IsTradingExchangeEnabled]: config.exchange,
                [FeatureFlag.IsTradingSellEnabled]: config.sell,
            },
            messageSystem: mockMessageSystemStateWithFeatureFlags({
                'trading.buy': config.buy,
                'trading.exchange': config.exchange,
                'trading.sell': config.sell,
            }),
        });

        expect(renderer.getByText('Buy')).toBeOnTheScreen();
        expect(renderer.getByText('Swap')).toBeOnTheScreen();
        expect(renderer.getByText('Sell')).toBeOnTheScreen();
    });

    it('should display nothing when isAmountInputActive is true', () => {
        const { renderer } = renderHeader({
            ...getFFOverrides(),
            wallet: { trading: { isAmountInputActive: true } },
        });

        expect(renderer.toJSON()).toBeNull();
    });

    it('should set state on tab button press', () => {
        const store = createTestStore();
        const { renderer } = renderHeaderWithStore(store);

        fireEvent.press(renderer.getByText('Swap'));

        expect(store.getState().wallet.trading.activeTradingType).toBe('exchange');
    });

    it('should display trade settings button', () => {
        const { renderer } = renderHeader();

        expect(renderer.getByLabelText('Advanced settings')).toBeOnTheScreen();
    });

    it('should not display settings wheel when AreTradingExchangeDexesEnabled is disabled', () => {
        const { renderer } = renderHeader(
            getFFOverrides({ areTradingExchangeDexesEnabled: false }),
        );

        expect(renderer.queryByLabelText('Advanced settings')).toBeNull();
    });

    describe('analytics', () => {
        let store: TestStore;

        beforeEach(() => {
            store = createTestStore();
        });

        it('should report TradingNavigate event on tab change', () => {
            const { renderer, reportMock } = renderHeaderWithStore(store);

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
            const { renderer, reportMock } = renderHeaderWithStore(store);

            fireEvent.press(renderer.getByText('Swap'));
            reportMock.mockClear();

            fireEvent.press(renderer.getByText('Swap'));

            expect(reportMock).not.toHaveBeenCalled();
        });

        it('should report TradingNavigate event when tab was changed to buy', () => {
            const { renderer, reportMock } = renderHeaderWithStore(store);

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
