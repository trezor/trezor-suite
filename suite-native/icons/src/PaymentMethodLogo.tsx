import { Image } from 'expo-image';

import { type PaymentMethodLogoName, paymentMethodLogos } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type PaymentMethodLogoProps = {
    paymentMethodLogoName: PaymentMethodLogoName;
    size?: number;
};

const imageStyle = prepareNativeStyle<{ width?: number; height?: number }>(
    (utils, { width, height }) => ({
        width,
        height,
        borderRadius: utils.borders.radii.r4,
    }),
);

export const PaymentMethodLogo = ({ paymentMethodLogoName, size = 20 }: PaymentMethodLogoProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Image
            source={paymentMethodLogos[paymentMethodLogoName]}
            style={[applyStyle(imageStyle, { width: size, height: size })]}
            contentFit="contain"
            testID={`@icons/payment-method-logo/${paymentMethodLogoName}`}
        />
    );
};
