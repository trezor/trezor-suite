import { Pressable } from 'react-native';

import { FiatCurrencyCode } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FiatCurrencyIcon } from './FiatCurrencyIcon';

export type FiatCurrencyButtonProps = {
    currency?: FiatCurrencyCode;
    onPress: () => void;
};

const buttonStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    height: spacings.sp40,
    paddingHorizontal: spacings.sp8,
    gap: spacings.sp8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSurfaceElevation1,
    borderColor: colors.borderElevation0,
    borderRadius: borders.radii.round,
    borderWidth: borders.widths.small,
}));

export const FiatCurrencyButton = ({ currency, onPress }: FiatCurrencyButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const displayCurrency = (currency ?? '').toUpperCase();

    return (
        <Pressable
            onPress={onPress}
            style={applyStyle(buttonStyle)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={translate('moduleTrading.selectFiat.buttonTitle')}
        >
            <FiatCurrencyIcon size="small" />
            <Text variant="callout" color="textSubdued">
                {displayCurrency}
            </Text>
            <Icon name="caretDown" color="textSubdued" size="medium" />
        </Pressable>
    );
};
