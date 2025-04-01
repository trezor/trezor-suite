import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { PaymentMethodPicker } from '../PaymentMethodPicker';

describe('PaymentMethodPicker', () => {
    const renderPaymentMethodPicker = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return renderWithStoreProviderAsync(
            <Form form={result.current}>
                <PaymentMethodPicker />
            </Form>,
            { preloadedState },
        );
    };
    it('should not render when there are no payment methods', async () => {
        const { toJSON } = await renderPaymentMethodPicker();

        expect(toJSON()).toBeNull();
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

            expect(getByLabelText('Fetching offers...')).toBeDefined();
        });
    });
});
