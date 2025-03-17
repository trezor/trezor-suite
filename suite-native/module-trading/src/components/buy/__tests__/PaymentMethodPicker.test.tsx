import {
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { PaymentMethodPicker } from '../PaymentMethodPicker';

describe('PaymentMethodPicker', () => {
    const renderPaymentMethodPicker = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return renderWithBasicProvider(<PaymentMethodPicker form={result.current} />);
    };

    it('should display "Not selected" when in default state', async () => {
        const { getByLabelText } = await renderPaymentMethodPicker();
        expect(getByLabelText('No payment method selected')).toHaveTextContent('Not selected');
    });

    it('should allow to select payment method', async () => {
        const { getByText, getByLabelText } = await renderPaymentMethodPicker();

        fireEvent.press(getByText('Payment method'));
        fireEvent.press(getByText('Credit Card'));

        expect(getByLabelText('Selected payment method')).toHaveTextContent('Credit Card');
    });
});
