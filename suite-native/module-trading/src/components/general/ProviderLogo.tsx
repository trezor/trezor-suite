import { Image } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type TradingProviderLogoProps = {
    logo: string;
};

const LOGO_SOURCE_PATH = 'https://exchange.trezor.io/images/exchange/';

const imageStyle = prepareNativeStyle(({ typography }) => ({
    width: typography.body.lineHeight,
    height: typography.body.lineHeight,
}));

export const ProviderLogo = ({ logo }: TradingProviderLogoProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const logoUrl = `${LOGO_SOURCE_PATH}${logo}`;

    return (
        <Image
            style={applyStyle(imageStyle)}
            source={logoUrl}
            contentFit="contain"
            accessibilityLabel={translate('moduleTrading.providerLogo')}
        />
    );
};
