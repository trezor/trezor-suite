import { EnhancedStore } from '@reduxjs/toolkit';
import { BuyTrade } from 'invity-api';

import { tradingBuyActions } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    fireEvent,
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import quotes from '../../../__fixtures__/quotes.json';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { TradingBuyForm } from '../../../types';
import { BuyPaymentMethodPicker } from '../BuyPaymentMethodPicker';

describe('BuyPaymentMethodPicker', () => {
    let form: TradingBuyForm;

    const renderPaymentMethodPicker = async (
        preloadedState: PreloadedState | undefined = {},
        store?: EnhancedStore,
    ) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm());
        form = result.current;

        return renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyPaymentMethodPicker />
            </Form>,
            { preloadedState, store },
        );
    };

    it('should not render when there are no payment methods', async () => {
        const { toJSON } = await renderPaymentMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader when loading initial quotes', async () => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: { buy: { isLoading: true, quotes: [] } } },
        };

        const { getByLabelText } = await renderPaymentMethodPicker(preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        let preloadedState: PreloadedState;

        beforeEach(() => {
            preloadedState = { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } };
        });

        it('should display "Not selected" when no method is selected in form', async () => {
            const { getByLabelText } = await renderPaymentMethodPicker(preloadedState);
            expect(getByLabelText('No payment method selected')).toHaveTextContent('Not selected');
        });

        it('should allow to select payment method', async () => {
            const { getByText, getByLabelText } = await renderPaymentMethodPicker(preloadedState);

            fireEvent.press(getByText('Payment method'));
            fireEvent.press(getByText('Credit Card'));

            expect(getByLabelText('Selected payment method')).toHaveTextContent('Credit Card');
        });

        it('should display loader while quotes are fetched', async () => {
            preloadedState!.wallet!.tradingNew!.buy!.isLoading = true;
            const { getByLabelText } = await renderPaymentMethodPicker(preloadedState);

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', async () => {
            const store = await initStore();
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
            const { getByText } = await renderPaymentMethodPicker(undefined, store);

            fireEvent.press(getByText('Payment method'));
            act(() => {
                store.dispatch(tradingBuyActions.setIsLoading(true));
            });

            expect(getByText('Credit Card')).toBeOnTheScreen();
        });

        describe('analytics', () => {
            const analyticsSpy = jest.spyOn(analytics, 'report');

            beforeEach(() => {
                analyticsSpy.mockClear();
            });

            afterAll(() => {
                analyticsSpy.mockRestore();
            });

            it('should fire analytics event on payment method select', async () => {
                const { getByText } = await renderPaymentMethodPicker(preloadedState);

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getByText('Credit Card'));

                expect(analyticsSpy).toHaveBeenCalledWith({
                    type: EventType.TradingParameterChanged,
                    payload: {
                        type: 'buy',
                        parameter: 'paymentMethod',
                    },
                });
            });

            it('should fire analytics event on payment method change', async () => {
                const { getByText } = await renderPaymentMethodPicker(preloadedState);

                act(() => {
                    // set credit card as selected payment method
                    form.setValue('quote', quotes[1] as BuyTrade);
                });

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getByText('Apple Pay'));

                expect(analyticsSpy).toHaveBeenCalledTimes(1);
            });

            it('should not fire analytics event when same payment method is selected', async () => {
                const { getByText, getAllByText } = await renderPaymentMethodPicker(preloadedState);

                act(() => {
                    // set credit card as selected payment method
                    form.setValue('quote', quotes[1] as BuyTrade);
                });

                fireEvent.press(getByText('Payment method'));
                // 1st Credit Card is the selected one, 2nd is the one in the list
                fireEvent.press(getAllByText('Credit Card')[1]);

                expect(analyticsSpy).toHaveBeenCalledTimes(0);
            });
        });
    });
});
