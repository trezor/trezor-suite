import { EnhancedStore } from '@reduxjs/toolkit';

import { tradingBuyActions } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import { act, fireEvent, screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    PreloadedState,
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { buyQuotes, getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';
import { BuyFormType } from '@suite-native/trading-types';

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

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should not render when there are no payment methods', async () => {
        const { toJSON } = await renderPaymentMethodPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display loader when loading initial quotes', async () => {
        const preloadedState: PreloadedState = {
            wallet: { trading: { buy: { isLoading: true, quotes: [] } } },
        };

        const { getByLabelText } = await renderPaymentMethodPicker(preloadedState);

        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    describe('with quotes loaded', () => {
        let preloadedState: PreloadedState;

        beforeEach(() => {
            preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
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
            preloadedState!.wallet!.trading!.buy!.isLoading = true;
            const { getByLabelText } = await renderPaymentMethodPicker(preloadedState);

            expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
        });

        it('should display sheet even while quotes are fetched', async () => {
            const { store } = initStore();
            store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
            const { getByText } = await renderPaymentMethodPicker(undefined, store);

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

            it('should fire analytics event on payment method select', async () => {
                const { getByText } = await renderPaymentMethodPicker(preloadedState);

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

            it('should fire analytics event on payment method change', async () => {
                const { getByText } = await renderPaymentMethodPicker(preloadedState);

                act(() => {
                    form.setValue('quote', buyQuotes[1]);
                });

                fireEvent.press(getByText('Payment method'));
                fireEvent.press(getByText('Apple Pay'));

                expect(reportMock).toHaveBeenCalledTimes(1);
            });

            it('should not fire analytics event when same payment method is selected', async () => {
                const { getByText, getAllByText } = await renderPaymentMethodPicker(preloadedState);

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
