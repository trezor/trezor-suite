import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { PaymentMethodDisplay } from './PaymentMethodDisplay';

describe('PaymentMethodDisplay', () => {
    it('renders the payment method icon and translated name accessibly', () => {
        const { getByLabelText, getByTestId, getByText } = renderWithBasicProvider(
            <PaymentMethodDisplay
                accessibilityLabel="Selected payment method"
                paymentMethod="creditCard"
                testID="@test/payment-method"
            />,
        );

        expect(getByTestId('@icons/payment-method-icon/creditCard')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.creditCard')),
        ).toBeOnTheScreen();
        expect(getByLabelText('Selected payment method')).toBeOnTheScreen();
        expect(getByTestId('@test/payment-method')).toBeOnTheScreen();
    });

    it('renders the provider name for an untranslated payment method', () => {
        const { getByTestId, getByText } = renderWithBasicProvider(
            <PaymentMethodDisplay
                paymentMethod="providerMethod"
                paymentMethodName="Provider method"
            />,
        );

        expect(getByTestId('@icons/payment-method-icon/wallet')).toBeOnTheScreen();
        expect(getByText('Provider method')).toBeOnTheScreen();
    });
});
