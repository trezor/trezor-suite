import { type PaymentMethodLogoName, paymentMethodLogos } from '@suite-common/icons';
import { type IconSize, Image } from '@trezor/components';

export interface ProviderIconProps {
    paymentMethodLogoName: PaymentMethodLogoName;
    size?: IconSize;
}

/**
 * This component is used to display the logo (colored) of a payment method.
 * It is used in the PaymentMethodIcon component and should not be used directly.
 */
export const PaymentMethodLogo = ({ paymentMethodLogoName, size = 20 }: ProviderIconProps) => {
    const iconSrc = paymentMethodLogos[paymentMethodLogoName];

    return (
        <Image
            imageSrc={iconSrc}
            alt={paymentMethodLogoName}
            width={size}
            height={size}
            data-testid={`@trading/payment-method-logo/${paymentMethodLogoName}`}
        />
    );
};
