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
import { useSellForm } from '../../../hooks/sell/useSellForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingPreloadedState,
} from '../../../test-utils/tradingTestUtils';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('SellProviderPicker', () => {
    let form: SellFormType;

    const renderSellProviderPicker = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithStoreProvider(<SellProviderPicker />, {
            preloadedState: createTradingPreloadedState({ tradeType: 'sell', overrides }),
            services,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        jest.clearAllMocks();

        const { result } = await renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState: createTradingPreloadedState({ tradeType: 'sell' }),
            services,
        });
        form = result.current;
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render nothing when no quotes are loaded', async () => {
        const { toJSON } = await renderSellProviderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should render loading skeleton when no quotes are loaded and new quotes are loading', async () => {
        const { getByLabelText } = await renderSellProviderPicker({
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

        beforeEach(async () => {
            await act(() => {
                form.setValue('quote', banxaCreditCardSellQuote);
            });
        });

        it('should render loading skeleton when quotes are loaded and new quotes are loading', async () => {
            const { getByLabelText } = await renderSellProviderPicker({
                wallet: { trading: { sell: { quotes: sellQuotes, isLoading: true } } },
            });

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
            ).toBeOnTheScreen();
        });

        it('should render selected payment provider', async () => {
            const { getByLabelText } = await renderSellProviderPicker(withQuotes);

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedProvider')),
            ).toHaveTextContent('Banxa');
        });

        it('should allow to select provider', async () => {
            const { getByText, getByLabelText } = await renderSellProviderPicker(withQuotes);

            await fireEvent.press(
                getByText(getTranslation('moduleTrading.tradingScreen.provider')),
            );
            await fireEvent.press(getByText('MoonPay'));

            expect(
                getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedProvider')),
            ).toHaveTextContent('MoonPay');
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on provider select', async () => {
                const { getByText } = await renderSellProviderPicker(withQuotes);

                await fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                );
                await fireEvent.press(getByText('MoonPay'));

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

            it('should not fire analytics event when same provider is selected', async () => {
                const { getAllByText } = await renderSellProviderPicker(withQuotes);

                await fireEvent.press(getIndexOrThrow(getAllByText('Banxa'), 0));
                await fireEvent.press(getIndexOrThrow(getAllByText('Banxa'), 1));

                expect(reportMock).toHaveBeenCalledTimes(1);
                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingCompareOffersEvent.name,
                    payload: {
                        type: 'sell',
                    },
                });
            });

            it('should not call analytics when user tries to open sheet while quotes are loading', async () => {
                const { getByText } = await renderSellProviderPicker({
                    wallet: { trading: { sell: { quotes: sellQuotes, isLoading: true } } },
                });

                await fireEvent.press(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                );

                expect(reportMock).not.toHaveBeenCalled();
            });
        });
    });
});
