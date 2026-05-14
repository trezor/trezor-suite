import { type FiatCurrencyCode } from 'invity-api';

import { getFiatCurrencyFlag } from '@suite-common/flags';
import { Flag, type RoundedIconSize } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

export type FiatCurrencyIconProps = {
    size: 'extraSmall' | 'small' | 'medium';
    value?: FiatCurrencyCode;
};

const fiatIconSizes: Record<FiatCurrencyIconProps['size'], RoundedIconSize> = {
    extraSmall: 20,
    small: 32,
    medium: 48,
};

export const FiatCurrencyIcon = ({ size, value }: FiatCurrencyIconProps) => {
    const flag = getFiatCurrencyFlag(value);

    return flag ? (
        <Flag country={flag} size={fiatIconSizes[size]} />
    ) : (
        <Icon
            name="coin"
            size={fiatIconSizes[size]}
            testID="@trading/fiat-currency-icon-fallback"
        />
    );
};
