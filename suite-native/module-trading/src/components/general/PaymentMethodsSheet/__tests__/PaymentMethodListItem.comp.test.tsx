import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { PaymentMethodListItem, PaymentMethodListItemProps } from '../PaymentMethodListItem';

describe('PaymentMethodListItem', () => {
    const renderPaymentMethodListItem = (props: Partial<PaymentMethodListItemProps>) =>
        renderWithBasicProvider(
            <PaymentMethodListItem
                method={{ label: 'Credit card', value: 'creditCard' }}
                isSelected={false}
                onPress={jest.fn()}
                {...props}
            />,
        );

    it('should render given name', () => {
        const { getByText } = renderPaymentMethodListItem({
            method: {
                label: 'Debit card',
                value: 'debitCard',
            },
        });

        expect(getByText('Debit card')).toBeDefined();
    });

    it('should call onPress callback on item press', () => {
        const onPress = jest.fn();
        const { getByText } = renderPaymentMethodListItem({ onPress });

        act(() => {
            fireEvent.press(getByText('Credit card'));
        });

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
