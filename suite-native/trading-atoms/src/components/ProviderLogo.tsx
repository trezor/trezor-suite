import { tradeApi } from '@suite-common/trading';
import { Image } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle } from '@trezor/theme';

export type TradingProviderLogoProps = {
    logo: string;
    size?: NativeTypographyStyle;
};

const imageStyle = prepareNativeStyle<{ size: NativeTypographyStyle }>(
    ({ typography, borders }, { size }) => ({
        width: typography[size].lineHeight,
        height: typography[size].lineHeight,
        borderRadius: borders.radii.r4,
    }),
);

export const ProviderLogo = ({ logo, size = 'body-sm' }: TradingProviderLogoProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const logoUrl = tradeApi.getProviderLogoUrl(logo);

    return (
        <Image
            style={applyStyle(imageStyle, { size })}
            source={logoUrl}
            contentFit="contain"
            accessibilityLabel={translate('tradingAtoms.providerLogo')}
        />
    );
};
