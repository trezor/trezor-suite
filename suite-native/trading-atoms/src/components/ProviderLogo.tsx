import { Image } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type NativeTypographyStyle } from '@trezor/theme';

export type TradingProviderLogoProps = {
    logo: string;
    size?: NativeTypographyStyle;
};

const LOGO_SOURCE_PATH = 'https://exchange.trezor.io/images/exchange/';

const imageStyle = prepareNativeStyle<{ size: NativeTypographyStyle }>(
    ({ typography }, { size }) => ({
        width: typography[size].lineHeight,
        height: typography[size].lineHeight,
    }),
);

export const ProviderLogo = ({ logo, size = 'body-sm' }: TradingProviderLogoProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const logoUrl = `${LOGO_SOURCE_PATH}${logo}`;

    return (
        <Image
            style={applyStyle(imageStyle, { size })}
            source={logoUrl}
            contentFit="contain"
            accessibilityLabel={translate('tradingAtoms.providerLogo')}
        />
    );
};
