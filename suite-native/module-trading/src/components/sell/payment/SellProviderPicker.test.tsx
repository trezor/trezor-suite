import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, sellQuotes } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';
import { getIndexOrThrow } from '@trezor/utils';

import { SellProviderPicker } from './SellProviderPicker';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingPreloadedState,
} from '../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../hooks/sell/useSellForm';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('SellProviderPicker', () => {
    let form: SellFormType;

    const renderSellProviderPicker = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithStoreProvider(<SellProviderPicker />, {
            preloadedState: createTradingPreloadedState({ tradeType: 'sell', overrides }),
            services,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();

        const { result } = renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState: createTradingPreloadedState({ tradeType: 'sell' }),
            services,
        });
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render nothing when no quotes are loaded', () => {
        const { toJSON } = renderSellProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', () => {
        const { getByLabelText } = renderSellProviderPicker({
            wallet: { trading: { sell: { isLoading: true } } },
        });

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        const withQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { trading: { sell: { quotes: sellQuotes } } },
        };

        beforeEach(() => {
            act(() => {
                form.setValue('quote', banxaCreditCardSellQuote);
            });
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', () => {
            const { getByLabelText } = renderSellProviderPicker({
                wallet: { trading: { sell: { quotes: sellQuotes, isLoading: true } } },
            });

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
            ).toBeOnTheScreen();
        });

        it('should render selected payment provider', () => {
            const { getByLabelText } = renderSellProviderPicker(withQuotes);

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedProvider')),
            ).toHaveTextContent('Banxa');
        });

        it('should allow to select provider', () => {
            const { getByText, getByLabelText } = renderSellProviderPicker(withQuotes);

            fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.provider')));
            fireEvent.press(getByText('MoonPay'));

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedProvider')),
            ).toHaveTextContent('MoonPay');
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', () => {
                const { getByText } = renderSellProviderPicker(withQuotes);

                fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.provider')));
                fireEvent.press(getByText('MoonPay'));

                expect(reportMock).toHaveBeenCalledTimes(2);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'sell',
                    },
                });
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'sell',
                        parameter: 'provider',
                    },
                });
            });

            it('should not fire analytics event when same provider is selected', () => {
                const { getAllByText } = renderSellProviderPicker(withQuotes);

                fireEvent.press(getIndexOrThrow(getAllByText('Banxa'), 0));
                fireEvent.press(getIndexOrThrow(getAllByText('Banxa'), 1));

                expect(reportMock).toHaveBeenCalledTimes(1);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'sell',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', () => {
                const { getByText } = renderSellProviderPicker({
                    wallet: { trading: { sell: { quotes: sellQuotes, isLoading: true } } },
                });

                fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.provider')));

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
