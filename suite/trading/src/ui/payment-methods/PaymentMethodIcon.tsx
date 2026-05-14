import { useTheme } from 'styled-components';

import { Icon, type IconSize } from '@trezor/components';

import { PaymentMethodLogo } from './PaymentMethodLogo';

interface PaymentMethodIconProps {
    paymentMethod: string;
    size?: IconSize;
}

export const PaymentMethodIcon = ({ paymentMethod, size = 20 }: PaymentMethodIconProps) => {
    const { variant } = useTheme();
    const isDarkMode = variant === 'dark';

    if (!paymentMethod) {
        return null;
    }
    switch (paymentMethod) {
        case 'applePay':
            return (
                <PaymentMethodLogo
                    paymentMethodLogoName={isDarkMode ? 'applePay_inverse' : 'applePay'}
                    size={size}
                />
            );
        case 'paypal':
            return <PaymentMethodLogo paymentMethodLogoName="paypal" size={size} />;
        case 'googlePay':
            return <PaymentMethodLogo paymentMethodLogoName="googlePay" size={size} />;
        case 'revolutPay':
            return (
                <PaymentMethodLogo
                    paymentMethodLogoName={isDarkMode ? 'revolut_inverse' : 'revolut'}
                    size={size}
                />
            );
        case 'bankTransfer':
        case 'SEPA':
            return <Icon name="bank" size={size} />;
        case 'creditCard':
            return <Icon name="creditCard" size={size} />;
        default:
            return <Icon name="wallet" size={size} />;
    }
};
