import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, fireEvent } from '@suite-native/test-utils-store';

import { Header } from './Header';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingLightStore,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('Header', () => {
    const getFFOverrides = (): PreloadedStatePartial<TradingTestPreloadedState> => ({
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
    });

    const setupReportMock = () => {
        const reportMock = jest.fn();
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(reportMock),
        };

        return { reportMock, services };
    };

    const renderHeader = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = getFFOverrides(),
    ) => {
        const { reportMock, services } = setupReportMock();

        return {
            renderer: await renderWithTradingProvider(<Header />, { overrides, services }),
            reportMock,
        };
    };

    const createTestStore = () => createTradingLightStore({ overrides: getFFOverrides() });

    const renderHeaderWithStore = async (store: TestStore) => {
        const { reportMock, services } = setupReportMock();

        return {
            renderer: await renderWithTradingProvider(<Header />, { services, store }),
            reportMock,
        };
    };

    it.each([
        { buy: true, exchange: true, sell: true },
        { buy: true, exchange: false, sell: false },
        { buy: false, exchange: true, sell: false },
        { buy: false, exchange: false, sell: true },
        { buy: false, exchange: false, sell: false },
    ])('should display Buy, Swap and Sell tabs regardless of enabled flags (%o)', async config => {
        const { renderer } = await renderHeader({
            ...getFFOverrides(),
            messageSystem: mockMessageSystemStateWithFeatureFlags({
                'trading.buy': config.buy,
                'trading.exchange': config.exchange,
                'trading.sell': config.sell,
            }),
        });

        expect(
            renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.buy')),
        ).toBeOnTheScreen();
        expect(
            renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.exchange')),
        ).toBeOnTheScreen();
        expect(
            renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.sell')),
        ).toBeOnTheScreen();
    });

    it('should display nothing when isAmountInputActive is true', async () => {
        const { renderer } = await renderHeader({
            ...getFFOverrides(),
            wallet: { trading: { isAmountInputActive: true } },
        });

        expect(renderer.toJSON()).toBeNull();
    });

    it('should set state on tab button press', async () => {
        const store = createTestStore();
        const { renderer } = await renderHeaderWithStore(store);

        await fireEvent.press(
            renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.exchange')),
        );

        expect(store.getState().wallet.trading.activeTradingType).toBe('exchange');
    });

    describe('analytics', () => {
        let store: TestStore;

        beforeEach(() => {
            store = createTestStore();
        });

        it('should report TradingNavigate event on tab change', async () => {
            const { renderer, reportMock } = await renderHeaderWithStore(store);

            await fireEvent.press(
                renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.exchange')),
            );

            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingNavigateEvent.name,
                payload: {
                    action: 'navigate',
                    type: 'exchange',
                    from: 'trade/buy',
                },
            });
        });

        it('should not report TradingNavigate event when tab was not changed', async () => {
            const { renderer, reportMock } = await renderHeaderWithStore(store);

            await fireEvent.press(
                renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.exchange')),
            );
            reportMock.mockClear();

            await fireEvent.press(
                renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.exchange')),
            );

            expect(reportMock).not.toHaveBeenCalled();
        });

        it('should report TradingNavigate event when tab was changed to buy', async () => {
            const { renderer, reportMock } = await renderHeaderWithStore(store);

            await fireEvent.press(
                renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.exchange')),
            );
            reportMock.mockClear();

            await fireEvent.press(
                renderer.getByText(getTranslation('moduleTrading.tradingScreen.tabs.buy')),
            );

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
