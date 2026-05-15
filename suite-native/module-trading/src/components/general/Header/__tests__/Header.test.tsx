import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { events } from '@suite-native/analytics';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { type TestStore, fireEvent } from '@suite-native/test-utils-store';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingLightStore,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { Header } from '../Header';

describe('Header', () => {
    const getFFOverrides = (): PreloadedStatePartial<TradingTestPreloadedState> => ({
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    });

    const setupReportMock = () => {
        const reportMock = jest.fn();
        const services = {
            analytics: {
                report: reportMock,
            },
        };

        return { reportMock, services };
    };

    const renderHeader = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = getFFOverrides(),
    ) => {
        const { reportMock, services } = setupReportMock();

        return {
            renderer: renderWithTradingProvider(<Header />, { overrides, services }),
            reportMock,
        };
    };

    const createTestStore = () => createTradingLightStore({ overrides: getFFOverrides() });

    const renderHeaderWithStore = (store: TestStore) => {
        const { reportMock, services } = setupReportMock();

        return {
            renderer: renderWithTradingProvider(<Header />, { services, store }),
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
