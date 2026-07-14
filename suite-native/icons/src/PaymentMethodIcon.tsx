import { Icon } from './Icon';
import { PaymentMethodLogo } from './PaymentMethodLogo';

export type PaymentMethodIconProps = {
    paymentMethod?: string;
    size?: number;
};

export const PaymentMethodIcon = ({ paymentMethod, size = 20 }: PaymentMethodIconProps) => {
    if (!paymentMethod) {
        return null;
    }

    switch (paymentMethod) {
        case 'applePay':
            return <PaymentMethodLogo paymentMethodLogoName="applePay" size={size} />;
        case 'paypal':
            return <PaymentMethodLogo paymentMethodLogoName="paypal" size={size} />;
        case 'googlePay':
            return <PaymentMethodLogo paymentMethodLogoName="googlePay" size={size} />;
        case 'revolutPay':
            return <PaymentMethodLogo paymentMethodLogoName="revolut" size={size} />;
        case 'bankTransfer':
        case 'SEPA':
            return <Icon name="bank" size={size} testID="@icons/payment-method-icon/bank" />;
        case 'creditCard':
            return (
                <Icon
                    name="creditCard"
                    size={size}
                    testID="@icons/payment-method-icon/creditCard"
                />
            );
        default:
            return <Icon name="wallet" size={size} testID="@icons/payment-method-icon/wallet" />;
    }
};
