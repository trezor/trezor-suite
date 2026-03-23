import { type EnhancedStore } from '@reduxjs/toolkit';

import { tradingBuyActions } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import {
    type PreloadedState,
    act,
    fireEvent,
    initStore,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils';
import { buyQuotes, getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyPaymentMethodPicker } from '../BuyPaymentMethodPicker';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('BuyPaymentMethodPicker', () => {
    let form: BuyFormType;

    const renderPaymentMethodPicker = (
        preloadedState: PreloadedState | undefined = {},
        store?: EnhancedStore,
    ) => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm());
        form = result.current;

        return renderWithStoreProvider(
            <Form form={form}>
                <BuyPaymentMethodPicker />
            </Form>,
            { preloadedState, store },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should not render when there are no payment methods', () => {
        const { toJSON } = renderPaymentMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader when loading initial quotes', () => {
        const preloadedState: PreloadedState = {
            wallet: { trading: { buy: { isLoading: true, quotes: [] } } },
        };

        const { getByLabelText } = renderPaymentMethodPicker(preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        let preloadedState: PreloadedState;

        beforeEach(() => {
            preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        });

        it('should display "Not selected" when no method is selected in form', () => {
            const { getByLabelText } = renderPaymentMethodPicker(preloadedState);
            expect(getByLabelText('No payment method selected')).toHaveTextContent('Not selected');
        });

        it('should allow to select payment method', () => {
            const { getByText, getByLabelText } = renderPaymentMethodPicker(preloadedState);

            fireEvent.press(getByText('Payment method'));
            fireEvent.press(getByText('Credit Card'));

            expect(getByLabelText('Selected payment method')).toHaveTextContent('Credit Card');
        });

        it('should display loader while quotes are fetched', () => {
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { getByLabelText } = renderPaymentMethodPicker(preloadedState);

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', () => {
            const { store } = initStore();
            store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            const { getByText } = renderPaymentMethodPicker(undefined, store);

            fireEvent.press(getByText('Payment method'));
            act(() => {
                store.dispatch(tradingBuyActions.setIsLoading(true));
            });

            expect(getByText('Credit Card')).toBeOnTheScreen();
        });

        describe('analytics', () => {
            beforeEach(() => {
                reportMock.mockClear();
            });

            it('should fire analytics event on payment method select', () => {
                const { getByText } = renderPaymentMethodPicker(preloadedState);

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getByText('Credit Card'));

                expect(reportMock).toHaveBeenCalledWith({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'buy',
                        parameter: 'paymentMethod',
                    },
                });
            });

            it('should fire analytics event on payment method change', () => {
                const { getByText } = renderPaymentMethodPicker(preloadedState);

                act(() => {
                    form.setValue('quote', buyQuotes[1]);
                });

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getByText('Apple Pay'));

                expect(reportMock).toHaveBeenCalledTimes(1);
            });

            it('should not fire analytics event when same payment method is selected', () => {
                const { getByText, getAllByText } = renderPaymentMethodPicker(preloadedState);

                act(() => {
                    form.setValue('quote', buyQuotes[1]);
                });

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getAllByText('Credit Card')[1]);

                expect(reportMock).toHaveBeenCalledTimes(0);
            });
        });
    });
});
