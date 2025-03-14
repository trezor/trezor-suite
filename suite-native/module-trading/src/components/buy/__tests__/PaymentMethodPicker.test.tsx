import { fireEvent, render } from '@suite-native/test-utils';

import { PaymentMethodPicker } from '../PaymentMethodPicker';

describe('PaymentMethodPicker', () => {
    const renderPaymentMethodPicker = () => render(<PaymentMethodPicker />);

    it('should display "Not selected" when in default state', () => {
        const { getByLabelText } = renderPaymentMethodPicker();
        expect(getByLabelText('No payment method selected')).toHaveTextContent('Not selected');
    });

    it('should allow to select payment method', () => {
        const { getByText, getByLabelText } = renderPaymentMethodPicker();

        fireEvent.press(getByText('Payment method'));
        fireEvent.press(getByText('Credit Card'));

        expect(getByLabelText('Selected payment method')).toHaveTextContent('Credit Card');
    });
});
