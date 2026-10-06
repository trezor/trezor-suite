import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import {
    PaymentMethodTranslation,
    type PaymentMethodTranslationProps,
} from './PaymentMethodTranslation';

describe('PaymentMethodTranslation', () => {
    const renderPaymentMethodTranslation = async (props: PaymentMethodTranslationProps) =>
        await renderWithBasicProvider(
            <Text>
                <PaymentMethodTranslation {...props} />
            </Text>,
        );

    it('should render known payment method translation', async () => {
        const { getByText } = await renderPaymentMethodTranslation({
            paymentMethod: 'creditCard',
        });

        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.creditCard')),
        ).toBeOnTheScreen();
    });

    it('should render payment method name when payment method is unknown', async () => {
        const { getByText } = await renderPaymentMethodTranslation({
            paymentMethod: 'customMethod',
            paymentMethodName: 'Custom Method',
        });

        expect(getByText('Custom Method')).toBeOnTheScreen();
    });

    it('should render payment method when payment method name is missing', async () => {
        const { getByText } = await renderPaymentMethodTranslation({
            paymentMethod: 'customMethod',
            paymentMethodName: '',
        });

        expect(getByText('customMethod')).toBeOnTheScreen();
    });

    it('should render empty string when no payment method or name is provided', async () => {
        const { getByText } = await renderPaymentMethodTranslation({});

        expect(getByText('')).toBeOnTheScreen();
    });
});
