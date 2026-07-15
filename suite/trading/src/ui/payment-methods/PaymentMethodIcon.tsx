import { Icon, type IconSize } from '@trezor/components';
import { BankIcon, CreditCardIcon, WalletIcon } from '@trezor/icons';

import { PaymentMethodLogo } from './PaymentMethodLogo';

interface PaymentMethodIconProps {
    paymentMethod: string;
    size?: IconSize;
}

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
            return <Icon as={BankIcon} size={size} />;
        case 'creditCard':
            return <Icon as={CreditCardIcon} size={size} />;
        default:
            return <Icon as={WalletIcon} size={size} />;
    }
};
