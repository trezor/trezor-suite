import { Pressable } from 'react-native';

import type { FiatCurrencyCode } from 'invity-api';

import { Text, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { FiatCurrencyIcon } from './FiatCurrencyIcon';

export type FiatCurrencyButtonProps = {
    currency?: FiatCurrencyCode;
    onPress: () => void;
    testID?: string;
};

const buttonStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    ...buttonSizeToDimensionsMap.medium,
    gap: spacings.sp8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.legacyBackgroundNeutralSubtleOnElevation1,
    borderColor: colors.borderNeutral,
    borderWidth: borders.widths.small,
}));

export const FiatCurrencyButton = ({ currency, onPress, testID }: FiatCurrencyButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const displayCurrency = (currency ?? '').toUpperCase();
    const tickerTestID = testID ? `${testID}/ticker` : undefined;

    return (
        <Pressable
            onPress={onPress}
            style={applyStyle(buttonStyle)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={translate('moduleTrading.selectFiat.buttonTitle')}
            testID={testID}
        >
            <FiatCurrencyIcon size="extraSmall" />
            <Text variant="body-sm-strong" color="contentPrimary" testID={tickerTestID}>
                {displayCurrency}
            </Text>
            <Icon name="caretDown" color="contentPrimary" size="medium" />
        </Pressable>
    );
};
