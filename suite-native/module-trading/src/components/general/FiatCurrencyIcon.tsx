import { type FiatCurrencyCode } from 'invity-api';

import { getFiatCurrencyFlag } from '@suite-common/flags';
import { Flag, RoundedIcon, type RoundedIconSize } from '@suite-native/atoms';

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
        <RoundedIcon intent="neutral" size={fiatIconSizes[size]}>
            <Flag country={flag} />
        </RoundedIcon>
    ) : (
        <RoundedIcon
            testID="@trading/fiat-currency-icon-fallback"
            name="coin"
            intent="neutral"
            size={fiatIconSizes[size]}
        />
    );
};
