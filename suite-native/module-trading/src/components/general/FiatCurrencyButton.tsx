import { useMemo } from 'react';
import { Pressable } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { FiatCurrencyCode } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@trezor/utils';

import { FiatCurrencyIcon } from './FiatCurrencyIcon';

export type FiatCurrencyButtonProps = {
    currency?: FiatCurrencyCode;
    onPress: () => void;
};

const GRADIENT_START = { x: 0, y: 0.5 } as const;
const GRADIENT_END = { x: 1, y: 0.5 } as const;

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacings.sp8,
}));

const gradientBackgroundStyle = prepareNativeStyle(({ colors, borders }) => ({
    borderRadius: borders.radii.round,
    borderWidth: borders.widths.small,
    borderColor: hexToRgba(colors.iconDefault, 0.06),
}));

export const FiatCurrencyButton = ({ currency, onPress }: FiatCurrencyButtonProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();

    const fiatBackgroundColor = utils.colors.backgroundAlertBlueBold;
    const gradientColors = useMemo<[ReturnType<typeof hexToRgba>, ReturnType<typeof hexToRgba>]>(
        () => [hexToRgba(fiatBackgroundColor, 0.3), hexToRgba(fiatBackgroundColor, 0.01)],
        [fiatBackgroundColor],
    );

    const displayCurrency = (currency ?? '').toUpperCase();

    return (
        <LinearGradient
            colors={gradientColors}
            style={applyStyle(gradientBackgroundStyle)}
            start={GRADIENT_START}
            end={GRADIENT_END}
        >
            <Pressable
                onPress={onPress}
                style={applyStyle(buttonStyle)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={translate('moduleTrading.selectFiat.buttonTitle')}
            >
                <FiatCurrencyIcon />
                <Text variant="callout" color="textSubdued">
                    {displayCurrency}
                </Text>
                <Icon name="caretDown" color="textSubdued" size="medium" />
            </Pressable>
        </LinearGradient>
    );
};
